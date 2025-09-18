from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey, Text, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from recyclic_api.core.database import Base

class EEECategory(str, enum.Enum):
    SMALL_APPLIANCE = "small_appliance"
    LARGE_APPLIANCE = "large_appliance"
    IT_EQUIPMENT = "it_equipment"
    LIGHTING = "lighting"
    TOOLS = "tools"
    TOYS = "toys"
    MEDICAL_DEVICES = "medical_devices"
    MONITORING_CONTROL = "monitoring_control"
    AUTOMATIC_DISPENSERS = "automatic_dispensers"
    OTHER = "other"

class DepositStatus(str, enum.Enum):
    PENDING_AUDIO = "pending_audio"
    AUDIO_PROCESSING = "audio_processing"
    PENDING_VALIDATION = "pending_validation"
    CLASSIFICATION_FAILED = "classification_failed"
    CLASSIFIED = "classified"
    VALIDATED = "validated"
    COMPLETED = "completed"

class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)  # Made nullable for telegram_user_id deposits
    telegram_user_id = Column(String, nullable=True)  # Telegram user ID for bot deposits
    audio_file_path = Column(String, nullable=True)  # Path to audio file
    status = Column(Enum(DepositStatus), nullable=False, default=DepositStatus.PENDING_AUDIO)
    category = Column(Enum(EEECategory), nullable=True)  # Made nullable initially
    weight = Column(Float, nullable=True)  # Poids en kg
    description = Column(String, nullable=True)
    # AI processing fields according to Story 4.2
    transcription = Column(Text, nullable=True)  # Audio transcription
    eee_category = Column(Enum(EEECategory), nullable=True)  # AI classified category
    confidence_score = Column(Float, nullable=True)  # Classification confidence (0-1)
    alternative_categories = Column(JSON, nullable=True)  # Alternative classifications for low confidence
    ai_classification = Column(String, nullable=True)  # Legacy field - keep for compatibility
    ai_confidence = Column(Float, nullable=True)  # Legacy field - keep for compatibility
# Human validation/correction tracking fields (Story 4.3) - temporarily commented out for testing
    # human_validated = Column(Boolean, default=False)  # True if human validated AI classification
    # human_corrected = Column(Boolean, default=False)  # True if human corrected AI classification
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="deposits")
    site = relationship("Site", back_populates="deposits")

    def __repr__(self):
        return f"<Deposit(id={self.id}, category={self.category}, weight={self.weight})>"
