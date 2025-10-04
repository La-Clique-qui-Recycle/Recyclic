from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from datetime import date, datetime
import csv
import io

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
    TicketSummaryResponse,
    TicketDetailResponse,
    TicketListResponse,
    LigneDepotReportResponse,
    LigneDepotListResponse,
)
from recyclic_api.models.category import Category
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
        category_id=UUID(payload.category_id),
        poids_kg=float(payload.poids_kg),
        destination=payload.destination,
        notes=payload.notes,
    )
    
    # Récupérer le nom de la catégorie
    category_label = "Catégorie inconnue"
    if ligne.category:
        category_label = ligne.category.name
    
    return {
        "id": str(ligne.id),
        "ticket_id": str(ligne.ticket_id),
        "category_id": str(ligne.category_id),
        "category_label": category_label,
        "poids_kg": ligne.poids_kg,
        "destination": ligne.destination,
        "notes": ligne.notes,
    }


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Récupérer les catégories disponibles."""
    categories = db.query(Category).filter(
        Category.is_active == True
    ).all()
    return [
        {
            "id": str(cat.id),
            "name": cat.name
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
        category_id=UUID(payload.category_id) if payload.category_id else None,
        poids_kg=float(payload.poids_kg) if payload.poids_kg is not None else None,
        destination=payload.destination,
        notes=payload.notes,
    )
    
    # Récupérer le nom de la catégorie
    category_label = "Catégorie inconnue"
    if ligne.category:
        category_label = ligne.category.name
    
    return {
        "id": str(ligne.id),
        "ticket_id": str(ligne.ticket_id),
        "category_id": str(ligne.category_id),
        "category_label": category_label,
        "poids_kg": ligne.poids_kg,
        "destination": ligne.destination,
        "notes": ligne.notes,
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


# Endpoints pour l'historique des tickets
@router.get("/tickets", response_model=TicketListResponse)
def get_tickets(
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(10, ge=1, le=100, description="Nombre d'éléments par page"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Récupérer la liste des tickets de réception avec pagination."""
    service = ReceptionService(db)
    tickets, total = service.get_tickets_list(page=page, per_page=per_page)
    
    # Calculer les totaux pour chaque ticket
    ticket_summaries = []
    for ticket in tickets:
        total_lignes, total_poids = service._calculate_ticket_totals(ticket)
        ticket_summaries.append(TicketSummaryResponse(
            id=str(ticket.id),
            poste_id=str(ticket.poste_id),
            benevole_username=ticket.benevole.username or "Utilisateur inconnu",
            created_at=ticket.created_at,
            closed_at=ticket.closed_at,
            status=ticket.status,
            total_lignes=total_lignes,
            total_poids=total_poids
        ))
    
    total_pages = (total + per_page - 1) // per_page
    
    return TicketListResponse(
        tickets=ticket_summaries,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket_detail(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Récupérer les détails complets d'un ticket de réception."""
    service = ReceptionService(db)
    ticket = service.get_ticket_detail(UUID(ticket_id))
    
    if not ticket:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
    
    # Construire la liste des lignes
    lignes = []
    for ligne in ticket.lignes:
        # Récupérer le nom de la catégorie
        category_label = "Catégorie inconnue"
        if ligne.category:
            category_label = ligne.category.name
        
        lignes.append(LigneResponse(
            id=str(ligne.id),
            ticket_id=str(ligne.ticket_id),
            category_id=str(ligne.category_id),
            category_label=category_label,
            poids_kg=ligne.poids_kg,
            destination=ligne.destination,
            notes=ligne.notes
        ))
    
    return TicketDetailResponse(
        id=str(ticket.id),
        poste_id=str(ticket.poste_id),
        benevole_username=ticket.benevole.username or "Utilisateur inconnu",
        created_at=ticket.created_at,
        closed_at=ticket.closed_at,
        status=ticket.status,
        lignes=lignes
    )


# Endpoints pour les rapports de réception
@router.get("/lignes", response_model=LigneDepotListResponse)
def get_lignes_depot(
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(50, ge=1, le=100, description="Nombre d'éléments par page"),
    start_date: Optional[date] = Query(None, description="Date de début (inclusive) au format YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="Date de fin (inclusive) au format YYYY-MM-DD"),
    category_id: Optional[str] = Query(None, description="ID de la catégorie à filtrer"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Récupérer la liste des lignes de dépôt avec filtres et pagination pour les rapports."""
    service = ReceptionService(db)
    
    # Convertir category_id en UUID si fourni
    category_uuid = None
    if category_id:
        try:
            category_uuid = UUID(category_id)
        except ValueError:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format d'ID de catégorie invalide")
    
    lignes, total = service.get_lignes_depot_filtered(
        start_date=start_date,
        end_date=end_date,
        category_id=category_uuid,
        page=page,
        per_page=per_page
    )
    
    # Construire la liste des réponses
    ligne_responses = []
    for ligne in lignes:
        ligne_responses.append(LigneDepotReportResponse(
            id=str(ligne.id),
            ticket_id=str(ligne.ticket_id),
            poste_id=str(ligne.ticket.poste_id),
            benevole_username=ligne.ticket.benevole.username or "Utilisateur inconnu",
            category_label=ligne.category.name if ligne.category else "Catégorie inconnue",
            poids_kg=ligne.poids_kg,
            destination=ligne.destination,
            notes=ligne.notes,
            created_at=ligne.ticket.created_at
        ))
    
    total_pages = (total + per_page - 1) // per_page
    
    return LigneDepotListResponse(
        lignes=ligne_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/lignes/export-csv")
def export_lignes_depot_csv(
    start_date: Optional[date] = Query(None, description="Date de début (inclusive) au format YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="Date de fin (inclusive) au format YYYY-MM-DD"),
    category_id: Optional[str] = Query(None, description="ID de la catégorie à filtrer"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
):
    """Exporter les lignes de dépôt au format CSV."""
    service = ReceptionService(db)
    
    # Convertir category_id en UUID si fourni
    category_uuid = None
    if category_id:
        try:
            category_uuid = UUID(category_id)
        except ValueError:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format d'ID de catégorie invalide")
    
    lignes = service.get_lignes_depot_for_export(
        start_date=start_date,
        end_date=end_date,
        category_id=category_uuid
    )
    
    # Créer le contenu CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # En-têtes
    writer.writerow([
        "ID Ligne",
        "ID Ticket", 
        "ID Poste",
        "Bénévole",
        "Catégorie",
        "Poids (kg)",
        "Destination",
        "Notes",
        "Date de création"
    ])
    
    # Données
    for ligne in lignes:
        writer.writerow([
            str(ligne.id),
            str(ligne.ticket_id),
            str(ligne.ticket.poste_id),
            ligne.ticket.benevole.username or "Utilisateur inconnu",
            ligne.category.name if ligne.category else "Catégorie inconnue",
            str(ligne.poids_kg),
            ligne.destination.value if ligne.destination else "",
            ligne.notes or "",
            ligne.ticket.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    # Préparer la réponse
    csv_content = output.getvalue()
    output.close()
    
    # Générer le nom de fichier
    # Format de timestamp lisible et triable: YYYYMMDD_HHMM (UTC)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M")
    filename_parts = ["rapport_reception", timestamp]
    if start_date:
        filename_parts.append(f"depuis_{start_date}")
    if end_date:
        filename_parts.append(f"jusqu_{end_date}")
    if category_id:
        # tenter de récupérer le nom pour un nom plus parlant
        try:
            from recyclic_api.models.category import Category as _Category
            cat = db.query(_Category).get(category_uuid)
            if cat and getattr(cat, "name", None):
                safe_name = cat.name.lower().replace(" ", "-")
                filename_parts.append(f"categorie_{safe_name}")
            else:
                filename_parts.append(f"categorie_{category_id}")
        except Exception:
            filename_parts.append(f"categorie_{category_id}")
    filename = "_".join(filename_parts) + ".csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

