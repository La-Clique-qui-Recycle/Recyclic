"""
Test to verify classification is working after fixes.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from recyclic_api.main import app

# Mock bot token for testing
TEST_BOT_TOKEN = "test_bot_token_123"


def test_full_deposit_classification_workflow():
    """Test the complete workflow: create deposit -> classify -> verify results."""

    with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', TEST_BOT_TOKEN):
        client = TestClient(app)

        # Step 1: Create a deposit from bot
        create_payload = {
            "telegram_user_id": "12345",
            "audio_file_path": "/audio/test_deposit.ogg",
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": TEST_BOT_TOKEN,
            "Content-Type": "application/json"
        }

        create_response = client.post("/api/v1/deposits/from-bot", json=create_payload, headers=headers)
        assert create_response.status_code == 200

        deposit_data = create_response.json()
        deposit_id = deposit_data["id"]

        # Verify initial state
        assert deposit_data["telegram_user_id"] == "12345"
        assert deposit_data["audio_file_path"] == "/audio/test_deposit.ogg"
        assert deposit_data["status"] == "pending_audio"
        assert deposit_data["category"] is None  # Should be null initially

        # Step 2: Classify the deposit
        classify_response = client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=headers
        )

        assert classify_response.status_code == 200

        classified_data = classify_response.json()

        # Verify classification results
        assert classified_data["id"] == deposit_id
        assert classified_data["status"] == "classified"  # Should be classified now
        assert classified_data["category"] == "it_equipment"  # Based on our test file
        assert classified_data["ai_confidence"] == 0.7  # From fallback classification
        assert "ordinateur" in classified_data["description"].lower()  # Transcription
        assert "equipment" in classified_data["ai_classification"].lower()  # Reasoning

        print(f"✅ Full workflow test passed!")
        print(f"   Deposit ID: {deposit_id}")
        print(f"   Category: {classified_data['category']}")
        print(f"   Confidence: {classified_data['ai_confidence']}")
        print(f"   Description: {classified_data['description']}")


if __name__ == '__main__':
    pytest.main([__file__])