import os
from pathlib import Path


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str) -> list[str]:
    raw = os.getenv(name, "")
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


CONTENT_DIR = Path(os.getenv("CONTENT_DIR", Path(__file__).parent.parent / "content"))
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", 10240))
USER_DB_PATH = Path(os.getenv("USER_DB_PATH", Path(__file__).parent.parent / "data" / "users.db"))
AUTH_TOKEN_TTL_HOURS = int(os.getenv("AUTH_TOKEN_TTL_HOURS", 24 * 7))
INITIAL_ADMIN_EMAIL = os.getenv("INITIAL_ADMIN_EMAIL", "").strip().lower()
INITIAL_ADMIN_PASSWORD = os.getenv("INITIAL_ADMIN_PASSWORD", "")
STRICT_CONTENT_VALIDATION = env_bool("STRICT_CONTENT_VALIDATION", default=True)

PDF_RENDER_TIMEOUT_MS = int(os.getenv("PDF_RENDER_TIMEOUT_MS", "45000"))
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = os.getenv("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH", "").strip() or None
PLAYWRIGHT_CHROMIUM_ARGS = [
    arg.strip()
    for arg in os.getenv("PLAYWRIGHT_CHROMIUM_ARGS", "--disable-dev-shm-usage,--no-sandbox").split(",")
    if arg.strip()
]

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", os.getenv("STRIPE_SEKRET_KEY", "")).strip()
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
STRIPE_WEBHOOK_SECRET_FILE = os.getenv("STRIPE_WEBHOOK_SECRET_FILE", "").strip()
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "").strip()
CHECKOUT_SUCCESS_URL = os.getenv("CHECKOUT_SUCCESS_URL", "").strip()
CHECKOUT_CANCEL_URL = os.getenv("CHECKOUT_CANCEL_URL", "").strip()
CHECKOUT_RETURN_URL = os.getenv("CHECKOUT_RETURN_URL", CHECKOUT_SUCCESS_URL).strip()
STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES = env_list("STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES")
if not STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES:
    STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES = ["card", "pix"]
STRIPE_CHECKOUT_LOCALE = os.getenv("STRIPE_CHECKOUT_LOCALE", "pt-BR").strip()
STRIPE_CARD_INSTALLMENTS_ENABLED = env_bool("STRIPE_CARD_INSTALLMENTS_ENABLED", default=True)
STRIPE_WEBHOOK_FORWARD_EVENTS = os.getenv(
    "STRIPE_WEBHOOK_FORWARD_EVENTS",
    "checkout.session.completed,payment_intent.succeeded,charge.refunded,customer.subscription.deleted,charge.dispute.created",
).strip()
STRIPE_AUTOMATIC_TAX_ENABLED = env_bool("STRIPE_AUTOMATIC_TAX_ENABLED", default=False)
BILLING_COURSE_ID = os.getenv("BILLING_COURSE_ID", "sql-basics").strip() or "sql-basics"
ACCESS_DURATION_MONTHS = int(os.getenv("ACCESS_DURATION_MONTHS", "6"))
CPF_ENCRYPTION_KEY = os.getenv("CPF_ENCRYPTION_KEY", "").strip()
CHECKOUT_SIGNUP_INTENT_TTL_HOURS = int(os.getenv("CHECKOUT_SIGNUP_INTENT_TTL_HOURS", "24"))
REFUND_WINDOW_DAYS = int(os.getenv("REFUND_WINDOW_DAYS", "14"))

_impersonation_ttl_minutes = int(os.getenv("IMPERSONATION_TTL_MINUTES", "30"))
IMPERSONATION_TTL_MINUTES = max(15, min(60, _impersonation_ttl_minutes))

# Password reset + Resend email
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Blast Education <noreply@blastgroup.org>").strip()
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173").strip().rstrip("/")
PASSWORD_RESET_TOKEN_TTL_MINUTES = int(os.getenv("PASSWORD_RESET_TOKEN_TTL_MINUTES", "60"))
