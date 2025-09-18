"""
Unit tests for the email webhook service.
"""
import pytest
import json
import hashlib
import hmac
from unittest.mock import MagicMock, patch
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from recyclic_api.services.email_webhook_service import BrevoWebhookService
from recyclic_api.models.email_event import EmailEvent, EmailStatusModel


class TestBrevoWebhookService:
    """Test cases for BrevoWebhookService class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_db = MagicMock(spec=Session)
        self.service = BrevoWebhookService(self.mock_db)

    def test_verify_webhook_signature_valid(self):
        """Test webhook signature verification with valid signature."""
        payload = b'{"event": "delivered", "email": "test@example.com"}'
        secret = "test-secret"

        # Generate valid signature
        signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        result = self.service.verify_webhook_signature(payload, signature, secret)
        assert result is True

    def test_verify_webhook_signature_invalid(self):
        """Test webhook signature verification with invalid signature."""
        payload = b'{"event": "delivered", "email": "test@example.com"}'
        secret = "test-secret"
        invalid_signature = "invalid-signature"

        result = self.service.verify_webhook_signature(payload, invalid_signature, secret)
        assert result is False

    def test_verify_webhook_signature_no_secret(self):
        """Test webhook signature verification when no secret is configured."""
        payload = b'{"event": "delivered", "email": "test@example.com"}'
        signature = "any-signature"

        result = self.service.verify_webhook_signature(payload, signature, None)
        assert result is True  # Should allow when no secret configured

    def test_process_webhook_event_delivered(self):
        """Test processing a delivered email webhook event."""
        payload = {
            "event": "delivered",
            "email": "test@example.com",
            "message-id": "msg-123",
            "ts": "1642608000",  # Unix timestamp
            "reason": ""
        }

        # Mock database operations
        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        result = self.service.process_webhook_event(payload)

        assert result["success"] is True
        assert result["event_type"] == "delivered"
        assert result["email"] == "test@example.com"

        # Verify database operations
        self.mock_db.add.assert_called()
        self.mock_db.commit.assert_called()

    def test_process_webhook_event_bounced(self):
        """Test processing a bounced email webhook event."""
        payload = {
            "event": "bounced",
            "email": "bounced@example.com",
            "message-id": "msg-456",
            "ts": "1642608000",
            "reason": "Mailbox does not exist"
        }

        # Mock database operations
        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        result = self.service.process_webhook_event(payload)

        assert result["success"] is True
        assert result["event_type"] == "bounced"
        assert result["email"] == "bounced@example.com"

    def test_process_webhook_event_missing_fields(self):
        """Test processing webhook event with missing required fields."""
        payload = {
            "event": "delivered"
            # Missing email field
        }

        with pytest.raises(HTTPException) as exc_info:
            self.service.process_webhook_event(payload)

        assert exc_info.value.status_code == 500

    def test_process_webhook_event_database_error(self):
        """Test processing webhook event when database error occurs."""
        payload = {
            "event": "delivered",
            "email": "test@example.com",
            "message-id": "msg-123",
            "ts": "1642608000"
        }

        # Mock database error
        self.mock_db.add.side_effect = Exception("Database error")
        self.mock_db.rollback = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            self.service.process_webhook_event(payload)

        assert exc_info.value.status_code == 500
        self.mock_db.rollback.assert_called()

    def test_update_email_status_existing_record(self):
        """Test updating an existing email status record."""
        # Mock existing email status
        mock_status = MagicMock()
        mock_status.current_status = "sent"
        mock_status.last_updated = datetime(2025, 1, 1)

        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_status

        # Call the method
        self.service._update_email_status(
            email_address="test@example.com",
            message_id="msg-123",
            event_type="delivered",
            reason=None,
            event_timestamp=datetime(2025, 1, 2)
        )

        # Verify status was updated
        assert mock_status.current_status == "delivered"
        assert mock_status.last_updated == datetime(2025, 1, 2)

    def test_update_email_status_no_record(self):
        """Test updating email status when no record exists."""
        # Mock no existing record
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Should not raise exception, just log warning
        self.service._update_email_status(
            email_address="test@example.com",
            message_id="msg-123",
            event_type="delivered",
            reason=None,
            event_timestamp=datetime(2025, 1, 2)
        )

        # No assertions needed - should just not crash

    def test_get_email_status_found(self):
        """Test getting email status when record exists."""
        # Mock email status record
        mock_status = MagicMock()
        mock_status.email_address = "test@example.com"
        mock_status.message_id = "msg-123"
        mock_status.current_status = "delivered"
        mock_status.sent_timestamp = datetime(2025, 1, 1)
        mock_status.last_updated = datetime(2025, 1, 2)
        mock_status.subject = "Test Subject"
        mock_status.provider = "brevo"
        mock_status.bounced_reason = None
        mock_status.error_details = None

        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_status

        result = self.service.get_email_status("test@example.com", "msg-123")

        assert result is not None
        assert result["email_address"] == "test@example.com"
        assert result["message_id"] == "msg-123"
        assert result["current_status"] == "delivered"
        assert result["subject"] == "Test Subject"

    def test_get_email_status_not_found(self):
        """Test getting email status when no record exists."""
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        result = self.service.get_email_status("test@example.com", "msg-123")

        assert result is None

    def test_get_email_events(self):
        """Test getting email events for an address."""
        # Mock email events
        mock_event1 = MagicMock()
        mock_event1.id = 1
        mock_event1.event_type = "delivered"
        mock_event1.event_timestamp = datetime(2025, 1, 1)
        mock_event1.webhook_timestamp = datetime(2025, 1, 1)
        mock_event1.reason = None
        mock_event1.error_code = None
        mock_event1.processed = "success"

        mock_event2 = MagicMock()
        mock_event2.id = 2
        mock_event2.event_type = "opened"
        mock_event2.event_timestamp = datetime(2025, 1, 2)
        mock_event2.webhook_timestamp = datetime(2025, 1, 2)
        mock_event2.reason = None
        mock_event2.error_code = None
        mock_event2.processed = "success"

        self.mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
            mock_event1, mock_event2
        ]

        result = self.service.get_email_events("test@example.com", 10)

        assert len(result) == 2
        assert result[0]["id"] == 1
        assert result[0]["event_type"] == "delivered"
        assert result[1]["id"] == 2
        assert result[1]["event_type"] == "opened"

    def test_get_email_events_empty(self):
        """Test getting email events when none exist."""
        self.mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []

        result = self.service.get_email_events("test@example.com", 10)

        assert len(result) == 0
        assert result == []