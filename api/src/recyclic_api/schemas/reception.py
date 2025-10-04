from __future__ import annotations

from pydantic import BaseModel, Field, condecimal
from typing import Optional
from decimal import Decimal
from datetime import datetime

from recyclic_api.models.ligne_depot import Destination


class OpenPosteResponse(BaseModel):
    """Réponse lors de l'ouverture d'un poste de réception."""

    id: str = Field(..., description="Identifiant du poste de réception")
    status: str = Field(..., description="Statut du poste (opened|closed)")


class CreateTicketRequest(BaseModel):
    """Corps de requête pour créer un ticket de dépôt."""

    poste_id: str = Field(..., description="Identifiant du poste de réception")


class CreateTicketResponse(BaseModel):
    """Réponse lors de la création d'un ticket de dépôt."""

    id: str = Field(..., description="Identifiant du ticket de dépôt")


class CloseResponse(BaseModel):
    """Réponse standard pour une opération de clôture."""

    status: str = Field(..., description="Statut mis à jour (closed)")



# Lignes de dépôt


class CreateLigneRequest(BaseModel):
    """Corps de requête pour créer une ligne de dépôt."""

    ticket_id: str = Field(..., description="Identifiant du ticket de dépôt")
    category_id: str = Field(..., description="Identifiant de la catégorie")
    poids_kg: condecimal(gt=0, max_digits=8, decimal_places=3) = Field(
        ..., description="Poids en kilogrammes (> 0)"
    )
    destination: Destination = Field(..., description="Destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")


class UpdateLigneRequest(BaseModel):
    """Corps de requête pour modifier une ligne de dépôt."""

    category_id: Optional[str] = Field(None, description="Nouvelle catégorie")
    poids_kg: Optional[condecimal(gt=0, max_digits=8, decimal_places=3)] = Field(
        None, description="Nouveau poids en kilogrammes (> 0)"
    )
    destination: Optional[Destination] = Field(None, description="Nouvelle destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")


class LigneResponse(BaseModel):
    """Représentation d'une ligne de dépôt."""

    id: str = Field(..., description="Identifiant de la ligne")
    ticket_id: str = Field(..., description="Identifiant du ticket")
    category_id: str = Field(..., description="Identifiant de la catégorie")
    category_label: str = Field(..., description="Nom de la catégorie")
    poids_kg: Decimal = Field(..., description="Poids en kilogrammes")
    destination: Destination = Field(..., description="Destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")


# Schémas pour l'historique des tickets
class TicketSummaryResponse(BaseModel):
    """Résumé d'un ticket pour la liste des tickets récents."""

    id: str = Field(..., description="Identifiant du ticket")
    poste_id: str = Field(..., description="Identifiant du poste de réception")
    benevole_username: str = Field(..., description="Nom d'utilisateur du bénévole")
    created_at: datetime = Field(..., description="Date de création")
    closed_at: Optional[datetime] = Field(None, description="Date de clôture")
    status: str = Field(..., description="Statut du ticket (opened|closed)")
    total_lignes: int = Field(..., description="Nombre total de lignes")
    total_poids: Decimal = Field(..., description="Poids total en kilogrammes")


class TicketDetailResponse(BaseModel):
    """Détails complets d'un ticket de dépôt."""

    id: str = Field(..., description="Identifiant du ticket")
    poste_id: str = Field(..., description="Identifiant du poste de réception")
    benevole_username: str = Field(..., description="Nom d'utilisateur du bénévole")
    created_at: datetime = Field(..., description="Date de création")
    closed_at: Optional[datetime] = Field(None, description="Date de clôture")
    status: str = Field(..., description="Statut du ticket (opened|closed)")
    lignes: list[LigneResponse] = Field(..., description="Liste des lignes de dépôt")


class TicketListResponse(BaseModel):
    """Réponse pour la liste des tickets avec pagination."""

    tickets: list[TicketSummaryResponse] = Field(..., description="Liste des tickets")
    total: int = Field(..., description="Nombre total de tickets")
    page: int = Field(..., description="Page actuelle")
    per_page: int = Field(..., description="Nombre d'éléments par page")
    total_pages: int = Field(..., description="Nombre total de pages")


# Schémas pour les rapports de réception
class LigneDepotReportResponse(BaseModel):
    """Réponse pour une ligne de dépôt dans les rapports."""

    id: str = Field(..., description="Identifiant de la ligne")
    ticket_id: str = Field(..., description="Identifiant du ticket")
    poste_id: str = Field(..., description="Identifiant du poste de réception")
    benevole_username: str = Field(..., description="Nom d'utilisateur du bénévole")
    category_label: str = Field(..., description="Nom de la catégorie")
    poids_kg: Decimal = Field(..., description="Poids en kilogrammes")
    destination: Destination = Field(..., description="Destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")
    created_at: datetime = Field(..., description="Date de création du ticket")


class LigneDepotListResponse(BaseModel):
    """Réponse pour la liste des lignes de dépôt avec pagination."""

    lignes: list[LigneDepotReportResponse] = Field(..., description="Liste des lignes de dépôt")
    total: int = Field(..., description="Nombre total de lignes")
    page: int = Field(..., description="Page actuelle")
    per_page: int = Field(..., description="Nombre d'éléments par page")
    total_pages: int = Field(..., description="Nombre total de pages")