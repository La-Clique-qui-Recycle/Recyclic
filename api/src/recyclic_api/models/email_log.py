from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from recyclic_api.core.database import Base

def get_enum_values(enum_class):
    """Extract values from enum class for SQLAlchemy values_callable"""
    return [member.value for member in enum_class]

class EmailStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"

class EmailType(str, enum.Enum):
    PASSWORD_RESET = "password_reset"
    WELCOME = "welcome"
    NOTIFICATION = "notification"
    ADMIN_NOTIFICATION = "admin_notification"
    OTHER = "other"

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Email details
    recipient_email = Column(String, nullable=False, index=True)
    recipient_name = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    
    # Status and tracking
    status = Column(Enum(EmailStatus, values_callable=get_enum_values), default=EmailStatus.PENDING, nullable=False, index=True)
    email_type = Column(Enum(EmailType, values_callable=get_enum_values), default=EmailType.OTHER, nullable=False, index=True)
    
    # External service tracking
    external_id = Column(String, nullable=True, index=True)  # ID from Brevo or other email service
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    bounced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Optional user relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    user = relationship("User", back_populates="email_logs")
    
    # Additional metadata
    additional_data = Column(Text, nullable=True)  # JSON string for additional data


