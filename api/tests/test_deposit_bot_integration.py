"""
Integration tests for deposit bot endpoints - Story 4.1.
Tests the API endpoints that the Telegram bot will use.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from recyclic_api.main import app
from recyclic_api.models.deposit import DepositStatus

# Mock bot token for testing
TEST_BOT_TOKEN = "test_bot_token_123"


@pytest.fixture
def mock_bot_token():
    """Mock the bot token configuration."""
    with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', TEST_BOT_TOKEN):
        yield TEST_BOT_TOKEN


@pytest.fixture
def client_with_mock_token(mock_bot_token):
    """Create test client with mocked bot token."""
    return TestClient(app)


class TestDepositBotEndpoints:
    """Test class for bot-related deposit endpoints."""

    def test_create_deposit_from_bot_success(self, client_with_mock_token):
        """Test successful deposit creation from bot."""
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload, headers=headers)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "id" in data
        assert data["telegram_user_id"] == "12345"
        assert data["audio_file_path"] == "/audio/test_deposit.ogg"
        assert data["status"] == "pending_audio"

    def test_create_deposit_from_bot_missing_token(self, client_with_mock_token):
        """Test deposit creation without bot token."""
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload)

        assert response.status_code == 401
        assert "Missing X-Bot-Token header" in response.json()["detail"]

    def test_create_deposit_from_bot_invalid_token(self, client_with_mock_token):
        """Test deposit creation with invalid bot token."""
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": "invalid_token",
            "Content-Type": "application/json"
        }

        response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload, headers=headers)

        assert response.status_code == 401
        assert "Invalid bot token" in response.json()["detail"]

    @patch('recyclic_api.services.audio_processing_service.process_deposit_audio')
    def test_classify_deposit_success(self, mock_process_audio, client_with_mock_token):
        """Test successful deposit classification."""
        # First create a deposit
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        create_response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload, headers=headers)
        assert create_response.status_code == 200
        deposit_id = create_response.json()["id"]

        # Mock the audio processing service
        mock_process_audio.return_value = {
            "success": True,
            "transcription": "Un vieil ordinateur portable",
            "category": "IT_EQUIPMENT",
            "confidence": 0.85,
            "reasoning": "Détection d'équipement informatique",
            "status": "classified"
        }

        # Test classification
        classify_response = client_with_mock_token.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=headers
        )

        assert classify_response.status_code == 200
        data = classify_response.json()

        # Check classification results
        assert data["category"] == "it_equipment"
        assert data["ai_confidence"] == 0.85
        assert data["status"] == "classified"
        assert "ordinateur" in data["description"]

    def test_classify_deposit_missing_token(self, client_with_mock_token):
        """Test classification without bot token."""
        # Create a deposit first
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        create_response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload, headers=headers)
        deposit_id = create_response.json()["id"]

        # Try to classify without token
        response = client_with_mock_token.post(f"/api/v1/deposits/{deposit_id}/classify")

        assert response.status_code == 401
        assert "Missing X-Bot-Token header" in response.json()["detail"]

    def test_classify_deposit_not_found(self, client_with_mock_token):
        """Test classification of non-existent deposit."""
        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        response = client_with_mock_token.post(
            "/api/v1/deposits/11111111-1111-1111-1111-111111111111/classify",
            headers=headers
        )

        assert response.status_code == 404
        assert "Deposit not found" in response.json()["detail"]

    def test_get_deposits_list(self, client_with_mock_token):
        """Test getting list of deposits."""
        response = client_with_mock_token.get("/api/v1/deposits/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_single_deposit(self, client_with_mock_token):
        """Test getting a single deposit."""
        # Create a deposit first
        payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        create_response = client_with_mock_token.post("/api/v1/deposits/from-bot", json=payload, headers=headers)
        deposit_id = create_response.json()["id"]

        # Get the deposit
        response = client_with_mock_token.get(f"/api/v1/deposits/{deposit_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == deposit_id
        assert data["telegram_user_id"] == "12345"


if __name__ == '__main__':
    pytest.main([__file__])