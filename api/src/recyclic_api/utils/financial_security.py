import base64
import hashlib
from functools import lru_cache
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from recyclic_api.core.config import settings


class FinancialDataError(RuntimeError):
    """Raised when encryption or decryption of financial data fails."""


@lru_cache(maxsize=1)
def _cipher() -> Fernet:
    """Build a Fernet cipher derived from the SECRET_KEY."""
    derived = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(derived)
    return Fernet(key)


def encrypt_string(value: str) -> str:
    """Encrypt an arbitrary string value using the project secret."""
    token = _cipher().encrypt(value.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_string(token: str) -> str:
    """Decrypt a string value produced by ``encrypt_string``."""
    try:
        decrypted = _cipher().decrypt(token.encode("utf-8"))
    except InvalidToken as exc:
        raise FinancialDataError("Invalid encrypted payload") from exc
    return decrypted.decode("utf-8")


def encrypt_numeric(value: Any) -> str:
    """Encrypt a numeric value after normalising to string."""
    return encrypt_string(f"{value}")


def decrypt_numeric(token: str, cast_type=float) -> Any:
    """Decrypt a numeric payload and cast to the requested type."""
    raw = decrypt_string(token)
    try:
        return cast_type(raw)
    except ValueError as exc:
        raise FinancialDataError("Encrypted numeric payload is malformed") from exc
