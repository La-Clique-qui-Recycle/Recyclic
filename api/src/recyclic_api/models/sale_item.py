from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from recyclic_api.core.database import Base


class SaleItem(Base):
    """Modèle pour les articles d'une vente - étendu pour Story 1.1.2 avec preset par item"""
    __tablename__ = "sale_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False)
    category = Column(String(50), nullable=False)  # EEE-1, EEE-2, etc.
    quantity = Column(Integer, nullable=False)  # Kept for backward compatibility
    weight = Column(Float, nullable=True)  # Poids en kg avec décimales (facultatif dans certains tests)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    # Story 1.1.2: Chaque item de vente peut avoir son propre preset et notes
    preset_id = Column(UUID(as_uuid=True), ForeignKey("preset_buttons.id"), nullable=True, comment="Référence au bouton prédéfini utilisé pour cet item")
    notes = Column(String, nullable=True, comment="Notes spécifiques à cet item de vente")

    # Relationships
    sale = relationship("Sale", back_populates="items")
    preset_button = relationship("PresetButton", backref="sale_items")  # Relation vers le bouton prédéfini

    def __repr__(self):
        return f"<SaleItem(id={self.id}, category={self.category}, weight={self.weight})>"
