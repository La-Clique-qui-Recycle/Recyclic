from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from recyclic_api.core.database import Base


class CashRegister(Base):
    """
    Modèle pour les postes de caisse (registre physique).
    """
    __tablename__ = "cash_registers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    site = relationship("Site", back_populates="cash_registers", lazy="joined")

    def __repr__(self) -> str:
        return f"<CashRegister(id={self.id}, name={self.name!r}, is_active={self.is_active})>"



