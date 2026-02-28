import base64
import hashlib
import re

from cryptography.fernet import Fernet

from app.config import CPF_ENCRYPTION_KEY

CPF_DIGITS = 11


def normalize_cpf(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) != CPF_DIGITS:
        raise ValueError("CPF must contain exactly 11 digits")
    return digits


def _build_fernet_key() -> bytes:
    if not CPF_ENCRYPTION_KEY:
        raise RuntimeError("Missing CPF_ENCRYPTION_KEY")
    # Accept either a native Fernet key or derive one from any secret string.
    raw = CPF_ENCRYPTION_KEY.encode("utf-8")
    try:
        decoded = base64.urlsafe_b64decode(raw)
        if len(decoded) == 32:
            return raw
    except Exception:
        pass
    digest = hashlib.sha256(raw).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_cpf(plain: str) -> str:
    normalized = normalize_cpf(plain)
    return Fernet(_build_fernet_key()).encrypt(normalized.encode("utf-8")).decode("utf-8")
