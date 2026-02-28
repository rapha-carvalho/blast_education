import calendar
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import stripe
from fastapi import Depends, HTTPException, status

from app.config import (
    ACCESS_DURATION_MONTHS,
    BILLING_COURSE_ID,
    CHECKOUT_SIGNUP_INTENT_TTL_HOURS,
    CHECKOUT_CANCEL_URL,
    CHECKOUT_RETURN_URL,
    CHECKOUT_SUCCESS_URL,
    CPF_ENCRYPTION_KEY,
    STRIPE_AUTOMATIC_TAX_ENABLED,
    STRIPE_CARD_INSTALLMENTS_ENABLED,
    STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES,
    STRIPE_CHECKOUT_LOCALE,
    STRIPE_PRICE_ID,
    STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_WEBHOOK_SECRET_FILE,
)
from app.services.auth_service import (
    hash_password,
    is_valid_email,
    require_authenticated_user,
    validate_password_strength,
)
from app.services.access_service import (
    compute_effective_access_status,
    has_active_course_access,
    sync_user_effective_status,
)
from app.services.crypto_service import encrypt_cpf, normalize_cpf
from app.services.user_db import (
    ACCESS_STATUS_VALUES,
    attach_checkout_session_to_purchase,
    create_admin_audit_log,
    create_purchase,
    create_checkout_signup_intent,
    create_user,
    expire_old_checkout_signup_intents,
    get_access_grant,
    get_checkout_signup_intent_by_id,
    get_latest_purchase_for_user_any_status,
    get_purchase_by_checkout_session_id,
    get_purchase_by_id,
    get_purchase_by_payment_intent_id,
    get_user_by_email,
    get_user_by_id,
    get_user_by_stripe_customer_id,
    mark_purchase_paid,
    mark_checkout_signup_intent_completed,
    mark_checkout_signup_intent_session_created,
    mark_purchase_refunded_by_payment_intent,
    update_purchase_status,
    update_user_access_state,
    update_user_cpf_if_empty,
    update_user_stripe_customer_id,
    upsert_access_grant,
)

logger = logging.getLogger(__name__)
_webhook_secret_format_warned = False


def _obj_get(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    getter = getattr(obj, "get", None)
    if callable(getter):
        return getter(key, default)
    return getattr(obj, key, default)


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _metadata_as_dict(raw: Any) -> dict[str, str]:
    if isinstance(raw, dict):
        return {str(k): str(v) for k, v in raw.items() if v is not None}
    return {}


def _normalize_course_id(course_id: str | None) -> str:
    normalized = (course_id or BILLING_COURSE_ID).strip() or BILLING_COURSE_ID
    if normalized != BILLING_COURSE_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported course_id '{normalized}'.",
        )
    return normalized


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _get_webhook_secret(*, log_invalid: bool = True) -> str:
    global _webhook_secret_format_warned
    if STRIPE_WEBHOOK_SECRET:
        if STRIPE_WEBHOOK_SECRET.startswith("whsec_"):
            return STRIPE_WEBHOOK_SECRET
        if log_invalid and not _webhook_secret_format_warned:
            logger.warning("stripe_webhook_secret_invalid_format_using_file_fallback")
            _webhook_secret_format_warned = True
    if STRIPE_WEBHOOK_SECRET_FILE:
        try:
            raw = Path(STRIPE_WEBHOOK_SECRET_FILE).read_text(encoding="utf-8")
        except FileNotFoundError:
            return ""
        except Exception:
            logger.exception("stripe_webhook_secret_file_read_failed path=%s", STRIPE_WEBHOOK_SECRET_FILE)
            return ""
        secret = raw.strip()
        if secret.startswith("whsec_"):
            return secret
        return ""
    return ""


def _require_checkout_config() -> None:
    missing = []
    if not STRIPE_SECRET_KEY:
        missing.append("STRIPE_SECRET_KEY")
    if not STRIPE_PRICE_ID:
        missing.append("STRIPE_PRICE_ID")
    if not CHECKOUT_SUCCESS_URL:
        missing.append("CHECKOUT_SUCCESS_URL")
    if not CHECKOUT_CANCEL_URL:
        missing.append("CHECKOUT_CANCEL_URL")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing Stripe checkout config: {', '.join(missing)}",
        )


def _require_embedded_checkout_config() -> None:
    missing = []
    if not STRIPE_SECRET_KEY:
        missing.append("STRIPE_SECRET_KEY")
    if not STRIPE_PUBLISHABLE_KEY:
        missing.append("STRIPE_PUBLISHABLE_KEY")
    if not STRIPE_PRICE_ID:
        missing.append("STRIPE_PRICE_ID")
    if not CHECKOUT_RETURN_URL:
        missing.append("CHECKOUT_RETURN_URL")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing embedded checkout config: {', '.join(missing)}",
        )


def _require_public_checkout_config() -> None:
    missing = []
    if not STRIPE_SECRET_KEY:
        missing.append("STRIPE_SECRET_KEY")
    if not STRIPE_PRICE_ID:
        missing.append("STRIPE_PRICE_ID")
    if not CHECKOUT_SUCCESS_URL:
        missing.append("CHECKOUT_SUCCESS_URL")
    if not CHECKOUT_CANCEL_URL:
        missing.append("CHECKOUT_CANCEL_URL")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing public checkout config: {', '.join(missing)}",
        )


def _require_webhook_config() -> None:
    missing = []
    if not STRIPE_SECRET_KEY:
        missing.append("STRIPE_SECRET_KEY")
    if not _get_webhook_secret(log_invalid=False):
        if STRIPE_WEBHOOK_SECRET_FILE:
            missing.append("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_FILE")
        else:
            missing.append("STRIPE_WEBHOOK_SECRET")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing Stripe webhook config: {', '.join(missing)}",
        )


def _configure_stripe() -> None:
    stripe.api_key = STRIPE_SECRET_KEY


def _add_months(unix_ts: int, months: int) -> int:
    if months <= 0:
        return unix_ts
    dt = datetime.fromtimestamp(unix_ts, tz=timezone.utc)
    base_month = dt.month - 1 + months
    year = dt.year + (base_month // 12)
    month = (base_month % 12) + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(dt.day, last_day)
    shifted = dt.replace(year=year, month=month, day=day)
    return int(shifted.timestamp())


def _build_checkout_params(
    *,
    user_id: int,
    course_id: str,
    metadata: dict[str, str],
    user_row: dict[str, Any],
    embedded: bool,
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "mode": "payment",
        "line_items": [{"price": STRIPE_PRICE_ID, "quantity": 1}],
        "client_reference_id": str(user_id),
        "metadata": metadata,
        "payment_intent_data": {"metadata": metadata},
    }
    if embedded:
        params["ui_mode"] = "embedded"
        params["return_url"] = CHECKOUT_RETURN_URL
        params["allow_promotion_codes"] = True
    else:
        params["success_url"] = CHECKOUT_SUCCESS_URL
        params["cancel_url"] = CHECKOUT_CANCEL_URL

    if STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES:
        params["payment_method_types"] = STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES
    if STRIPE_CHECKOUT_LOCALE:
        params["locale"] = STRIPE_CHECKOUT_LOCALE
    if STRIPE_CARD_INSTALLMENTS_ENABLED:
        params["payment_method_options"] = {
            "card": {
                "installments": {"enabled": True},
            }
        }
    if STRIPE_AUTOMATIC_TAX_ENABLED:
        params["automatic_tax"] = {"enabled": True}

    stripe_customer_id = (user_row.get("stripe_customer_id") or "").strip()
    email = (user_row.get("email") or "").strip()
    if stripe_customer_id:
        params["customer"] = stripe_customer_id
    elif email:
        params["customer_email"] = email

    # Future-proof metadata alignment if course catalog grows.
    params["metadata"]["course_id"] = course_id
    return params


def _build_public_checkout_params(
    *,
    email: str,
    course_id: str,
    metadata: dict[str, str],
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "mode": "payment",
        "line_items": [{"price": STRIPE_PRICE_ID, "quantity": 1}],
        "customer_email": email,
        "allow_promotion_codes": True,
        "success_url": CHECKOUT_SUCCESS_URL,
        "cancel_url": CHECKOUT_CANCEL_URL,
        "metadata": metadata,
        "payment_intent_data": {"metadata": metadata},
        "custom_fields": [
            {
                "key": "cpf",
                "label": {"type": "custom", "custom": "CPF"},
                "type": "text",
                "optional": False,
                "text": {"minimum_length": 11, "maximum_length": 14},
            }
        ],
    }
    if STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES:
        params["payment_method_types"] = STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES
    if STRIPE_CHECKOUT_LOCALE:
        params["locale"] = STRIPE_CHECKOUT_LOCALE
    if STRIPE_CARD_INSTALLMENTS_ENABLED:
        params["payment_method_options"] = {
            "card": {
                "installments": {"enabled": True},
            }
        }
    if STRIPE_AUTOMATIC_TAX_ENABLED:
        params["automatic_tax"] = {"enabled": True}
    params["metadata"]["course_id"] = course_id
    return params


def _build_public_embedded_checkout_params(
    *,
    email: str,
    course_id: str,
    metadata: dict[str, str],
) -> dict[str, Any]:
    params = _build_public_checkout_params(
        email=email,
        course_id=course_id,
        metadata=metadata,
    )
    params.pop("success_url", None)
    params.pop("cancel_url", None)
    params["ui_mode"] = "embedded"
    params["return_url"] = CHECKOUT_RETURN_URL
    return params


def _create_stripe_checkout_session(
    params: dict[str, Any],
    purchase_id: int | None,
    user_id: int | None,
) -> Any:
    try:
        return stripe.checkout.Session.create(**params)
    except stripe.error.InvalidRequestError as exc:
        param = str(getattr(exc, "param", "") or "")
        payment_methods = params.get("payment_method_types") or []
        payment_method_options = params.get("payment_method_options") or {}
        if payment_methods:
            retry_params = {**params}
            retry_params.pop("payment_method_types", None)
            logger.warning(
                "stripe_checkout_payment_methods_retry purchase_id=%s user_id=%s methods=%s error=%s",
                purchase_id,
                user_id,
                ",".join(payment_methods),
                str(exc),
            )
            try:
                return stripe.checkout.Session.create(**retry_params)
            except stripe.error.StripeError as retry_exc:
                if purchase_id:
                    update_purchase_status(
                        purchase_id,
                        status="failed",
                        metadata={"error_type": retry_exc.__class__.__name__, "error_message": str(retry_exc)},
                    )
                logger.exception(
                    "stripe_checkout_session_create_failed_after_retry purchase_id=%s user_id=%s",
                    purchase_id,
                    user_id,
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Could not create Stripe Checkout session",
                ) from retry_exc

        if payment_method_options and ("payment_method_options" in param or "installments" in str(exc).lower()):
            retry_params = {**params}
            retry_params.pop("payment_method_options", None)
            logger.warning(
                "stripe_checkout_installments_retry_without_options purchase_id=%s user_id=%s error=%s",
                purchase_id,
                user_id,
                str(exc),
            )
            try:
                return stripe.checkout.Session.create(**retry_params)
            except stripe.error.StripeError as retry_exc:
                if purchase_id:
                    update_purchase_status(
                        purchase_id,
                        status="failed",
                        metadata={"error_type": retry_exc.__class__.__name__, "error_message": str(retry_exc)},
                    )
                logger.exception(
                    "stripe_checkout_session_create_failed_after_installments_retry purchase_id=%s user_id=%s",
                    purchase_id,
                    user_id,
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Could not create Stripe Checkout session",
                ) from retry_exc

        if purchase_id:
            update_purchase_status(
                purchase_id,
                status="failed",
                metadata={"error_type": exc.__class__.__name__, "error_message": str(exc)},
            )
        logger.exception("stripe_checkout_session_create_failed purchase_id=%s user_id=%s", purchase_id, user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create Stripe Checkout session",
        ) from exc
    except stripe.error.StripeError as exc:
        if purchase_id:
            update_purchase_status(
                purchase_id,
                status="failed",
                metadata={"error_type": exc.__class__.__name__, "error_message": str(exc)},
            )
        logger.exception("stripe_checkout_session_create_failed purchase_id=%s user_id=%s", purchase_id, user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create Stripe Checkout session",
        ) from exc


def _set_user_access_from_stripe(
    user_id: int,
    *,
    access_status: str,
    expires_at: int | None,
    event_type: str,
) -> bool:
    user_row = get_user_by_id(user_id)
    if not user_row:
        return False
    user_row = sync_user_effective_status(user_row)
    managed_by = str(user_row.get("access_managed_by") or "stripe")
    if managed_by == "admin":
        logger.info(
            "stripe_access_update_skipped_manual_override user_id=%s event_type=%s status=%s",
            user_id,
            event_type,
            access_status,
        )
        return False

    safe_status = access_status if access_status in ACCESS_STATUS_VALUES else "expired"
    update_user_access_state(
        user_id,
        access_status=safe_status,
        expires_at=expires_at,
        access_managed_by="stripe",
    )
    return True


def require_course_access(user: dict = Depends(require_authenticated_user)) -> dict:
    user_id = int(user["id"])
    user_row = get_user_by_id(user_id)
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user_row = sync_user_effective_status(user_row)
    if has_active_course_access(user_row.get("access_status"), user_row.get("expires_at")):
        return user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Active course access is required. Complete payment to unlock the course.",
    )


def get_user_access_status(user_id: int) -> dict[str, Any]:
    user_row = get_user_by_id(user_id)
    if user_row:
        user_row = sync_user_effective_status(user_row)
    access_status = str(user_row.get("access_status") if user_row else "expired")
    effective_status = compute_effective_access_status(
        access_status,
        _to_int(user_row.get("expires_at")) if user_row else None,
    )
    latest = get_access_grant(user_id, BILLING_COURSE_ID)
    return {
        "course_id": BILLING_COURSE_ID,
        "has_access": has_active_course_access(
            access_status,
            _to_int(user_row.get("expires_at")) if user_row else None,
        ),
        "access_status": effective_status,
        "starts_at": _to_int(latest.get("starts_at")) if latest else None,
        "expires_at": _to_int(user_row.get("expires_at")) if user_row else None,
    }


def start_public_checkout(email: str, password: str, course_id: str | None = None) -> dict[str, Any]:
    _require_public_checkout_config()
    _configure_stripe()
    expire_old_checkout_signup_intents()

    clean_email = _normalize_email(email)
    if not is_valid_email(clean_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")
    password_err = validate_password_strength(password)
    if password_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_err)
    if get_user_by_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered. Please log in to complete your purchase.",
        )

    normalized_course_id = _normalize_course_id(course_id)
    expires_at = int(time.time()) + max(1, CHECKOUT_SIGNUP_INTENT_TTL_HOURS) * 3600
    intent = create_checkout_signup_intent(
        email=clean_email,
        password_hash=hash_password(password),
        course_id=normalized_course_id,
        expires_at=expires_at,
        status="created",
    )
    checkout_intent_id = str(intent["id"])
    metadata = {
        "checkout_intent_id": checkout_intent_id,
        "course_id": normalized_course_id,
    }
    params = _build_public_checkout_params(
        email=clean_email,
        course_id=normalized_course_id,
        metadata=metadata,
    )
    session = _create_stripe_checkout_session(params, purchase_id=None, user_id=None)
    session_id = str(_obj_get(session, "id") or "")
    session_url = str(_obj_get(session, "url") or "")
    if not session_id or not session_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe Checkout session is missing required fields",
        )

    updated_intent = mark_checkout_signup_intent_session_created(
        intent_id=checkout_intent_id,
        stripe_checkout_session_id=session_id,
    )
    logger.info(
        "stripe_public_checkout_session_created checkout_intent_id=%s session_id=%s course_id=%s",
        checkout_intent_id,
        session_id,
        normalized_course_id,
    )
    return {
        "session_id": session_id,
        "session_url": session_url,
        "checkout_intent_id": checkout_intent_id,
        "expires_at": _to_int((updated_intent or intent).get("expires_at")) or expires_at,
    }


def start_public_embedded_checkout(email: str, password: str, course_id: str | None = None) -> dict[str, Any]:
    _require_embedded_checkout_config()
    _configure_stripe()
    expire_old_checkout_signup_intents()

    clean_email = _normalize_email(email)
    if not is_valid_email(clean_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")
    password_err = validate_password_strength(password)
    if password_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_err)
    if get_user_by_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered. Please log in to complete your purchase.",
        )

    normalized_course_id = _normalize_course_id(course_id)
    expires_at = int(time.time()) + max(1, CHECKOUT_SIGNUP_INTENT_TTL_HOURS) * 3600
    intent = create_checkout_signup_intent(
        email=clean_email,
        password_hash=hash_password(password),
        course_id=normalized_course_id,
        expires_at=expires_at,
        status="created",
    )
    checkout_intent_id = str(intent["id"])
    metadata = {
        "checkout_intent_id": checkout_intent_id,
        "course_id": normalized_course_id,
    }
    params = _build_public_embedded_checkout_params(
        email=clean_email,
        course_id=normalized_course_id,
        metadata=metadata,
    )
    session = _create_stripe_checkout_session(params, purchase_id=None, user_id=None)
    session_id = str(_obj_get(session, "id") or "")
    client_secret = str(_obj_get(session, "client_secret") or "")
    if not session_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Embedded checkout session is missing required fields",
        )

    updated_intent = mark_checkout_signup_intent_session_created(
        intent_id=checkout_intent_id,
        stripe_checkout_session_id=session_id,
    )
    logger.info(
        "stripe_public_embedded_checkout_session_created checkout_intent_id=%s session_id=%s course_id=%s",
        checkout_intent_id,
        session_id,
        normalized_course_id,
    )
    return {
        "session_id": session_id,
        "client_secret": client_secret,
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "checkout_intent_id": checkout_intent_id,
        "expires_at": _to_int((updated_intent or intent).get("expires_at")) or expires_at,
    }


def create_checkout_session_for_user(user: dict) -> dict[str, Any]:
    _require_checkout_config()
    _configure_stripe()

    user_id = int(user["id"])
    course_id = _normalize_course_id(None)

    purchase = create_purchase(
        user_id=user_id,
        course_id=course_id,
        status="pending",
        metadata={"source": "stripe_checkout"},
    )
    purchase_id = int(purchase["id"])
    metadata = {
        "purchase_id": str(purchase_id),
        "user_id": str(user_id),
        "course_id": course_id,
    }
    user_row = get_user_by_id(user_id) or {}
    params = _build_checkout_params(
        user_id=user_id,
        course_id=course_id,
        metadata=metadata,
        user_row=user_row,
        embedded=False,
    )
    session = _create_stripe_checkout_session(params, purchase_id=purchase_id, user_id=user_id)
    session_id = _obj_get(session, "id")
    attach_checkout_session_to_purchase(
        purchase_id,
        stripe_checkout_session_id=str(session_id or ""),
        metadata={"stripe_checkout_session_id": str(session_id or "")},
    )
    logger.info(
        "stripe_checkout_session_created purchase_id=%s user_id=%s session_id=%s payment_method_types=%s",
        purchase_id,
        user_id,
        session_id,
        _obj_get(session, "payment_method_types"),
    )
    return {
        "session_id": str(session_id or ""),
        "session_url": str(_obj_get(session, "url") or ""),
        "purchase_id": purchase_id,
    }


def create_embedded_checkout_session_for_user(user: dict, course_id: str | None = None) -> dict[str, Any]:
    _require_embedded_checkout_config()
    _configure_stripe()

    user_id = int(user["id"])
    normalized_course_id = _normalize_course_id(course_id)
    purchase = create_purchase(
        user_id=user_id,
        course_id=normalized_course_id,
        status="pending",
        metadata={"source": "stripe_embedded_checkout"},
    )
    purchase_id = int(purchase["id"])
    metadata = {
        "purchase_id": str(purchase_id),
        "user_id": str(user_id),
        "course_id": normalized_course_id,
    }
    user_row = get_user_by_id(user_id) or {}
    params = _build_checkout_params(
        user_id=user_id,
        course_id=normalized_course_id,
        metadata=metadata,
        user_row=user_row,
        embedded=True,
    )
    session = _create_stripe_checkout_session(params, purchase_id=purchase_id, user_id=user_id)
    session_id = str(_obj_get(session, "id") or "")
    client_secret = str(_obj_get(session, "client_secret") or "")
    if not client_secret:
        update_purchase_status(
            purchase_id,
            status="failed",
            metadata={"error_type": "missing_client_secret", "error_message": "Embedded checkout missing client_secret"},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Embedded checkout session is missing client secret",
        )

    attach_checkout_session_to_purchase(
        purchase_id,
        stripe_checkout_session_id=session_id,
        metadata={"stripe_checkout_session_id": session_id, "ui_mode": "embedded"},
    )
    logger.info(
        "stripe_embedded_checkout_session_created purchase_id=%s user_id=%s session_id=%s payment_method_types=%s",
        purchase_id,
        user_id,
        session_id,
        _obj_get(session, "payment_method_types"),
    )
    return {
        "session_id": session_id,
        "client_secret": client_secret,
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "purchase_id": purchase_id,
    }


def construct_stripe_event(payload: bytes, signature: str | None) -> Any:
    _require_webhook_config()
    _configure_stripe()
    webhook_secret = _get_webhook_secret()

    if not signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature header")

    try:
        return stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=webhook_secret)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature") from exc


def _resolve_purchase_from_metadata(metadata: dict[str, str], session_id: str | None = None) -> dict | None:
    purchase_id = _to_int(metadata.get("purchase_id"))
    if purchase_id:
        purchase = get_purchase_by_id(purchase_id)
        if purchase:
            return purchase
    if session_id:
        return get_purchase_by_checkout_session_id(session_id)
    return None


def _grant_access_for_purchase(purchase: dict, paid_at: int) -> None:
    user_id = int(purchase["user_id"])
    course_id = str(purchase["course_id"])
    starts_at = paid_at
    expires_at = _add_months(starts_at, ACCESS_DURATION_MONTHS)
    upsert_access_grant(user_id=user_id, course_id=course_id, starts_at=starts_at, expires_at=expires_at)
    _set_user_access_from_stripe(
        user_id,
        access_status="active",
        expires_at=expires_at,
        event_type="payment_granted",
    )


def _extract_discount_entries(session_obj: Any) -> list[Any]:
    discounts = _obj_get(session_obj, "discounts", []) or []
    if isinstance(discounts, dict):
        data = discounts.get("data")
        if isinstance(data, list):
            return data
    if isinstance(discounts, list):
        return discounts
    return []


def _extract_discount_metadata(session_obj: Any) -> dict[str, Any]:
    total_details = _obj_get(session_obj, "total_details", {}) or {}
    amount_discount = _to_int(_obj_get(total_details, "amount_discount"))
    discount_entries = _extract_discount_entries(session_obj)

    discounts_out: list[dict[str, Any]] = []
    promotion_codes: list[dict[str, str]] = []

    for entry in discount_entries:
        discount_obj = _obj_get(entry, "discount", entry)
        discount_id = ""
        if isinstance(discount_obj, str):
            discount_id = discount_obj
        else:
            discount_id = str(_obj_get(discount_obj, "id") or "")

        promo_obj = _obj_get(discount_obj, "promotion_code")
        promo_id = ""
        promo_code = ""
        if isinstance(promo_obj, str):
            promo_id = promo_obj
        elif promo_obj:
            promo_id = str(_obj_get(promo_obj, "id") or "")
            promo_code = str(_obj_get(promo_obj, "code") or "")

        if promo_id and not promo_code:
            try:
                promo = stripe.PromotionCode.retrieve(promo_id)
                promo_code = str(_obj_get(promo, "code") or "")
            except stripe.error.StripeError:
                logger.warning("stripe_promotion_code_lookup_failed promotion_code_id=%s", promo_id)

        discount_item: dict[str, Any] = {}
        if discount_id:
            discount_item["discount_id"] = discount_id
        if promo_id:
            discount_item["promotion_code_id"] = promo_id
            if promo_code:
                discount_item["promotion_code"] = promo_code
                promotion_codes.append({"id": promo_id, "code": promo_code})
        amount_off = _to_int(_obj_get(entry, "amount"))
        if amount_off is not None:
            discount_item["amount"] = amount_off
        if discount_item:
            discounts_out.append(discount_item)

    metadata: dict[str, Any] = {}
    if amount_discount is not None:
        metadata["amount_discount"] = amount_discount
    if discounts_out:
        metadata["discounts"] = discounts_out
    if promotion_codes:
        metadata["promotion_codes"] = promotion_codes
    return metadata


def _retrieve_session_with_expanded_discounts(session_id: str) -> Any | None:
    if not session_id:
        return None
    try:
        return stripe.checkout.Session.retrieve(
            session_id,
            expand=["discounts.discount.promotion_code"],
        )
    except stripe.error.StripeError:
        logger.warning("stripe_session_discount_expand_failed session_id=%s", session_id)
        return None


def _extract_custom_field_text(session_obj: Any, field_key: str) -> str:
    custom_fields = _obj_get(session_obj, "custom_fields", []) or []
    if isinstance(custom_fields, dict):
        custom_fields = custom_fields.get("data") or []
    if not isinstance(custom_fields, list):
        return ""
    for field in custom_fields:
        if str(_obj_get(field, "key") or "") != field_key:
            continue
        text_block = _obj_get(field, "text", {})
        return str(_obj_get(text_block, "value") or "").strip()
    return ""


def _extract_cpf_from_checkout_session(payload: Any, session_id: str) -> str:
    cpf_value = _extract_custom_field_text(payload, "cpf")
    if cpf_value:
        return cpf_value
    if not session_id:
        return ""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError:
        logger.warning("stripe_checkout_session_retrieve_failed_for_cpf session_id=%s", session_id)
        return ""
    return _extract_custom_field_text(session, "cpf")


def _handle_checkout_signup_intent_completion(
    payload: Any,
    event_id: str,
    event_created: int,
    checkout_intent_id: str,
) -> None:
    now_ts = int(time.time())
    expire_old_checkout_signup_intents(now_ts=now_ts)
    intent = get_checkout_signup_intent_by_id(checkout_intent_id)
    session_id = str(_obj_get(payload, "id") or "")
    if not intent:
        logger.warning(
            "stripe_checkout_signup_intent_missing event_id=%s checkout_intent_id=%s session_id=%s",
            event_id,
            checkout_intent_id,
            session_id,
        )
        return
    if int(intent.get("expires_at") or 0) <= now_ts and str(intent.get("status") or "") != "completed":
        logger.warning(
            "stripe_checkout_signup_intent_expired event_id=%s checkout_intent_id=%s session_id=%s",
            event_id,
            checkout_intent_id,
            session_id,
        )
        return
    if str(intent.get("status") or "") == "completed":
        logger.info(
            "stripe_checkout_signup_intent_duplicate event_id=%s checkout_intent_id=%s",
            event_id,
            checkout_intent_id,
        )
        return

    cpf_raw = _extract_cpf_from_checkout_session(payload, session_id=session_id)
    if not cpf_raw:
        logger.warning(
            "stripe_checkout_signup_intent_missing_cpf event_id=%s checkout_intent_id=%s",
            event_id,
            checkout_intent_id,
        )
        return
    if not CPF_ENCRYPTION_KEY:
        raise RuntimeError("Missing CPF_ENCRYPTION_KEY")
    try:
        normalize_cpf(cpf_raw)
        cpf_encrypted = encrypt_cpf(cpf_raw)
    except ValueError as exc:
        logger.warning(
            "stripe_checkout_signup_intent_invalid_cpf event_id=%s checkout_intent_id=%s error=%s",
            event_id,
            checkout_intent_id,
            str(exc),
        )
        return

    intent_email = _normalize_email(str(intent.get("email") or ""))
    existing_user = get_user_by_email(intent_email)
    if existing_user:
        user_id = int(existing_user["id"])
        update_user_cpf_if_empty(user_id=user_id, cpf_encrypted=cpf_encrypted)
    else:
        user = create_user(
            email=intent_email,
            password_hash=str(intent["password_hash"]),
            full_name=None,
            cpf_encrypted=cpf_encrypted,
        )
        user_id = int(user["id"])

    course_id = _normalize_course_id(str(intent.get("course_id") or BILLING_COURSE_ID))
    purchase = get_purchase_by_checkout_session_id(session_id)
    if not purchase:
        purchase = create_purchase(
            user_id=user_id,
            course_id=course_id,
            status="pending",
            metadata={
                "source": "stripe_checkout_guest_signup",
                "checkout_intent_id": checkout_intent_id,
            },
        )
    paid_at = _to_int(_obj_get(payload, "created")) or event_created or now_ts
    updated_purchase, changed = mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=session_id or None,
        stripe_payment_intent_id=str(_obj_get(payload, "payment_intent") or "") or None,
        amount=_to_int(_obj_get(payload, "amount_total")),
        currency=str(_obj_get(payload, "currency") or "") or None,
        paid_at=paid_at,
        metadata={
            "checkout_intent_id": checkout_intent_id,
            "last_webhook_event_id": event_id,
            "last_webhook_event_type": "checkout.session.completed",
        },
    )
    if not updated_purchase:
        logger.warning(
            "stripe_checkout_signup_intent_purchase_missing_after_update event_id=%s checkout_intent_id=%s",
            event_id,
            checkout_intent_id,
        )
        return

    customer_id = str(_obj_get(payload, "customer") or "").strip()
    if customer_id:
        update_user_stripe_customer_id(int(updated_purchase["user_id"]), customer_id)

    _, intent_changed = mark_checkout_signup_intent_completed(checkout_intent_id)
    if not changed:
        logger.info(
            "stripe_checkout_signup_intent_purchase_duplicate event_id=%s checkout_intent_id=%s purchase_id=%s",
            event_id,
            checkout_intent_id,
            updated_purchase["id"],
        )
        return

    _grant_access_for_purchase(updated_purchase, paid_at=paid_at)
    logger.info(
        "stripe_checkout_signup_intent_completed event_id=%s checkout_intent_id=%s purchase_id=%s user_id=%s intent_changed=%s",
        event_id,
        checkout_intent_id,
        updated_purchase["id"],
        updated_purchase["user_id"],
        intent_changed,
    )


def _handle_checkout_session_completed(payload: Any, event_id: str, event_created: int) -> None:
    payment_status = str(_obj_get(payload, "payment_status") or "").lower()
    if payment_status != "paid":
        logger.info(
            "stripe_checkout_completed_not_paid event_id=%s session_id=%s payment_status=%s",
            event_id,
            _obj_get(payload, "id"),
            payment_status or "unknown",
        )
        return

    session_id = str(_obj_get(payload, "id") or "")
    metadata = _metadata_as_dict(_obj_get(payload, "metadata"))
    checkout_intent_id = str(metadata.get("checkout_intent_id") or "").strip()
    if checkout_intent_id:
        _handle_checkout_signup_intent_completion(payload, event_id, event_created, checkout_intent_id)
        return

    purchase = _resolve_purchase_from_metadata(metadata, session_id=session_id)
    if not purchase:
        logger.warning("stripe_checkout_completed_missing_purchase event_id=%s session_id=%s", event_id, session_id)
        return

    session_with_discounts = _retrieve_session_with_expanded_discounts(session_id) or payload
    discount_metadata = _extract_discount_metadata(session_with_discounts)
    paid_at = _to_int(_obj_get(payload, "created")) or event_created or int(time.time())
    updated_purchase, changed = mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=session_id or None,
        stripe_payment_intent_id=str(_obj_get(payload, "payment_intent") or "") or None,
        amount=_to_int(_obj_get(payload, "amount_total")),
        currency=str(_obj_get(payload, "currency") or "") or None,
        paid_at=paid_at,
        metadata={
            "last_webhook_event_id": event_id,
            "last_webhook_event_type": "checkout.session.completed",
            **discount_metadata,
        },
    )
    if not updated_purchase:
        logger.warning("stripe_checkout_completed_purchase_not_found_after_update event_id=%s", event_id)
        return

    customer_id = str(_obj_get(payload, "customer") or "").strip()
    if customer_id:
        update_user_stripe_customer_id(int(updated_purchase["user_id"]), customer_id)

    if not changed:
        logger.info(
            "stripe_checkout_completed_duplicate event_id=%s purchase_id=%s",
            event_id,
            updated_purchase["id"],
        )
        return

    _grant_access_for_purchase(updated_purchase, paid_at=paid_at)
    logger.info(
        "stripe_checkout_completed_processed event_id=%s purchase_id=%s user_id=%s amount_discount=%s",
        event_id,
        updated_purchase["id"],
        updated_purchase["user_id"],
        discount_metadata.get("amount_discount"),
    )


def _handle_payment_intent_succeeded(payload: Any, event_id: str, event_created: int) -> None:
    metadata = _metadata_as_dict(_obj_get(payload, "metadata"))
    checkout_intent_id = str(metadata.get("checkout_intent_id") or "").strip()
    purchase = _resolve_purchase_from_metadata(metadata)
    if not purchase:
        payment_intent_id = str(_obj_get(payload, "id") or "")
        purchase = get_purchase_by_payment_intent_id(payment_intent_id)
    if not purchase:
        if checkout_intent_id:
            logger.info(
                "stripe_payment_intent_succeeded_guest_deferred event_id=%s checkout_intent_id=%s",
                event_id,
                checkout_intent_id,
            )
            return
        logger.info("stripe_payment_intent_succeeded_ignored event_id=%s reason=no_purchase", event_id)
        return

    paid_at = _to_int(_obj_get(payload, "created")) or event_created or int(time.time())
    updated_purchase, changed = mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=None,
        stripe_payment_intent_id=str(_obj_get(payload, "id") or "") or None,
        amount=_to_int(_obj_get(payload, "amount_received")) or _to_int(_obj_get(payload, "amount")),
        currency=str(_obj_get(payload, "currency") or "") or None,
        paid_at=paid_at,
        metadata={
            "last_webhook_event_id": event_id,
            "last_webhook_event_type": "payment_intent.succeeded",
        },
    )
    if not updated_purchase:
        return

    customer_id = str(_obj_get(payload, "customer") or "").strip()
    if customer_id:
        update_user_stripe_customer_id(int(updated_purchase["user_id"]), customer_id)

    if not changed:
        logger.info("stripe_payment_intent_succeeded_duplicate event_id=%s purchase_id=%s", event_id, purchase["id"])
        return

    _grant_access_for_purchase(updated_purchase, paid_at=paid_at)
    logger.info(
        "stripe_payment_intent_succeeded_processed event_id=%s purchase_id=%s user_id=%s",
        event_id,
        updated_purchase["id"],
        updated_purchase["user_id"],
    )


def _extract_refund_id_from_charge(payload: Any) -> str | None:
    """Extract first refund id from charge.refunds (data[0].id or similar)."""
    refunds = _obj_get(payload, "refunds")
    data = _obj_get(refunds, "data") if refunds is not None else None
    if isinstance(data, list) and data:
        first = data[0]
        rid = _obj_get(first, "id")
        return str(rid or "").strip() or None
    if isinstance(refunds, list) and refunds:
        first = refunds[0]
        rid = _obj_get(first, "id")
        return str(rid or "").strip() or None
    return None


def _handle_charge_refunded(payload: Any, event_id: str, event_created: int) -> None:
    payment_intent_id = str(_obj_get(payload, "payment_intent") or "").strip()
    if not payment_intent_id:
        logger.info("stripe_charge_refunded_ignored event_id=%s reason=no_payment_intent", event_id)
        return

    stripe_refund_id = _extract_refund_id_from_charge(payload)

    refunded_purchase, changed = mark_purchase_refunded_by_payment_intent(
        stripe_payment_intent_id=payment_intent_id,
        refunded_at=event_created or int(time.time()),
        metadata={"last_webhook_event_id": event_id, "last_webhook_event_type": "charge.refunded"},
        stripe_refund_id=stripe_refund_id,
    )
    if not refunded_purchase:
        logger.warning(
            "stripe_charge_refunded_missing_purchase event_id=%s payment_intent_id=%s",
            event_id,
            payment_intent_id,
        )
        return
    if not changed:
        logger.info(
            "stripe_charge_refunded_duplicate event_id=%s purchase_id=%s",
            event_id,
            refunded_purchase["id"],
        )
        return
    _set_user_access_from_stripe(
        int(refunded_purchase["user_id"]),
        access_status="refunded",
        expires_at=event_created or int(time.time()),
        event_type="charge.refunded",
    )
    logger.info(
        "stripe_charge_refunded_processed event_id=%s purchase_id=%s user_id=%s",
        event_id,
        refunded_purchase["id"],
        refunded_purchase["user_id"],
    )


def _handle_subscription_deleted(payload: Any, event_id: str, event_created: int) -> None:
    customer_id = str(_obj_get(payload, "customer") or "").strip()
    if not customer_id:
        logger.info("stripe_subscription_deleted_ignored event_id=%s reason=no_customer", event_id)
        return
    user = get_user_by_stripe_customer_id(customer_id)
    if not user:
        logger.info(
            "stripe_subscription_deleted_ignored event_id=%s reason=user_not_found customer_id=%s",
            event_id,
            customer_id,
        )
        return
    expires_at = _to_int(user.get("expires_at"))
    _set_user_access_from_stripe(
        int(user["id"]),
        access_status="canceled",
        expires_at=expires_at,
        event_type="customer.subscription.deleted",
    )
    logger.info(
        "stripe_subscription_deleted_processed event_id=%s user_id=%s customer_id=%s",
        event_id,
        user["id"],
        customer_id,
    )


def _handle_charge_dispute_created(payload: Any, event_id: str, event_created: int) -> None:
    payment_intent_id = str(_obj_get(payload, "payment_intent") or "").strip()
    customer_id = str(_obj_get(payload, "customer") or "").strip()
    user_id: int | None = None
    if payment_intent_id:
        purchase = get_purchase_by_payment_intent_id(payment_intent_id)
        if purchase:
            user_id = int(purchase["user_id"])
            update_purchase_status(
                int(purchase["id"]),
                status=str(purchase.get("status") or "paid"),
                metadata={
                    "last_webhook_event_id": event_id,
                    "last_webhook_event_type": "charge.dispute.created",
                    "charge_dispute_created_at": event_created,
                },
            )
    if user_id is None and customer_id:
        user = get_user_by_stripe_customer_id(customer_id)
        if user:
            user_id = int(user["id"])
    if user_id is None:
        logger.info(
            "stripe_charge_dispute_created_ignored event_id=%s reason=user_not_found payment_intent_id=%s customer_id=%s",
            event_id,
            payment_intent_id,
            customer_id,
        )
        return
    user_row = get_user_by_id(user_id)
    expires_at = _to_int(user_row.get("expires_at")) if user_row else None
    _set_user_access_from_stripe(
        user_id,
        access_status="blocked",
        expires_at=expires_at,
        event_type="charge.dispute.created",
    )
    logger.info(
        "stripe_charge_dispute_created_processed event_id=%s user_id=%s payment_intent_id=%s",
        event_id,
        user_id,
        payment_intent_id,
    )


def refresh_user_from_stripe(user_id: int, requested_by_admin_id: int) -> dict[str, Any]:
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = sync_user_effective_status(user)

    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Stripe config: STRIPE_SECRET_KEY",
        )
    _configure_stripe()

    latest_purchase = get_latest_purchase_for_user_any_status(user_id, BILLING_COURSE_ID)
    payment_intent_id = str((latest_purchase or {}).get("stripe_payment_intent_id") or "").strip()
    customer_id = str(user.get("stripe_customer_id") or "").strip()

    stripe_pi = None
    stripe_subscription = None
    mapped_status: str | None = None

    if payment_intent_id:
        try:
            stripe_pi = stripe.PaymentIntent.retrieve(payment_intent_id, expand=["latest_charge"])
        except stripe.error.StripeError:
            logger.warning("stripe_refresh_payment_intent_failed user_id=%s payment_intent_id=%s", user_id, payment_intent_id)

    if customer_id:
        try:
            subs = stripe.Subscription.list(customer=customer_id, limit=1, status="all")
            sub_list = _obj_get(subs, "data", []) or []
            if isinstance(sub_list, list) and sub_list:
                stripe_subscription = sub_list[0]
        except stripe.error.StripeError:
            logger.warning("stripe_refresh_subscription_failed user_id=%s customer_id=%s", user_id, customer_id)

    if stripe_pi is not None:
        latest_charge = _obj_get(stripe_pi, "latest_charge")
        amount_refunded = _to_int(_obj_get(latest_charge, "amount_refunded")) or 0
        charge_dispute = _obj_get(latest_charge, "dispute")
        if amount_refunded > 0:
            mapped_status = "refunded"
        elif charge_dispute:
            mapped_status = "blocked"
        elif str(_obj_get(stripe_pi, "status") or "").lower() == "succeeded":
            mapped_status = "active"

    if mapped_status is None and stripe_subscription is not None:
        sub_status = str(_obj_get(stripe_subscription, "status") or "").lower()
        if sub_status in {"canceled", "cancelled", "unpaid", "incomplete_expired"}:
            mapped_status = "canceled"
        elif sub_status in {"active", "trialing"}:
            mapped_status = "active"

    if mapped_status is None:
        mapped_status = str(user.get("access_status") or "expired")

    expires_at = _to_int(user.get("expires_at"))
    if mapped_status == "active" and expires_at is None:
        grant = get_access_grant(user_id, BILLING_COURSE_ID)
        expires_at = _to_int(grant.get("expires_at")) if grant else None
    if mapped_status == "refunded":
        expires_at = int(time.time())

    override_preserved = str(user.get("access_managed_by") or "stripe") == "admin"
    before = {
        "access_status": user.get("access_status"),
        "expires_at": user.get("expires_at"),
        "access_managed_by": user.get("access_managed_by"),
    }
    if not override_preserved:
        update_user_access_state(
            user_id,
            access_status=mapped_status,
            expires_at=expires_at,
            access_managed_by="stripe",
        )
    updated = sync_user_effective_status(get_user_by_id(user_id) or user)

    create_admin_audit_log(
        admin_id=requested_by_admin_id,
        target_user_id=user_id,
        action_type="stripe_refresh",
        reason="manual_stripe_refresh",
        before=before,
        after={
            "access_status": updated.get("access_status"),
            "expires_at": updated.get("expires_at"),
            "access_managed_by": updated.get("access_managed_by"),
            "override_preserved": override_preserved,
        },
    )

    return {
        "user_id": user_id,
        "override_preserved": override_preserved,
        "access_status": str(updated.get("access_status") or "expired"),
        "effective_access_status": compute_effective_access_status(
            updated.get("access_status"),
            _to_int(updated.get("expires_at")),
        ),
        "expires_at": _to_int(updated.get("expires_at")),
    }


def process_stripe_event(event: Any) -> None:
    event_id = str(_obj_get(event, "id") or "")
    event_type = str(_obj_get(event, "type") or "")
    event_created = _to_int(_obj_get(event, "created")) or int(time.time())
    payload = _obj_get(_obj_get(event, "data", {}), "object", {})

    logger.info("stripe_webhook_received event_id=%s event_type=%s", event_id, event_type)
    if event_type == "checkout.session.completed":
        _handle_checkout_session_completed(payload, event_id, event_created)
        return
    if event_type == "payment_intent.succeeded":
        _handle_payment_intent_succeeded(payload, event_id, event_created)
        return
    if event_type == "charge.refunded":
        _handle_charge_refunded(payload, event_id, event_created)
        return
    if event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(payload, event_id, event_created)
        return
    if event_type == "charge.dispute.created":
        _handle_charge_dispute_created(payload, event_id, event_created)
        return
    logger.info("stripe_webhook_ignored event_id=%s event_type=%s", event_id, event_type)
