"""
Account service: account info, refund/cancellation, profile update, certificate PDF.
"""

import base64
import html
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import stripe
from fastapi import HTTPException, status

from app.config import APP_BASE_URL, BILLING_COURSE_ID, REFUND_WINDOW_DAYS, STRIPE_SECRET_KEY
from app.services.access_service import has_active_course_access, sync_user_effective_status
from app.services.content_loader import load_courses
from app.services.pdf_service import PdfServiceError, PdfServiceUnavailable, render_pdf_from_html
from app.services.user_db import (
    get_access_grant,
    get_latest_purchase_for_user,
    get_user_by_id,
    list_progress_for_lessons,
    mark_purchase_refunded_by_payment_intent,
    update_user_full_name,
)

logger = logging.getLogger(__name__)


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _configure_stripe() -> None:
    stripe.api_key = STRIPE_SECRET_KEY


_STATUS_LABELS = {
    "active": "Ativo",
    "expired": "Expirado",
    "refunded": "Reembolsado",
}


def get_account_info(user_id: int) -> dict[str, Any]:
    """
    Load account info for the user: identity, access record, refund eligibility.
    Returns dict suitable for AccountResponse.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    purchase = get_latest_purchase_for_user(user_id, BILLING_COURSE_ID)
    access = get_access_grant(user_id, BILLING_COURSE_ID)
    now = int(time.time())

    status_val = "expired"  # default when no purchase
    status_label = _STATUS_LABELS.get("expired", "Expirado")
    expires_at: int | None = None
    purchase_at: int | None = None
    refunded_at: int | None = None
    amount: int | None = None
    currency: str | None = None

    eligible_for_refund = False

    if purchase:
        purchase_at = _to_int(purchase.get("paid_at"))
        refunded_at = _to_int(purchase.get("refunded_at"))
        amount = _to_int(purchase.get("amount"))
        currency = str(purchase.get("currency") or "") or None

        if str(purchase.get("status") or "") == "refunded":
            status_val = "refunded"
            status_label = _STATUS_LABELS.get("refunded", "Reembolsado")
            if access:
                expires_at = _to_int(access.get("expires_at"))
        else:
            # paid
            if access:
                expires_at = _to_int(access.get("expires_at"))
                if expires_at and expires_at > now:
                    status_val = "active"
                    status_label = _STATUS_LABELS.get("active", "Ativo")

            # Refund eligibility: status paid, within window, has payment_intent
            if str(purchase.get("status") or "") == "paid":
                pi_id = str(purchase.get("stripe_payment_intent_id") or "").strip()
                has_stripe_refund = bool(str(purchase.get("stripe_refund_id") or "").strip())
                if pi_id and not has_stripe_refund and purchase_at:
                    window_sec = REFUND_WINDOW_DAYS * 86400
                    if now - purchase_at <= window_sec:
                        eligible_for_refund = True

    access_info: dict[str, Any] | None = None
    if purchase:
        access_info = {
            "status": status_val,
            "status_label": status_label,
            "expires_at": expires_at,
            "purchase_at": purchase_at,
            "refunded_at": refunded_at,
            "course_id": BILLING_COURSE_ID,
            "amount": amount,
            "currency": currency,
        }

    return {
        "user": {
            "id": user["id"],
            "email": user.get("email", ""),
            "full_name": user.get("full_name"),
        },
        "access": access_info,
        "eligible_for_refund": eligible_for_refund,
        "refund_window_days": REFUND_WINDOW_DAYS,
    }


def request_refund(user_id: int, reason: str | None = None) -> dict[str, Any]:
    """
    Request a refund for the user's latest eligible purchase.
    Creates Stripe refund, updates purchase, revokes access.
    Returns updated account info.
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Refund service not configured",
        )

    purchase = get_latest_purchase_for_user(user_id, BILLING_COURSE_ID)
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No purchase found to refund",
        )

    # Ownership
    if int(purchase.get("user_id", 0)) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if str(purchase.get("status") or "") != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase is not eligible for refund",
        )

    pi_id = str(purchase.get("stripe_payment_intent_id") or "").strip()
    if not pi_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase has no payment intent for refund",
        )

    stripe_refund_id = str(purchase.get("stripe_refund_id") or "").strip()
    if stripe_refund_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Purchase has already been refunded",
        )

    purchase_at = _to_int(purchase.get("paid_at"))
    if not purchase_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase has no paid date",
        )
    now = int(time.time())
    window_sec = REFUND_WINDOW_DAYS * 86400
    if now - purchase_at > window_sec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund window ({REFUND_WINDOW_DAYS} days) has passed",
        )

    # Create Stripe refund
    _configure_stripe()
    idempotency_key = f"refund_{user_id}_{pi_id}"

    try:
        refund = stripe.Refund.create(
            payment_intent=pi_id,
            reason="requested_by_customer",
            metadata={"user_id": str(user_id), "course_id": BILLING_COURSE_ID},
            idempotency_key=idempotency_key,
        )
    except stripe.error.InvalidRequestError as exc:
        if "already been refunded" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Purchase has already been refunded",
            ) from exc
        logger.exception(
            "stripe_refund_create_failed user_id=%s purchase_id=%s error=%s",
            user_id,
            purchase.get("id"),
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create Stripe refund",
        ) from exc
    except stripe.error.StripeError as exc:
        logger.exception(
            "stripe_refund_create_failed user_id=%s purchase_id=%s error=%s",
            user_id,
            purchase.get("id"),
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create Stripe refund",
        ) from exc

    stripe_refund_id = str(getattr(refund, "id", None) or "").strip()

    logger.info(
        "refund_requested user_id=%s purchase_id=%s stripe_refund_id=%s reason=%s",
        user_id,
        purchase.get("id"),
        stripe_refund_id,
        reason,
    )

    # Update purchase and revoke access
    refunded_purchase, changed = mark_purchase_refunded_by_payment_intent(
        stripe_payment_intent_id=pi_id,
        refunded_at=now,
        metadata={"last_refund_request_user_id": str(user_id), "refund_reason": (reason or "").strip()},
        stripe_refund_id=stripe_refund_id or None,
        refund_reason=(reason or "").strip() or None,
    )

    if not changed:
        logger.info(
            "refund_already_applied user_id=%s purchase_id=%s",
            user_id,
            purchase.get("id"),
        )

    logger.info(
        "refund_created stripe_refund_id=%s purchase_id=%s",
        stripe_refund_id,
        purchase.get("id"),
    )

    return get_account_info(user_id)


def update_profile_full_name(user_id: int, full_name: str | None) -> dict[str, Any]:
    """
    Update the user's full_name. Validates required, 2+ words, max 120 chars.
    Returns updated account info.
    """
    raw = (full_name or "").strip()
    normalized = " ".join(raw.split()) if raw else ""
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome completo é obrigatório.",
        )
    if len(normalized) > 120:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome muito longo. Use até 120 caracteres.",
        )
    words = [w for w in normalized.split() if w]
    if len(words) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe nome e sobrenome (pelo menos duas palavras).",
        )
    update_user_full_name(user_id, normalized)
    return get_account_info(user_id)


def _lesson_ids_from_course(course: dict) -> list[str]:
    ids: list[str] = []
    for module in course.get("modules", []) or []:
        for lesson in module.get("lessons", []) or []:
            if isinstance(lesson, str):
                ids.append(lesson)
            elif isinstance(lesson, dict) and isinstance(lesson.get("id"), str):
                ids.append(lesson["id"])
    return ids


def _lesson_completed(row: dict | None) -> bool:
    if not row:
        return False
    progress = row.get("progress")
    if isinstance(progress, dict) and isinstance(progress.get("lessonCompleted"), bool):
        return bool(progress["lessonCompleted"])
    return bool(row.get("is_completed"))


async def generate_certificate_pdf_bytes(user_id: int) -> bytes:
    """
    Generate certificate PDF for user. Raises HTTPException on validation failures.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    full_name = (user.get("full_name") or "").strip()
    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FULL_NAME_REQUIRED", "message": "Nome completo é obrigatório para emitir o certificado."},
        )
    user = sync_user_effective_status(user)
    if not has_active_course_access(user.get("access_status"), user.get("expires_at")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso ao curso necessário para emitir o certificado.",
        )
    courses = load_courses().get("courses", [])
    course = next((c for c in courses if c.get("id") == BILLING_COURSE_ID), None)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Curso não encontrado.",
        )
    lesson_ids = _lesson_ids_from_course(course)
    if not lesson_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Curso não concluído.",
        )
    rows = list_progress_for_lessons(user_id, lesson_ids)
    completed = sum(1 for lid in lesson_ids if _lesson_completed(rows.get(lid)))
    total = len(lesson_ids)
    completion_pct = round((completed / total) * 100.0, 2) if total > 0 else 0.0
    if completion_pct < 100.0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Curso não concluído. Conclua todas as aulas para emitir o certificado.",
        )
    display_name = html.escape(full_name, quote=True)
    _static = Path(__file__).parent.parent.parent / "static"
    def _b64_img(filename: str) -> str:
        try:
            return "data:image/png;base64," + base64.b64encode((_static / filename).read_bytes()).decode()
        except Exception:
            return ""
    logo_full_url = _b64_img("Blast_Full_Black.png")
    icon_url      = _b64_img("Blast_Icon_Black.png")
    num_modules   = len(course.get("modules", []))
    _months_pt    = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
                     "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    _now          = datetime.now()
    issue_date    = f"{_now.day} de {_months_pt[_now.month - 1]} de {_now.year}"
    cert_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=794, height=1123">
<title>Certificado</title>
<style>
@page {{ size: A4 portrait; margin: 0; }}
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  width: 794px; height: 1123px; overflow: hidden;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: #fff; color: #1a1a1a;
}}
.page {{
  position: relative; width: 794px; height: 1123px;
  background: #fff; overflow: hidden;
}}

/* ── Double-border frame ── */
.frame {{
  position: absolute; inset: 22px;
  border: 1.5px solid rgba(26,115,232,0.7);
  pointer-events: none; z-index: 2;
}}
.frame::before {{
  content: '';
  position: absolute; inset: 9px;
  border: 0.5px solid rgba(26,115,232,0.25);
}}

/* ── Corner accents (L-shapes bolted onto each corner of .frame) ── */
.ca {{ position: absolute; width: 18px; height: 18px; z-index: 3; pointer-events: none; }}
.ca-tl {{ top:  22px; left:  22px; border-top:  3px solid #1a73e8; border-left:  3px solid #1a73e8; }}
.ca-tr {{ top:  22px; right: 22px; border-top:  3px solid #1a73e8; border-right: 3px solid #1a73e8; }}
.ca-bl {{ bottom: 22px; left:  22px; border-bottom: 3px solid #1a73e8; border-left:  3px solid #1a73e8; }}
.ca-br {{ bottom: 22px; right: 22px; border-bottom: 3px solid #1a73e8; border-right: 3px solid #1a73e8; }}

/* ── Watermark ── */
.watermark {{
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 320px; height: 320px;
  opacity: 0.055; z-index: 0; pointer-events: none;
}}
.watermark img {{ width: 100%; height: 100%; object-fit: contain; }}

/* ── Main content ── */
.content {{
  position: relative; z-index: 1;
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-between;
  padding: 64px 88px 56px;
  text-align: center;
}}

/* Header */
.header {{ display: flex; flex-direction: column; align-items: center; gap: 0; }}
.logo-img {{ height: 160px; width: auto; display: block; }}
.edu-label {{
  font-size: 8.5px; font-weight: 400;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(0,0,0,0.32); margin-top: 7px;
}}

/* Gradient divider */
.divider {{
  width: 100%; height: 1px;
  background: linear-gradient(to right,
    transparent 0%,
    rgba(26,115,232,0.35) 25%,
    rgba(26,115,232,0.35) 75%,
    transparent 100%);
}}

/* Body */
.body {{
  display: flex; flex-direction: column;
  align-items: center; gap: 0;
  flex: 1; justify-content: center;
  padding: 0 16px;
}}
.cert-title {{
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: #1a73e8; margin-bottom: 30px;
}}
.preamble {{
  font-size: 14px; color: #5f6368;
  font-style: italic; margin-bottom: 14px;
}}
.recipient-name {{
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 38px; font-weight: 400;
  color: #1a1a1a; letter-spacing: -0.01em;
  line-height: 1.2; word-break: break-word;
  margin-bottom: 26px;
}}
.completion-text {{
  font-size: 13.5px; color: #5f6368; margin-bottom: 10px;
}}
.course-name {{
  font-size: 21px; font-weight: 700;
  color: #1a1a1a; letter-spacing: -0.01em;
  margin-bottom: 32px;
}}

/* Ornament divider */
.ornament {{
  display: flex; align-items: center;
  gap: 14px; width: 56%; margin-bottom: 18px;
}}
.orn-line {{ flex: 1; height: 1px; background: rgba(0,0,0,0.13); }}
.orn-diamond {{
  width: 6px; height: 6px;
  background: #1a73e8; opacity: 0.55;
  transform: rotate(45deg);
}}

.meta {{
  font-size: 12px; color: #9aa0a6; letter-spacing: 0.04em;
}}

/* Footer */
.footer {{ display: flex; flex-direction: column; align-items: center; gap: 5px; }}
.issue-date {{ font-size: 12px; color: #5f6368; }}
.brand {{ font-size: 10.5px; color: #9aa0a6; letter-spacing: 0.1em; }}
</style>
</head>
<body>
<div class="page">
  <div class="frame"></div>
  <div class="ca ca-tl"></div>
  <div class="ca ca-tr"></div>
  <div class="ca ca-bl"></div>
  <div class="ca ca-br"></div>
  <div class="watermark"><img src="{icon_url}" alt=""></div>
  <div class="content">
    <div class="header">
      <img class="logo-img" src="{logo_full_url}" alt="Blast">
      <span class="edu-label">Education</span>
    </div>
    <div class="divider"></div>
    <div class="body">
      <span class="cert-title">Certificado de Conclus&#xE3;o</span>
      <p class="preamble">Este certificado &#xE9; concedido a</p>
      <h1 class="recipient-name">{display_name}</h1>
      <p class="completion-text">por concluir com &#xEA;xito o curso</p>
      <p class="course-name">SQL do B&#xE1;sico ao Avan&#xE7;ado</p>
      <div class="ornament">
        <div class="orn-line"></div>
        <div class="orn-diamond"></div>
        <div class="orn-line"></div>
      </div>
      <span class="meta">{num_modules} m&#xF3;dulos / {total} aulas</span>
    </div>
    <div class="divider"></div>
    <div class="footer">
      <span class="issue-date">{issue_date}</span>
      <span class="brand">https://blastgroup.org</span>
    </div>
  </div>
</div>
</body>
</html>"""
    try:
        pdf_bytes = await render_pdf_from_html(cert_html)
    except PdfServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PdfServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return pdf_bytes
