from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from recyclic_api.models import (
    PosteReception,
    PosteReceptionStatus,
    TicketDepot,
    TicketDepotStatus,
)
from recyclic_api.repositories.reception import (
    PosteReceptionRepository,
    TicketDepotRepository,
    UserRepository,
)


class ReceptionService:
    """Service métier pour la gestion des postes de réception et des tickets."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.poste_repo = PosteReceptionRepository(db)
        self.ticket_repo = TicketDepotRepository(db)
        self.user_repo = UserRepository(db)

    # Postes
    def open_poste(self, opened_by_user_id: UUID) -> PosteReception:
        poste = PosteReception(opened_by_user_id=opened_by_user_id, status=PosteReceptionStatus.OPENED.value)
        self.db.add(poste)
        self.db.commit()
        self.db.refresh(poste)
        return poste

    def close_poste(self, poste_id: UUID) -> PosteReception:
        poste: Optional[PosteReception] = self.poste_repo.get(poste_id)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")

        # Contrainte métier: pas de tickets ouverts
        open_tickets = self.poste_repo.count_open_tickets(poste.id)
        if open_tickets > 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Des tickets ouverts empêchent la fermeture du poste")

        poste.status = PosteReceptionStatus.CLOSED.value
        from sqlalchemy.sql import func

        poste.closed_at = func.now()
        return self.poste_repo.update(poste)

    # Tickets
    def create_ticket(self, poste_id: UUID, benevole_user_id: UUID) -> TicketDepot:
        # Vérifier que le poste existe et est ouvert
        poste: Optional[PosteReception] = self.poste_repo.get(poste_id)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")
        if poste.status != PosteReceptionStatus.OPENED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Poste fermé")

        # Vérifier l'utilisateur
        if not self.user_repo.get(benevole_user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

        ticket = TicketDepot(
            poste_id=poste.id,
            benevole_user_id=benevole_user_id,
            status=TicketDepotStatus.OPENED.value,
        )
        return self.ticket_repo.add(ticket)

    def close_ticket(self, ticket_id: UUID) -> TicketDepot:
        ticket: Optional[TicketDepot] = self.ticket_repo.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
        if ticket.status == TicketDepotStatus.CLOSED.value:
            return ticket

        from sqlalchemy.sql import func

        ticket.status = TicketDepotStatus.CLOSED.value
        ticket.closed_at = func.now()
        return self.ticket_repo.update(ticket)


