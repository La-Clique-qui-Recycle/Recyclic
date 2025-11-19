from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from recyclic_api.core.database import Base


def get_enum_values(enum_class):
    """Extract values from enum class for SQLAlchemy values_callable"""
    return [member.value for member in enum_class]


class ButtonType(str, enum.Enum):
    DONATION = "donation"
    RECYCLING = "recycling"


class PresetButton(Base):
    __tablename__ = "preset_buttons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True)
    preset_price = Column(Numeric(10, 2), nullable=False)
    button_type = Column(Enum(ButtonType, values_callable=get_enum_values), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("Category")

    def __repr__(self):
        return f"<PresetButton(id={self.id}, name={self.name}, button_type={self.button_type}, preset_price={self.preset_price})>"
