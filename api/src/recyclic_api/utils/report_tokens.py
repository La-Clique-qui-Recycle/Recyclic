import base64
import hmac
import hashlib
import secrets
import time

from recyclic_api.core.config import settings


def _encode_payload(payload: bytes) -> str:
    """Encode payload bytes for safe URL transport."""
    return base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")


def _decode_payload(encoded: str) -> bytes | None:
    """Decode a payload string that may need padding."""
    try:
        padding = "=" * (-len(encoded) % 4)
        return base64.urlsafe_b64decode(encoded + padding)
    except Exception:
        return None


def _sign(payload: bytes) -> str:
    secret = settings.SECRET_KEY.encode("utf-8")
    signature = hmac.new(secret, payload, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")


def generate_download_token(filename: str, ttl_seconds: int | None = None) -> str:
    """Generate a signed, time-bound token granting report access."""
    ttl = ttl_seconds or settings.CASH_SESSION_REPORT_TOKEN_TTL_SECONDS
    expires_at = int(time.time()) + max(ttl, 60)
    nonce = secrets.token_urlsafe(12)
    payload = f"{filename}:{nonce}:{expires_at}".encode("utf-8")
    payload_encoded = _encode_payload(payload)
    signature = _sign(payload)
    return f"{payload_encoded}.{signature}"


def verify_download_token(token: str, filename: str) -> bool:
    """Validate a token for the requested filename."""
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError:
        return False

    payload_bytes = _decode_payload(payload_b64)
    if payload_bytes is None:
        return False

    expected_signature = _sign(payload_bytes)
    if not hmac.compare_digest(signature, expected_signature):
        return False

    try:
        payload_filename, _nonce, expires_at_str = payload_bytes.decode("utf-8").rsplit(":", 2)
        expires_at = int(expires_at_str)
    except (ValueError, UnicodeDecodeError):
        return False

    if payload_filename != filename:
        return False

    if expires_at < int(time.time()):
        return False

    return True
