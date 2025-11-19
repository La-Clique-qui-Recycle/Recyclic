from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from enum import Enum as PyEnum
import uuid

from ..core.database import Base


class CashSessionStatus(PyEnum):
    OPEN = "open"
    CLOSED = "closed"


class CashSessionStep(PyEnum):
    ENTRY = "entry"      # Phase de réception/dépôt d'objets
    SALE = "sale"        # Phase de vente (caisse)
    EXIT = "exit"        # Phase de clôture


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

    # Poste de caisse (registre) utilisé pour la session
    register_id = Column(UUID(as_uuid=True), ForeignKey("cash_registers.id"), nullable=True)
    register = relationship("CashRegister", lazy="joined")
    
    # Montants financiers
    initial_amount = Column(Float, nullable=False, default=0.0)
    current_amount = Column(Float, nullable=False, default=0.0)
    
    # Statut de la session
    status = Column(
        SAEnum(CashSessionStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CashSessionStatus.OPEN,
    )
    
    # Timestamps
    opened_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Métriques d'étapes (pour indicateurs visuels)
    current_step = Column(
        SAEnum(CashSessionStep, values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
        default=None,
        comment="Étape actuelle du workflow (entry/sale/exit)"
    )
    last_activity = Column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="Dernière activité utilisateur pour gestion du timeout"
    )
    step_start_time = Column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="Début de l'étape actuelle pour métriques de performance"
    )

    # Statistiques de vente (calculées)
    total_sales = Column(Float, nullable=True, default=0.0)
    total_items = Column(Integer, nullable=True, default=0)
    
    # Champs de fermeture avec contrôle des montants
    closing_amount = Column(Float, nullable=True, comment="Montant théorique calculé à la fermeture")
    actual_amount = Column(Float, nullable=True, comment="Montant physique compté à la fermeture")
    variance = Column(Float, nullable=True, comment="Écart entre théorique et physique")
    variance_comment = Column(String, nullable=True, comment="Commentaire sur l'écart")
    
    # Relations
    sales = relationship("Sale", back_populates="cash_session", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        op_id = kwargs.get("operator_id")
        if isinstance(op_id, str):
            try:
                kwargs["operator_id"] = uuid.UUID(op_id)
            except Exception:
                pass
        st_id = kwargs.get("site_id")
        if isinstance(st_id, str):
            try:
                kwargs["site_id"] = uuid.UUID(st_id)
            except Exception:
                pass
        rg_id = kwargs.get("register_id")
        if isinstance(rg_id, str):
            try:
                kwargs["register_id"] = uuid.UUID(rg_id)
            except Exception:
                pass
        _id = kwargs.get("id")
        if isinstance(_id, str):
            try:
                kwargs["id"] = uuid.UUID(_id)
            except Exception:
                pass
        # Normalize status
        s = kwargs.get("status")
        if isinstance(s, str):
            try:
                s_norm = s.strip().lower()
                if s_norm in ("open", "closed"):
                    kwargs["status"] = CashSessionStatus.OPEN if s_norm == "open" else CashSessionStatus.CLOSED
                else:
                    # Try by enum name
                    kwargs["status"] = CashSessionStatus[s]
            except Exception:
                pass

        # Normalize current_step
        cs = kwargs.get("current_step")
        if isinstance(cs, str):
            try:
                cs_norm = cs.strip().lower()
                if cs_norm in ("entry", "sale", "exit"):
                    step_map = {"entry": CashSessionStep.ENTRY, "sale": CashSessionStep.SALE, "exit": CashSessionStep.EXIT}
                    kwargs["current_step"] = step_map[cs_norm]
                else:
                    # Try by enum name
                    kwargs["current_step"] = CashSessionStep[cs.upper()]
            except Exception:
                pass
        super().__init__(**kwargs)

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
            # Métriques d'étapes
            "current_step": self.current_step.value if self.current_step else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "step_start_time": self.step_start_time.isoformat() if self.step_start_time else None,
            # Statistiques de vente
            "total_sales": self.total_sales,
            "total_items": self.total_items,
            "closing_amount": self.closing_amount,
            "actual_amount": self.actual_amount,
            "variance": self.variance,
            "variance_comment": self.variance_comment
        }

    def close_session(self):
        """Ferme la session de caisse."""
        self.status = CashSessionStatus.CLOSED
        self.closed_at = datetime.now(timezone.utc)

    def close_with_amounts(self, actual_amount: float, variance_comment: str = None):
        """Ferme la session avec contrôle des montants."""
        # Calculer le montant théorique (fond initial + ventes)
        self.closing_amount = self.initial_amount + (self.total_sales or 0)
        
        # Enregistrer le montant physique compté
        self.actual_amount = actual_amount
        
        # Calculer l'écart
        self.variance = actual_amount - self.closing_amount
        
        # Enregistrer le commentaire si fourni
        if variance_comment:
            self.variance_comment = variance_comment
        
        # Fermer la session
        self.close_session()

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

    def set_current_step(self, step: CashSessionStep):
        """Définit l'étape actuelle et met à jour les métriques."""
        self.current_step = step
        self.step_start_time = datetime.now(timezone.utc)
        self.last_activity = datetime.now(timezone.utc)

    def update_activity(self):
        """Met à jour le timestamp de dernière activité."""
        self.last_activity = datetime.now(timezone.utc)

    def get_step_metrics(self) -> dict:
        """Retourne les métriques de l'étape actuelle."""
        return {
            "current_step": self.current_step.value if self.current_step else None,
            "step_start_time": self.step_start_time.isoformat() if self.step_start_time else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "step_duration_seconds": (
                (datetime.now(timezone.utc) - self.step_start_time).total_seconds()
                if self.step_start_time else None
            )
        }

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
