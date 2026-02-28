import base64
import hashlib
import hmac
import logging
import re
import secrets
import time

from fastapi import Header, HTTPException, status

from app.config import (
    AUTH_TOKEN_TTL_HOURS,
    INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_PASSWORD,
    PASSWORD_RESET_TOKEN_TTL_MINUTES,
)
from app.services.email_service import build_reset_link, send_password_reset_email
from app.services.user_db import (
    count_recent_reset_requests,
    count_users,
    create_password_reset_token,
    create_session,
    create_user,
    delete_expired_sessions,
    expire_admin_impersonation_sessions,
    get_active_impersonation_by_token_hash,
    get_password_reset_token_by_hash,
    get_session_with_user,
    get_user_by_email,
    get_user_by_id,
    invalidate_user_reset_tokens,
    mark_password_reset_token_used,
    set_user_role_by_email,
    touch_session,
    update_user_last_login,
    update_user_password,
)

PASSWORD_MIN_LENGTH = 1
PASSWORD_MIN_LENGTH_STRICT = 10
PBKDF2_ITERATIONS = 390_000
EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9.\-]+$")
logger = logging.getLogger(__name__)

BOOTSTRAP_USERS = (
    {
        "email": "giovannadiasdc@gmail.com",
        "password": "1234",
        "full_name": "Giovanna Dias",
    },
)


def _now_ts() -> int:
    return int(time.time())


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _clean_email(email: str) -> str:
    return (email or "").strip().lower()


def _serialize_user(user: dict) -> dict:
    return {
        "id": int(user["id"]),
        "email": str(user["email"]),
        "full_name": user.get("full_name"),
        "role": str(user.get("role") or "student"),
        "is_impersonating": bool(user.get("is_impersonating", False)),
        "impersonation_admin_id": int(user["impersonation_admin_id"])
        if user.get("impersonation_admin_id") is not None
        else None,
        "impersonation_started_at": int(user["impersonation_started_at"])
        if user.get("impersonation_started_at") is not None
        else None,
        "impersonation_expires_at": int(user["impersonation_expires_at"])
        if user.get("impersonation_expires_at") is not None
        else None,
    }


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(_clean_email(email)))


def validate_password_strength(password: str) -> str | None:
    if len(password or "") < PASSWORD_MIN_LENGTH:
        return f"Password must have at least {PASSWORD_MIN_LENGTH} characters"
    return None


def validate_password_strength_strict(password: str) -> str | None:
    """Stricter validation for reset/change: 10+ chars, 1 number or symbol."""
    p = password or ""
    if len(p) < PASSWORD_MIN_LENGTH_STRICT:
        return "A senha deve ter pelo menos 10 caracteres"
    if not re.search(r"[0-9!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\`~]", p):
        return "A senha deve incluir pelo menos 1 número ou símbolo"
    return None


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    salt_b64 = base64.urlsafe_b64encode(salt).decode("ascii")
    digest_b64 = base64.urlsafe_b64encode(digest).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        scheme, iterations, salt_b64, digest_b64 = encoded_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
        expected = base64.urlsafe_b64decode(digest_b64.encode("ascii"))
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )
        return hmac.compare_digest(candidate, expected)
    except Exception:
        return False


def create_access_token_for_user(user_id: int, ttl_seconds: int | None = None) -> tuple[str, int, str]:
    token = secrets.token_urlsafe(48)
    expires_at = _now_ts() + (
        max(60, int(ttl_seconds))
        if ttl_seconds is not None
        else max(1, AUTH_TOKEN_TTL_HOURS) * 3600
    )
    token_hash = _token_hash(token)
    create_session(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    return token, expires_at, token_hash


def _create_session_for_user(user_id: int) -> tuple[str, int]:
    token, expires_at, _ = create_access_token_for_user(user_id)
    return token, expires_at


def register_user(email: str, password: str, full_name: str | None = None) -> tuple[dict, str]:
    clean_email = _clean_email(email)
    if not is_valid_email(clean_email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    password_err = validate_password_strength(password)
    if password_err:
        raise HTTPException(status_code=400, detail=password_err)
    if get_user_by_email(clean_email):
        raise HTTPException(status_code=409, detail="User already exists")

    user = create_user(
        email=clean_email,
        password_hash=hash_password(password),
        full_name=(full_name or "").strip() or None,
    )
    token, _ = _create_session_for_user(int(user["id"]))
    return _serialize_user(user), token


def login_user(email: str, password: str) -> tuple[dict, str]:
    clean_email = _clean_email(email)
    user = get_user_by_email(clean_email)
    if not user or not verify_password(password, str(user["password_hash"])):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not int(user.get("is_active", 1)):
        raise HTTPException(status_code=403, detail="User is inactive")

    user_id = int(user["id"])
    update_user_last_login(user_id)
    token, _ = _create_session_for_user(user_id)
    return _serialize_user(user), token


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2:
        return None
    if parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def get_user_from_token(token: str) -> tuple[dict, str] | tuple[None, None]:
    delete_expired_sessions()
    expire_admin_impersonation_sessions()
    token_hash = _token_hash(token)
    session = get_session_with_user(token_hash)
    if not session:
        return None, None
    session_expires_at = int(session.get("session_expires_at", session.get("expires_at", 0)) or 0)
    if session_expires_at <= _now_ts():
        return None, None
    if not int(session.get("is_active", 1)):
        return None, None

    touch_session(token_hash)

    impersonation = get_active_impersonation_by_token_hash(token_hash)
    if impersonation:
        user = {
            "id": int(impersonation["target_user_id"]),
            "email": str(impersonation.get("target_email") or session.get("email") or ""),
            "full_name": impersonation.get("target_full_name") if impersonation.get("target_full_name") is not None else session.get("full_name"),
            "role": str(impersonation.get("target_role") or session.get("role") or "student"),
            "is_impersonating": True,
            "impersonation_admin_id": int(impersonation["admin_user_id"]),
            "impersonation_started_at": int(impersonation["started_at"]),
            "impersonation_expires_at": int(impersonation["expires_at"]),
        }
        return user, token_hash

    user = {
        "id": int(session["user_id"]),
        "email": str(session["email"]),
        "full_name": session.get("full_name"),
        "role": str(session.get("role") or "student"),
        "is_impersonating": False,
        "impersonation_admin_id": None,
        "impersonation_started_at": None,
        "impersonation_expires_at": None,
    }
    return user, token_hash


def get_user_from_authorization(authorization: str | None) -> tuple[dict, str] | tuple[None, None]:
    token = _extract_bearer_token(authorization)
    if not token:
        return None, None
    return get_user_from_token(token)


def require_authenticated_user(authorization: str | None = Header(default=None)) -> dict:
    user, token_hash = get_user_from_authorization(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user["auth_token_hash"] = token_hash
    return user


def require_admin_user(authorization: str | None = Header(default=None)) -> dict:
    user = require_authenticated_user(authorization)
    if str(user.get("role") or "student") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def bootstrap_initial_admin() -> None:
    if not INITIAL_ADMIN_EMAIL or not INITIAL_ADMIN_PASSWORD:
        logger.info("Skipping initial admin bootstrap: INITIAL_ADMIN_EMAIL/PASSWORD not set.")
        return
    clean_email = _clean_email(INITIAL_ADMIN_EMAIL)
    if not is_valid_email(clean_email):
        logger.warning("Skipping initial admin bootstrap: INITIAL_ADMIN_EMAIL is invalid.")
        return
    if validate_password_strength(INITIAL_ADMIN_PASSWORD):
        logger.warning(
            "Skipping initial admin bootstrap: INITIAL_ADMIN_PASSWORD must have at least %s characters.",
            PASSWORD_MIN_LENGTH,
        )
        return
    existing = get_user_by_email(clean_email)
    if existing:
        # User already exists — just make sure they are admin.
        changed = set_user_role_by_email(clean_email, "admin")
        if changed:
            logger.info("Initial admin promoted to role=admin: %s", clean_email)
        else:
            logger.info("Initial admin already has role=admin: %s", clean_email)
        return
    create_user(
        email=clean_email,
        password_hash=hash_password(INITIAL_ADMIN_PASSWORD),
        full_name="Admin",
        role="admin",
        access_status="manual_grant",
        expires_at=None,
        access_managed_by="admin",
    )
    logger.info("Initial admin user created: %s", clean_email)


def _promote_initial_admin_if_exists() -> None:
    clean_email = _clean_email(INITIAL_ADMIN_EMAIL)
    if not clean_email:
        return
    changed = set_user_role_by_email(clean_email, "admin")
    if changed:
        logger.info("Initial admin user promoted by email: %s", clean_email)


def bootstrap_required_users() -> None:
    for entry in BOOTSTRAP_USERS:
        raw_email = str(entry.get("email") or "")
        password = str(entry.get("password") or "")
        full_name = str(entry.get("full_name") or "").strip() or None
        email = _clean_email(raw_email)
        if not email:
            continue
        if get_user_by_email(email):
            continue
        if not is_valid_email(email):
            logger.warning("Skipping bootstrap user %s: invalid email.", raw_email)
            continue
        password_err = validate_password_strength(password)
        if password_err:
            logger.warning("Skipping bootstrap user %s: %s", email, password_err)
            continue
        create_user(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
        )
        logger.info("Bootstrap user created: %s", email)


RESET_RATE_LIMIT_PER_HOUR = 3


def forgot_password_request(
    email: str,
    requested_ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """
    Process forgot-password request. Always returns (no exception).
    If user exists: invalidate old tokens, create new token, send email.
    If user does not exist: return without sending (no account enumeration).
    Rate limit: max RESET_RATE_LIMIT_PER_HOUR requests per user per hour.
    """
    clean_email = _clean_email(email)
    if not is_valid_email(clean_email):
        return

    user = get_user_by_email(clean_email)
    if not user:
        logger.info("password_reset_requested email_not_found (generic success)")
        return

    user_id = int(user["id"])
    recent = count_recent_reset_requests(user_id, within_seconds=3600)
    if recent >= RESET_RATE_LIMIT_PER_HOUR:
        logger.info("password_reset_rate_limited user_id=%s recent=%s", user_id, recent)
        return

    invalidate_user_reset_tokens(user_id)

    token = secrets.token_urlsafe(48)
    token_hash = _token_hash(token)
    expires_at = _now_ts() + max(1, PASSWORD_RESET_TOKEN_TTL_MINUTES) * 60
    create_password_reset_token(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        requested_ip=requested_ip,
        user_agent=user_agent,
    )
    reset_link = build_reset_link(token)
    send_password_reset_email(clean_email, reset_link)
    logger.info("password_reset_requested user_id=%s", user_id)


def validate_reset_token(token: str) -> bool:
    """Return True if token is valid (exists, not expired, not used)."""
    if not token or not (token or "").strip():
        return False
    token_hash = _token_hash(token.strip())
    row = get_password_reset_token_by_hash(token_hash)
    if not row:
        return False
    if row.get("used_at"):
        return False
    expires_at = int(row.get("expires_at") or 0)
    if expires_at <= _now_ts():
        return False
    return True


def reset_password_with_token(token: str, new_password: str) -> None:
    """Reset password using valid token. Raises HTTPException on failure."""
    token_str = (token or "").strip()
    if not token_str:
        raise HTTPException(status_code=400, detail="Token is required")

    err = validate_password_strength_strict(new_password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    token_hash = _token_hash(token_str)
    row = get_password_reset_token_by_hash(token_hash)
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if row.get("used_at"):
        raise HTTPException(status_code=400, detail="Token has already been used")
    expires_at = int(row.get("expires_at") or 0)
    if expires_at <= _now_ts():
        raise HTTPException(status_code=400, detail="Token has expired")

    user_id = int(row["user_id"])
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    update_user_password(user_id, hash_password(new_password))
    mark_password_reset_token_used(int(row["id"]))
    logger.info("password_reset_completed user_id=%s", user_id)


def change_password(user_id: int, current_password: str, new_password: str) -> None:
    """Change password for logged-in user. Raises HTTPException on failure."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(current_password, str(user["password_hash"])):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    err = validate_password_strength_strict(new_password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    update_user_password(user_id, hash_password(new_password))
    invalidate_user_reset_tokens(user_id)
    logger.info("password_changed user_id=%s", user_id)
