from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_role_strict
from recyclic_api.models.user import UserRole
from recyclic_api.schemas.reception import (
    OpenPosteResponse,
    CreateTicketRequest,
    CreateTicketResponse,
    CloseResponse,
)
from recyclic_api.services.reception_service import ReceptionService


router = APIRouter()


@router.post("/postes/open", response_model=OpenPosteResponse)
def open_poste(
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    poste = service.open_poste(opened_by_user_id=current_user.id)
    return {"id": str(poste.id), "status": poste.status}


@router.post("/postes/{poste_id}/close", response_model=CloseResponse)
def close_poste(
    poste_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    poste = service.close_poste(poste_id=UUID(poste_id))
    return {"status": poste.status}


@router.post("/tickets", response_model=CreateTicketResponse)
def create_ticket(
    payload: CreateTicketRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    ticket = service.create_ticket(poste_id=UUID(payload.poste_id), benevole_user_id=current_user.id)
    return {"id": str(ticket.id)}


@router.post("/tickets/{ticket_id}/close", response_model=CloseResponse)
def close_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    ticket = service.close_ticket(ticket_id=UUID(ticket_id))
    return {"status": ticket.status}


