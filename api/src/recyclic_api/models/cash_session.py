from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from enum import Enum as PyEnum
import uuid

from ..core.database import Base


class CashSessionStatus(PyEnum):
    OPEN = "open"
    CLOSED = "closed"


class CashSession(Base):
    """
    Modèle pour les sessions de caisse.
    
    Une session de caisse représente une période d'ouverture de caisse
    avec un fond initial et un suivi des ventes.
    """
    __tablename__ = "cash_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Opérateur (caissier) responsable de la session
    operator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    operator = relationship("User", back_populates="cash_sessions")
    
    # Site où se déroule la session
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=False)
    site = relationship("Site", back_populates="cash_sessions")
    
    # Montants financiers
    initial_amount = Column(Float, nullable=False, default=0.0)
    current_amount = Column(Float, nullable=False, default=0.0)
    
    # Statut de la session
    status = Column(Enum(CashSessionStatus), nullable=False, default=CashSessionStatus.OPEN)
    
    # Timestamps
    opened_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistiques de vente (calculées)
    total_sales = Column(Float, nullable=True, default=0.0)
    total_items = Column(Integer, nullable=True, default=0)
    
    # Relations
    sales = relationship("Sale", back_populates="cash_session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CashSession(id='{self.id}', operator_id='{self.operator_id}', status='{self.status.value}')>"

    def to_dict(self):
        """Convertit l'objet en dictionnaire pour la sérialisation."""
        return {
            "id": self.id,
            "operator_id": self.operator_id,
            "initial_amount": self.initial_amount,
            "current_amount": self.current_amount,
            "status": self.status.value,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "total_sales": self.total_sales,
            "total_items": self.total_items
        }

    def close_session(self):
        """Ferme la session de caisse."""
        self.status = CashSessionStatus.CLOSED
        self.closed_at = datetime.utcnow()

    def add_sale(self, amount: float):
        """Ajoute une vente à la session."""
        if amount <= 0:
            raise ValueError("Le montant de la vente doit être positif")
        if not self.is_open():
            raise ValueError("Impossible d'ajouter une vente à une session fermée")
        
        self.current_amount += amount
        self.total_sales = (self.total_sales or 0) + amount
        self.total_items = (self.total_items or 0) + 1

    def is_open(self) -> bool:
        """Vérifie si la session est ouverte."""
        return self.status == CashSessionStatus.OPEN

    def get_daily_summary(self) -> dict:
        """Retourne un résumé de la session."""
        return {
            "session_id": self.id,
            "operator": self.operator.username if self.operator else "Unknown",
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "initial_amount": self.initial_amount,
            "current_amount": self.current_amount,
            "total_sales": self.total_sales or 0,
            "total_items": self.total_items or 0,
            "status": self.status.value
        }