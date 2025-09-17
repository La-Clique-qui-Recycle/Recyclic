"""
Simple test for bot authentication to verify the fix.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from recyclic_api.main import app

# Mock bot token for testing
TEST_BOT_TOKEN = "test_bot_token_123"


def test_bot_auth_missing_token():
    """Test that missing token returns 401."""
    # Test without any token configuration
    client = TestClient(app)

    payload = {
        "telegram_user_id": "12345",
        "audio_file_path": "/audio/test_deposit.ogg",
        "status": "pending_audio"
    }

    # No headers = missing token
    response = client.post("/api/v1/deposits/from-bot", json=payload)

    # Should return 401 for missing token
    assert response.status_code == 401
    assert "Missing X-Bot-Token header" in response.json()["detail"]


def test_bot_auth_with_configured_token():
    """Test that valid token works when configured."""
    with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', TEST_BOT_TOKEN):
        client = TestClient(app)

        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        response = client.post("/api/v1/deposits/from-bot", json=payload, headers=headers)

        # Should succeed with valid token
        assert response.status_code == 200
        data = response.json()
        assert data["telegram_user_id"] == "12345"


def test_bot_auth_invalid_token():
    """Test that invalid token returns 401."""
    with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', TEST_BOT_TOKEN):
        client = TestClient(app)

        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": "wrong_token",
            "Content-Type": "application/json"
        }

        response = client.post("/api/v1/deposits/from-bot", json=payload, headers=headers)

        # Should return 401 for invalid token
        assert response.status_code == 401
        assert "Invalid bot token" in response.json()["detail"]


def test_bot_auth_no_token_configured():
    """Test that endpoints fail gracefully when no token is configured."""
    with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', None):
        client = TestClient(app)

        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": "any_token",
            "Content-Type": "application/json"
        }

        response = client.post("/api/v1/deposits/from-bot", json=payload, headers=headers)

        # Should return 503 when no token is configured on server
        assert response.status_code == 503
        assert "Bot token not configured on server" in response.json()["detail"]


if __name__ == '__main__':
    pytest.main([__file__])