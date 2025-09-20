"""Tests for the Telegram user lookup endpoint used by the bot."""

from unittest.mock import patch

from recyclic_api.models.user import User, UserStatus, UserRole
from recyclic_api.core.security import hash_password

TEST_BOT_TOKEN = "test_bot_token_123"


def _create_user(db_session, telegram_id: str = "tg_lookup") -> User:
    user = User(
        username=f"user_{telegram_id}",
        hashed_password=hash_password("very_secure_password"),
        telegram_id=telegram_id,
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_get_user_by_telegram_id_requires_valid_token(client, db_session):
    """Ensure the lookup endpoint enforces bot token validation."""
    user = _create_user(db_session)
    url = f"/api/v1/users/telegram/{user.telegram_id}"

    with patch("recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN", TEST_BOT_TOKEN):
        response = client.get(url)
        assert response.status_code == 401
        assert "Missing X-Bot-Token" in response.json()["detail"]

        response = client.get(url, headers={"X-Bot-Token": "wrong_token"})
        assert response.status_code == 401
        assert "Invalid bot token" in response.json()["detail"]

        response = client.get(url, headers={"X-Bot-Token": TEST_BOT_TOKEN})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)
        assert data["telegram_id"] == user.telegram_id
        assert data["status"] == user.status.value


def test_get_user_by_telegram_id_not_found(client, db_session):
    """Return 404 when no user is associated with the given telegram id."""
    with patch("recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN", TEST_BOT_TOKEN):
        response = client.get(
            "/api/v1/users/telegram/unknown_user",
            headers={"X-Bot-Token": TEST_BOT_TOKEN},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"
