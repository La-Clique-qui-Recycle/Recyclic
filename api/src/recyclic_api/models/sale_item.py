from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from recyclic_api.core.database import Base


class SaleItem(Base):
    """Modèle pour les articles d'une vente"""
    __tablename__ = "sale_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False)
    category = Column(String(50), nullable=False)  # EEE-1, EEE-2, etc.
    quantity = Column(Integer, nullable=False)  # Kept for backward compatibility
    weight = Column(Float, nullable=False)  # Poids en kg avec décimales
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="items")

    def __repr__(self):
        return f"<SaleItem(id={self.id}, category={self.category}, weight={self.weight})>"
