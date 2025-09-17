"""
Bot authentication utilities for validating Telegram bot requests.
"""

from fastapi import HTTPException, status, Header
from typing import Optional
from .config import settings


def validate_bot_token(x_bot_token: Optional[str] = Header(None)) -> str:
    """
    Validate the bot token from the X-Bot-Token header.

    Args:
        x_bot_token: Token from the X-Bot-Token header

    Returns:
        The validated token

    Raises:
        HTTPException: If token is missing or invalid
    """
    if not x_bot_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Bot-Token header"
        )

    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot token not configured on server"
        )

    if x_bot_token != settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bot token"
        )

    return x_bot_token


# FastAPI dependency for bot token validation
# Use this directly in endpoints that need bot authentication
get_bot_token_dependency = validate_bot_token