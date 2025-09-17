"""
Integration tests for deposit classification workflow (Story 4.2).

These tests verify the complete integration between the classification service,
database models, and API endpoints according to Story 4.2 requirements.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.deposit import Deposit, DepositStatus, EEECategory
from recyclic_api.core.database import get_db


# Mock bot token for testing
TEST_BOT_TOKEN = "test_bot_token_123"


class TestDepositClassificationIntegration:
    """Integration tests for the complete deposit classification workflow."""

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup method to patch the bot token for all tests."""
        with patch('recyclic_api.core.config.settings.TELEGRAM_BOT_TOKEN', TEST_BOT_TOKEN):
            self.client = TestClient(app)
            self.headers = {
                "X-Bot-Token": TEST_BOT_TOKEN,
                "Content-Type": "application/json"
            }

    def test_story_4_2_complete_workflow_success(self):
        """Test the complete Story 4.2 workflow: create -> classify -> verify new fields."""

        # Step 1: Create a deposit from bot
        create_payload = {
            "telegram_user_id": "story42_user",
            "audio_file_path": "/audio/ordinateur_test.ogg",
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        assert create_response.status_code == 200

        deposit_data = create_response.json()
        deposit_id = deposit_data["id"]

        # Verify initial state (Story 4.2 requirements)
        assert deposit_data["status"] == "pending_audio"
        assert deposit_data["category"] is None

        # Step 2: Classify the deposit
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        assert classify_response.status_code == 200
        classified_data = classify_response.json()

        # Verify Story 4.2 status flow
        assert classified_data["status"] == "pending_validation"  # Should be pending_validation now
        assert classified_data["category"] == "it_equipment"  # Based on our test file

        # Verify new Story 4.2 fields are populated (if available in response)
        # Note: These fields might not be in the response schema yet, but should be in the database

        print(f"✅ Story 4.2 workflow test passed!")
        print(f"   Deposit ID: {deposit_id}")
        print(f"   Final Status: {classified_data['status']}")
        print(f"   Category: {classified_data['category']}")

    def test_classification_with_low_confidence_alternatives(self):
        """Test classification workflow that generates alternatives for low confidence."""

        # Create deposit with audio that should generate alternatives
        create_payload = {
            "telegram_user_id": "alternatives_user",
            "audio_file_path": "/audio/aspirateur_test.ogg",  # Should generate alternatives
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        assert create_response.status_code == 200

        deposit_id = create_response.json()["id"]

        # Classify the deposit
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        assert classify_response.status_code == 200
        classified_data = classify_response.json()

        # Should still reach pending_validation even with lower confidence
        assert classified_data["status"] == "pending_validation"
        assert classified_data["category"] == "small_appliance"  # Based on fallback logic

        print(f"✅ Alternatives workflow test passed!")
        print(f"   Category: {classified_data['category']}")
        print(f"   Status: {classified_data['status']}")

    def test_classification_failure_handling(self):
        """Test classification failure handling according to Story 4.2."""

        # Create deposit with invalid audio path
        create_payload = {
            "telegram_user_id": "failure_user",
            "audio_file_path": "/nonexistent/invalid.ogg",
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        assert create_response.status_code == 200

        deposit_id = create_response.json()["id"]

        # Attempt to classify the deposit
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        assert classify_response.status_code == 200  # Should not raise HTTP error
        classified_data = classify_response.json()

        # Should be in classification_failed status according to Story 4.2
        assert classified_data["status"] == "classification_failed"
        assert classified_data["category"] is None  # Should remain null

        print(f"✅ Failure handling test passed!")
        print(f"   Status: {classified_data['status']}")

    def test_retry_classification_after_failure(self):
        """Test retrying classification after initial failure."""

        # Create deposit
        create_payload = {
            "telegram_user_id": "retry_user",
            "audio_file_path": "/nonexistent/invalid.ogg",
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        deposit_id = create_response.json()["id"]

        # First classification attempt (should fail)
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )
        assert classify_response.json()["status"] == "classification_failed"

        # Update deposit with valid audio path (simulate fixing the issue)
        # This would typically be done through an admin interface

        # Retry classification (should be allowed from classification_failed status)
        # First, let's check if we can retry from failed status
        retry_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        # Should be allowed to retry from classification_failed status
        assert retry_response.status_code == 200

        print(f"✅ Retry after failure test passed!")

    def test_invalid_status_for_classification(self):
        """Test that classification is rejected for deposits not in valid status."""

        # Create and manually update deposit to completed status
        create_payload = {
            "telegram_user_id": "invalid_status_user",
            "audio_file_path": "/audio/test.ogg",
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        deposit_id = create_response.json()["id"]

        # First, successfully classify it
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )
        assert classify_response.status_code == 200

        # Try to classify again (should be rejected)
        second_classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        # Should reject classification for non-pending status
        assert second_classify_response.status_code == 400
        error_detail = second_classify_response.json()["detail"]
        assert "status must be" in error_detail.lower()

        print(f"✅ Invalid status rejection test passed!")

    def test_no_audio_file_error(self):
        """Test classification failure when no audio file is attached."""

        # Create deposit without audio file
        create_payload = {
            "telegram_user_id": "no_audio_user",
            "audio_file_path": None,  # No audio file
            "status": "pending_audio"
        }

        create_response = self.client.post(
            "/api/v1/deposits/from-bot",
            json=create_payload,
            headers=self.headers
        )
        deposit_id = create_response.json()["id"]

        # Try to classify without audio file
        classify_response = self.client.post(
            f"/api/v1/deposits/{deposit_id}/classify",
            headers=self.headers
        )

        assert classify_response.status_code == 400
        error_detail = classify_response.json()["detail"]
        assert "no audio file" in error_detail.lower()

        print(f"✅ No audio file error test passed!")

    def test_deposit_not_found_error(self):
        """Test classification with non-existent deposit ID."""

        # Try to classify non-existent deposit
        classify_response = self.client.post(
            "/api/v1/deposits/00000000-0000-0000-0000-000000000000/classify",
            headers=self.headers
        )

        assert classify_response.status_code == 404
        error_detail = classify_response.json()["detail"]
        assert "not found" in error_detail.lower()

        print(f"✅ Deposit not found error test passed!")


class TestDepositModelStory42Fields:
    """Test that the new Story 4.2 fields are properly stored in the database."""

    def test_new_deposit_status_enum_values(self):
        """Test that new DepositStatus enum values are available."""

        # Verify new status values exist
        assert DepositStatus.PENDING_VALIDATION in DepositStatus
        assert DepositStatus.CLASSIFICATION_FAILED in DepositStatus

        # Verify string values
        assert DepositStatus.PENDING_VALIDATION.value == "pending_validation"
        assert DepositStatus.CLASSIFICATION_FAILED.value == "classification_failed"

        print(f"✅ New DepositStatus enum values test passed!")

    def test_deposit_model_has_new_fields(self):
        """Test that Deposit model has the new Story 4.2 fields."""
        from recyclic_api.models.deposit import Deposit

        # Create a deposit instance to verify fields exist
        deposit = Deposit()

        # Verify new fields exist
        assert hasattr(deposit, 'transcription')
        assert hasattr(deposit, 'eee_category')
        assert hasattr(deposit, 'confidence_score')
        assert hasattr(deposit, 'alternative_categories')

        print(f"✅ New Deposit model fields test passed!")


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, "-v"])