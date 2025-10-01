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
    CreateLigneRequest,
    UpdateLigneRequest,
    LigneResponse,
)
from recyclic_api.models.dom_category import DomCategory
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



# Lignes de dépôt
@router.post("/lignes", response_model=LigneResponse)
def add_ligne(
    payload: CreateLigneRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    ligne = service.create_ligne(
        ticket_id=UUID(payload.ticket_id),
        dom_category_id=UUID(payload.dom_category_id),
        poids_kg=float(payload.poids_kg),
        destination=payload.destination,
        notes=payload.notes,
    )
    return {
        "id": str(ligne.id),
        "ticket_id": str(ligne.ticket_id),
        "dom_category_id": str(ligne.dom_category_id),
        "poids_kg": ligne.poids_kg,
        "destination": ligne.destination,
        "notes": ligne.notes,
        "created_at": ligne.created_at.isoformat() if ligne.created_at else None,
        "updated_at": ligne.updated_at.isoformat() if ligne.updated_at else None,
    }


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Récupérer les catégories L1 disponibles."""
    categories = db.query(DomCategory).filter(
        DomCategory.level == 1,
        DomCategory.active == True
    ).all()
    return [
        {
            "id": str(cat.id),
            "label": cat.label,
            "slug": cat.slug
        }
        for cat in categories
    ]


@router.put("/lignes/{ligne_id}", response_model=LigneResponse)
def update_ligne(
    ligne_id: str,
    payload: UpdateLigneRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    ligne = service.update_ligne(
        ligne_id=UUID(ligne_id),
        dom_category_id=UUID(payload.dom_category_id) if payload.dom_category_id else None,
        poids_kg=float(payload.poids_kg) if payload.poids_kg is not None else None,
        destination=payload.destination,
        notes=payload.notes,
    )
    return {
        "id": str(ligne.id),
        "ticket_id": str(ligne.ticket_id),
        "dom_category_id": str(ligne.dom_category_id),
        "poids_kg": ligne.poids_kg,
        "destination": ligne.destination,
        "notes": ligne.notes,
        "created_at": ligne.created_at.isoformat() if ligne.created_at else None,
        "updated_at": ligne.updated_at.isoformat() if ligne.updated_at else None,
    }


@router.delete("/lignes/{ligne_id}")
def delete_ligne(
    ligne_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    service = ReceptionService(db)
    service.delete_ligne(ligne_id=UUID(ligne_id))
    return {"status": "deleted"}

