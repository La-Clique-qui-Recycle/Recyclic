from __future__ import annotations

from pydantic import BaseModel, Field


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


