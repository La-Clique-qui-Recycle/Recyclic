from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from recyclic_api.core.database import Base


class PaymentMethod(str, enum.Enum):
    """Méthodes de paiement disponibles - codes simples pour éviter problèmes d'encodage"""
    CASH = "cash"
    CARD = "card"
    CHECK = "check"


class Sale(Base):
    """Modèle pour les ventes - étendu pour Story 1.1.1 avec traçage des boutons prédéfinis"""
    __tablename__ = "sales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cash_session_id = Column(UUID(as_uuid=True), ForeignKey("cash_sessions.id"), nullable=False)
    operator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    total_amount = Column(Float, nullable=False)
    donation = Column(Float, nullable=True, default=0.0)
    payment_method = Column(SQLEnum(PaymentMethod, name="payment_method", native_enum=False), nullable=True, default=PaymentMethod.CASH)
    # Story 1.1.2: preset_id et notes déplacés vers sale_items (par item individuel)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cash_session = relationship("CashSession", back_populates="sales")
    operator = relationship("User")
    # Story 1.1.2: Relation preset_button supprimée - presets maintenant sur sale_items
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Sale(id={self.id}, total_amount={self.total_amount})>"
