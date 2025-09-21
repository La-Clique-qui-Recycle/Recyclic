from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CashSessionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"


class CashSessionBase(BaseModel):
    """Schéma de base pour les sessions de caisse."""
    model_config = ConfigDict(from_attributes=True)
    
    operator_id: str = Field(..., description="ID de l'opérateur (caissier)")
    site_id: str = Field(..., description="ID du site")
    initial_amount: float = Field(..., ge=0, description="Montant initial du fond de caisse")
    
    @field_validator('initial_amount')
    @classmethod
    def validate_initial_amount(cls, v):
        if v < 0:
            raise ValueError('Le montant initial ne peut pas être négatif')
        if v > 10000:
            raise ValueError('Le montant initial ne peut pas dépasser 10 000€')
        return v
    
    @field_validator('operator_id', 'site_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convertit les UUIDs en strings pour la sérialisation"""
        if hasattr(v, '__str__'):
            return str(v)
        return v


class CashSessionCreate(CashSessionBase):
    """Schéma pour la création d'une session de caisse."""
    pass


class CashSessionUpdate(BaseModel):
    """Schéma pour la mise à jour d'une session de caisse."""
    status: Optional[CashSessionStatus] = Field(None, description="Nouveau statut de la session")
    current_amount: Optional[float] = Field(None, ge=0, description="Montant actuel en caisse")
    total_sales: Optional[float] = Field(None, ge=0, description="Total des ventes")
    total_items: Optional[int] = Field(None, ge=0, description="Nombre total d'articles vendus")


class CashSessionClose(BaseModel):
    """Schéma pour la fermeture d'une session de caisse avec contrôle des montants."""
    actual_amount: float = Field(..., ge=0, description="Montant physique compté en caisse")
    variance_comment: Optional[str] = Field(None, description="Commentaire obligatoire en cas d'écart")
    
    @field_validator('actual_amount')
    @classmethod
    def validate_actual_amount(cls, v):
        if v < 0:
            raise ValueError('Le montant physique ne peut pas être négatif')
        return v


class CashSessionResponse(CashSessionBase):
    """Schéma de réponse pour une session de caisse."""
    id: str = Field(..., description="ID unique de la session")
    current_amount: float = Field(..., description="Montant actuel en caisse")
    status: CashSessionStatus = Field(..., description="Statut de la session")
    opened_at: datetime = Field(..., description="Date et heure d'ouverture")
    closed_at: Optional[datetime] = Field(None, description="Date et heure de fermeture")
    total_sales: Optional[float] = Field(None, description="Total des ventes")
    total_items: Optional[int] = Field(None, description="Nombre total d'articles vendus")
    closing_amount: Optional[float] = Field(None, description="Montant théorique calculé à la fermeture")
    actual_amount: Optional[float] = Field(None, description="Montant physique compté à la fermeture")
    variance: Optional[float] = Field(None, description="Écart entre théorique et physique")
    variance_comment: Optional[str] = Field(None, description="Commentaire sur l'écart")
    
    report_download_url: Optional[str] = Field(None, description="URL de telechargement du rapport genere")
    report_email_sent: Optional[bool] = Field(None, description="Indique si l'envoi du rapport par email a reussi")

    @field_validator('id', mode='before')
    @classmethod
    def convert_id_uuid_to_str(cls, v):
        """Convertit l'ID UUID en string pour la sérialisation"""
        if hasattr(v, '__str__'):
            return str(v)
        return v


class CashSessionSummary(BaseModel):
    """Schéma pour le résumé d'une session de caisse."""
    session_id: str = Field(..., description="ID de la session")
    site_id: str = Field(..., description="ID du site")
    operator: str = Field(..., description="Nom de l'opérateur")
    opened_at: datetime = Field(..., description="Date d'ouverture")
    closed_at: Optional[datetime] = Field(None, description="Date de fermeture")
    initial_amount: float = Field(..., description="Montant initial")
    current_amount: float = Field(..., description="Montant actuel")
    total_sales: float = Field(..., description="Total des ventes")
    total_items: int = Field(..., description="Nombre d'articles vendus")
    status: CashSessionStatus = Field(..., description="Statut de la session")


class CashSessionListResponse(BaseModel):
    """Schéma de réponse pour la liste des sessions de caisse."""
    data: List[CashSessionResponse] = Field(..., description="Liste des sessions")
    total: int = Field(..., description="Nombre total de sessions")
    skip: int = Field(..., description="Nombre de sessions ignorées")
    limit: int = Field(..., description="Limite de sessions par page")


class CashSessionFilters(BaseModel):
    """Schéma pour les filtres de recherche des sessions."""
    skip: int = Field(0, ge=0, description="Nombre de sessions à ignorer")
    limit: int = Field(20, ge=1, le=100, description="Nombre maximum de sessions à retourner")
    status: Optional[CashSessionStatus] = Field(None, description="Filtrer par statut")
    operator_id: Optional[str] = Field(None, description="Filtrer par opérateur")
    site_id: Optional[str] = Field(None, description="Filtrer par site")
    date_from: Optional[datetime] = Field(None, description="Date de début")
    date_to: Optional[datetime] = Field(None, description="Date de fin")


class CashSessionStats(BaseModel):
    """Schéma pour les statistiques des sessions de caisse."""
    total_sessions: int = Field(..., description="Nombre total de sessions")
    open_sessions: int = Field(..., description="Nombre de sessions ouvertes")
    closed_sessions: int = Field(..., description="Nombre de sessions fermées")
    total_sales: float = Field(..., description="Total des ventes")
    total_items: int = Field(..., description="Total des articles vendus")
    average_session_duration: Optional[float] = Field(None, description="Durée moyenne des sessions en heures")
