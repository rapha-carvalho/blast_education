"""
Email service using Resend for transactional emails.
"""

import logging
from typing import Any

from app.config import APP_BASE_URL, PASSWORD_RESET_TOKEN_TTL_MINUTES, RESEND_API_KEY, RESEND_FROM_EMAIL

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Send password reset email via Resend.
    Returns True if sent successfully, False otherwise.
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured; skipping password reset email")
        return False

    try:
        import resend

        resend.api_key = RESEND_API_KEY

        subject = "Redefina sua senha"
        expires_min = PASSWORD_RESET_TOKEN_TTL_MINUTES

        html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 520px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <strong style="font-size: 1.25rem;">Blast Education</strong>
  </div>
  <p style="margin: 0 0 16px 0;">Você solicitou a redefinição de senha. Clique no botão abaixo para definir uma nova senha:</p>
  <p style="margin: 0 0 24px 0;">
    <a href="{reset_link}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Redefinir senha</a>
  </p>
  <p style="margin: 0; font-size: 0.9rem; color: #5f6368;">Ou copie e cole este link no navegador:</p>
  <p style="margin: 8px 0 24px 0; word-break: break-all; font-size: 0.85rem; color: #5f6368;">{reset_link}</p>
  <p style="margin: 0; font-size: 0.85rem; color: #9aa0a6;">Este link expira em {expires_min} minutos.</p>
</body>
</html>
"""

        params: dict[str, Any] = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email.strip().lower()],
            "subject": subject,
            "html": html,
        }

        resend.Emails.send(params)
        logger.info("password_reset_email_sent to=%s", to_email)
        return True
    except Exception as exc:
        logger.exception("password_reset_email_failed to=%s error=%s", to_email, exc)
        return False


def build_reset_link(token: str) -> str:
    """Build the full reset password URL with token."""
    return f"{APP_BASE_URL}/reset-password?token={token}"


def build_login_link() -> str:
    """Build login URL used in transactional emails."""
    return f"{APP_BASE_URL}/login"


def build_purchase_confirmation_email_content(
    *,
    full_name: str | None,
    login_email: str,
    login_url: str,
    password_created_at_checkout: bool,
) -> dict[str, str]:
    greeting = f"Olá, {full_name.strip()}!" if (full_name or "").strip() else "Olá!"
    if password_created_at_checkout:
        login_instruction = "Faça login com o e-mail usado na compra e a senha que você criou no checkout."
    else:
        login_instruction = "Faça login com o e-mail usado na compra e a senha da sua conta."

    subject = "Acesso liberado — Curso SQL (Blast)"
    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <strong style="font-size: 1.25rem;">Blast Education</strong>
  </div>
  <p style="margin: 0 0 12px 0;">{greeting}</p>
  <p style="margin: 0 0 12px 0;">Pagamento confirmado. Seu acesso ao curso SQL está liberado.</p>
  <p style="margin: 0 0 8px 0;"><strong>Próximos passos</strong></p>
  <p style="margin: 0 0 8px 0;">{login_instruction}</p>
  <p style="margin: 0 0 8px 0;">E-mail de login: <strong>{login_email}</strong></p>
  <p style="margin: 0 0 20px 0;">
    <a href="{login_url}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Entrar no curso</a>
  </p>
  <p style="margin: 0; font-size: 0.9rem; color: #5f6368;">Ou copie e cole este link no navegador:</p>
  <p style="margin: 8px 0 20px 0; word-break: break-all; font-size: 0.85rem; color: #5f6368;">{login_url}</p>
  <p style="margin: 0; font-size: 0.9rem; color: #5f6368;">Se tiver qualquer problema, responda este e-mail.</p>
</body>
</html>
"""
    return {"subject": subject, "html": html}


def send_purchase_confirmation_email(
    *,
    to_email: str,
    full_name: str | None,
    login_email: str,
    login_url: str | None = None,
    password_created_at_checkout: bool,
) -> dict[str, Any]:
    """
    Send purchase confirmation email via Resend.
    Returns a structured result with provider metadata for audit trail.
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured; skipping purchase confirmation email")
        return {"sent": False, "provider_message_id": None, "error": "RESEND_API_KEY not configured"}

    resolved_login_url = (login_url or "").strip() or build_login_link()
    content = build_purchase_confirmation_email_content(
        full_name=full_name,
        login_email=login_email.strip().lower(),
        login_url=resolved_login_url,
        password_created_at_checkout=password_created_at_checkout,
    )

    try:
        import resend

        resend.api_key = RESEND_API_KEY
        params: dict[str, Any] = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email.strip().lower()],
            "subject": content["subject"],
            "html": content["html"],
        }
        response = resend.Emails.send(params)
        provider_message_id: str | None = None
        if isinstance(response, dict):
            provider_message_id = (
                str(response.get("id") or "")
                or str((response.get("data") or {}).get("id") or "")
                or None
            )
        else:
            provider_message_id = str(getattr(response, "id", "") or "") or None

        logger.info(
            "purchase_confirmation_email_sent to=%s provider_message_id=%s",
            to_email,
            provider_message_id or "",
        )
        return {"sent": True, "provider_message_id": provider_message_id, "error": None}
    except Exception as exc:
        logger.exception("purchase_confirmation_email_failed to=%s error=%s", to_email, exc)
        return {"sent": False, "provider_message_id": None, "error": str(exc)}
