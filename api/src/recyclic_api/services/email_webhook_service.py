"""
Service for handling Brevo webhook events and updating email status.
"""
import json
import logging
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException

from recyclic_api.models.email_event import EmailEvent, EmailStatusModel, EmailEventType
from recyclic_api.core.config import settings

logger = logging.getLogger(__name__)


class BrevoWebhookService:
    """Service for processing Brevo webhook events."""

    def __init__(self, db: Session):
        """
        Initialize the webhook service.

        Args:
            db: Database session
        """
        self.db = db

    def verify_webhook_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        """
        Verify the webhook signature from Brevo.

        Args:
            payload: Raw webhook payload
            signature: Signature from X-Mailin-Signature header
            webhook_secret: Webhook secret configured in Brevo

        Returns:
            bool: True if signature is valid
        """
        if not webhook_secret:
            logger.warning("Webhook secret not configured, skipping signature verification")
            return True  # Allow for development/testing

        try:
            # Brevo uses HMAC-SHA256
            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()

            # Compare signatures (constant time comparison)
            return hmac.compare_digest(signature, expected_signature)

        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False

    def process_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a webhook event from Brevo.

        Args:
            payload: Parsed webhook payload

        Returns:
            Dict with processing result
        """
        try:
            # Extract event details
            event_type = payload.get("event")
            email_address = payload.get("email")
            message_id = payload.get("message-id")
            timestamp_str = payload.get("ts")
            reason = payload.get("reason", "")

            if not event_type or not email_address:
                raise ValueError("Missing required fields: event or email")

            # Parse timestamp
            if timestamp_str:
                try:
                    # Brevo sends timestamp as Unix timestamp
                    event_timestamp = datetime.fromtimestamp(int(timestamp_str))
                except (ValueError, TypeError):
                    event_timestamp = datetime.now(timezone.utc)
            else:
                event_timestamp = datetime.now(timezone.utc)

            # Validate event type
            if event_type not in [e.value for e in EmailEventType]:
                logger.warning(f"Unknown event type: {event_type}")
                event_type = "unknown"

            # Create email event record
            email_event = EmailEvent(
                email_address=email_address,
                message_id=message_id,
                event_type=event_type,
                event_timestamp=event_timestamp,
                reason=reason,
                error_code=payload.get("error_code"),
                user_agent=payload.get("user-agent"),
                ip_address=payload.get("ip"),
                webhook_data=json.dumps(payload),
                processed="pending"
            )

            self.db.add(email_event)

            # Update email status
            self._update_email_status(
                email_address=email_address,
                message_id=message_id,
                event_type=event_type,
                reason=reason,
                event_timestamp=event_timestamp
            )

            # Mark event as processed
            email_event.processed = "success"
            self.db.commit()

            logger.info(
                f"Processed webhook event",
                extra={
                    "event": "webhook_processed",
                    "email": email_address,
                    "message_id": message_id,
                    "event_type": event_type,
                    "timestamp": event_timestamp.isoformat()
                }
            )

            return {
                "success": True,
                "event_id": email_event.id,
                "event_type": event_type,
                "email": email_address
            }

        except Exception as e:
            # Mark event as error if we created it
            if 'email_event' in locals():
                email_event.processed = "error"

            self.db.rollback()

            logger.error(
                f"Error processing webhook event: {e}",
                extra={
                    "event": "webhook_error",
                    "payload": payload,
                    "error": str(e)
                }
            )

            raise HTTPException(
                status_code=500,
                detail=f"Error processing webhook event: {str(e)}"
            )

    def _update_email_status(
        self,
        email_address: str,
        message_id: Optional[str],
        event_type: str,
        reason: Optional[str],
        event_timestamp: datetime
    ):
        """
        Update the email status based on the webhook event.

        Args:
            email_address: Email recipient
            message_id: Brevo message ID
            event_type: Type of event
            reason: Event reason (for bounces/errors)
            event_timestamp: When the event occurred
        """
        # Find existing status record
        status_query = self.db.query(EmailStatusModel)

        if message_id:
            email_status = status_query.filter(EmailStatusModel.message_id == message_id).first()
        else:
            # Fallback to email address if no message ID
            email_status = status_query.filter(
                EmailStatusModel.email_address == email_address
            ).order_by(EmailStatusModel.sent_timestamp.desc()).first()

        if not email_status:
            logger.warning(f"No email status found for {email_address} (message_id: {message_id})")
            return

        # Map event types to statuses
        status_mapping = {
            EmailEventType.DELIVERED: "delivered",
            EmailEventType.BOUNCED: "bounced",
            EmailEventType.SPAM: "spam",
            EmailEventType.BLOCKED: "blocked",
            EmailEventType.ERROR: "error"
        }

        new_status = status_mapping.get(event_type, email_status.current_status)

        # Only update if this is a significant status change
        should_update = (
            new_status != email_status.current_status and
            event_timestamp >= email_status.last_updated
        )

        if should_update:
            email_status.current_status = new_status
            email_status.last_updated = event_timestamp

            # Store bounce/error details
            if event_type in [EmailEventType.BOUNCED, EmailEventType.ERROR]:
                email_status.bounced_reason = reason
                email_status.error_details = reason

            logger.info(
                f"Updated email status: {email_address} -> {new_status}",
                extra={
                    "event": "status_updated",
                    "email": email_address,
                    "message_id": message_id,
                    "old_status": email_status.current_status,
                    "new_status": new_status
                }
            )

    def get_email_status(self, email_address: str, message_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the current status of an email.

        Args:
            email_address: Email recipient
            message_id: Optional message ID for specific lookup

        Returns:
            Dict with email status information or None if not found
        """
        query = self.db.query(EmailStatusModel)

        if message_id:
            email_status = query.filter(EmailStatusModel.message_id == message_id).first()
        else:
            email_status = query.filter(
                EmailStatusModel.email_address == email_address
            ).order_by(EmailStatusModel.sent_timestamp.desc()).first()

        if not email_status:
            return None

        return {
            "email_address": email_status.email_address,
            "message_id": email_status.message_id,
            "current_status": email_status.current_status,
            "sent_timestamp": email_status.sent_timestamp.isoformat(),
            "last_updated": email_status.last_updated.isoformat(),
            "subject": email_status.subject,
            "provider": email_status.provider,
            "bounced_reason": email_status.bounced_reason,
            "error_details": email_status.error_details
        }

    def get_email_events(self, email_address: str, limit: int = 10) -> list[Dict[str, Any]]:
        """
        Get recent events for an email address.

        Args:
            email_address: Email recipient
            limit: Maximum number of events to return

        Returns:
            List of email events
        """
        events = self.db.query(EmailEvent).filter(
            EmailEvent.email_address == email_address
        ).order_by(EmailEvent.event_timestamp.desc()).limit(limit).all()

        return [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_timestamp": event.event_timestamp.isoformat(),
                "webhook_timestamp": event.webhook_timestamp.isoformat(),
                "reason": event.reason,
                "error_code": event.error_code,
                "processed": event.processed
            }
            for event in events
        ]