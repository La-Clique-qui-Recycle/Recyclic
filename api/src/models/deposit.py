from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from ..core.database import Base

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

class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=False)
    category = Column(Enum(EEECategory), nullable=False)
    weight = Column(Float, nullable=True)  # Poids en kg
    description = Column(String, nullable=True)
    ai_classification = Column(String, nullable=True)  # Classification IA
    ai_confidence = Column(Float, nullable=True)  # Confiance IA (0-1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="deposits")
    site = relationship("Site", back_populates="deposits")
    sales = relationship("Sale", back_populates="deposit")

    def __repr__(self):
        return f"<Deposit(id={self.id}, category={self.category}, weight={self.weight})>"
