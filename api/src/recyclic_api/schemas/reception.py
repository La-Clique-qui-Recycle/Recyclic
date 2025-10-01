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
    dom_category_id: str = Field(..., description="Identifiant de la catégorie domaine")
    poids_kg: condecimal(gt=0, max_digits=8, decimal_places=3) = Field(
        ..., description="Poids en kilogrammes (> 0)"
    )
    destination: Destination = Field(..., description="Destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")


class UpdateLigneRequest(BaseModel):
    """Corps de requête pour modifier une ligne de dépôt."""

    dom_category_id: Optional[str] = Field(None, description="Nouvelle catégorie domaine")
    poids_kg: Optional[condecimal(gt=0, max_digits=8, decimal_places=3)] = Field(
        None, description="Nouveau poids en kilogrammes (> 0)"
    )
    destination: Optional[Destination] = Field(None, description="Nouvelle destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")


class LigneResponse(BaseModel):
    """Représentation d'une ligne de dépôt."""

    id: str = Field(..., description="Identifiant de la ligne")
    ticket_id: str = Field(..., description="Identifiant du ticket")
    dom_category_id: str = Field(..., description="Identifiant de la catégorie domaine")
    poids_kg: Decimal = Field(..., description="Poids en kilogrammes")
    destination: Destination = Field(..., description="Destination de l'objet")
    notes: Optional[str] = Field(None, description="Notes libres")
    created_at: Optional[datetime] = Field(None, description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")

