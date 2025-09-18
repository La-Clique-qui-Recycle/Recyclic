"""
Email event model for tracking email delivery status and webhook events.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.sql import func

from recyclic_api.core.database import Base


class EmailEventType(str, Enum):
    """Email event types from Brevo webhooks."""
    DELIVERED = "delivered"
    BOUNCED = "bounced"
    SPAM = "spam"
    BLOCKED = "blocked"
    OPENED = "opened"
    CLICKED = "clicked"
    UNSUBSCRIBED = "unsubscribed"
    ERROR = "error"


class EmailEvent(Base):
    """
    Model for storing email webhook events from Brevo.

    This tracks the delivery status and events for emails sent through the system.
    """
    __tablename__ = "email_events"

    id = Column(Integer, primary_key=True, index=True)

    # Email identifiers
    email_address = Column(String(255), nullable=False, index=True)
    message_id = Column(String(255), nullable=True, index=True)  # Brevo message ID

    # Event details
    event_type = Column(String(50), nullable=False, index=True)  # EmailEventType
    event_timestamp = Column(DateTime(timezone=True), nullable=False)
    webhook_timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    # Event metadata
    reason = Column(Text, nullable=True)  # Bounce/spam reason
    error_code = Column(String(50), nullable=True)  # Error code if applicable
    user_agent = Column(Text, nullable=True)  # For opens/clicks
    ip_address = Column(String(45), nullable=True)  # For opens/clicks

    # Webhook metadata
    webhook_data = Column(Text, nullable=True)  # Raw webhook payload (JSON)
    processed = Column(String(10), default="pending", nullable=False)  # pending, success, error

    def __repr__(self):
        return f"<EmailEvent(email={self.email_address}, event={self.event_type}, timestamp={self.event_timestamp})>"


class EmailStatusModel(Base):
    """
    Model for tracking the current status of sent emails.

    This maintains the latest status for each email sent.
    """
    __tablename__ = "email_statuses"

    id = Column(Integer, primary_key=True, index=True)

    # Email identifiers
    email_address = Column(String(255), nullable=False, index=True)
    message_id = Column(String(255), nullable=True, index=True, unique=True)

    # Current status
    current_status = Column(String(50), nullable=False, default="sent", index=True)
    last_updated = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    # Send details
    sent_timestamp = Column(DateTime(timezone=True), nullable=False)
    subject = Column(String(255), nullable=True)
    provider = Column(String(50), default="brevo", nullable=False)

    # Tracking
    bounced_reason = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)

    def __repr__(self):
        return f"<EmailStatus(email={self.email_address}, status={self.current_status}, message_id={self.message_id})>"