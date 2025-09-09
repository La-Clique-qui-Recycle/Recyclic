from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from ..core.database import Base

class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RegistrationRequest(Base):
    __tablename__ = "registration_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    telegram_id = Column(String, nullable=False, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    site = relationship("Site", back_populates="registration_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<RegistrationRequest(id={self.id}, telegram_id={self.telegram_id}, status={self.status})>"
