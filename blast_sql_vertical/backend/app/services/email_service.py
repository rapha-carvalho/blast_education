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
