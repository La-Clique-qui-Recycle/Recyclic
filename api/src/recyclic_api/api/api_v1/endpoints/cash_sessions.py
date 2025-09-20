from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_role, require_role_strict
from recyclic_api.core.audit import (
    log_cash_session_opening,
    log_cash_session_closing,
    log_cash_sale,
    log_cash_session_access
)
from recyclic_api.models.user import User, UserRole
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.schemas.cash_session import (
    CashSessionCreate,
    CashSessionUpdate,
    CashSessionClose,
    CashSessionResponse,
    CashSessionListResponse,
    CashSessionFilters,
    CashSessionStats
)
from recyclic_api.services.cash_session_service import CashSessionService

router = APIRouter()


@router.post(
    "/", 
    response_model=CashSessionResponse,
    status_code=201,
    summary="Créer une session de caisse",
    description="""
    Crée une nouvelle session de caisse pour un opérateur.
    
    **Permissions requises :** CASHIER, ADMIN, ou SUPER_ADMIN
    
    **Règles métier :**
    - Un opérateur ne peut avoir qu'une seule session ouverte à la fois
    - Le montant initial doit être positif et inférieur à 10 000€
    - La session est automatiquement marquée comme "ouverte"
    
    **Audit :** Toutes les opérations sont tracées dans les logs d'audit
    """,
    responses={
        201: {
            "description": "Session créée avec succès",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "operator_id": "550e8400-e29b-41d4-a716-446655440001",
                        "initial_amount": 50.0,
                        "current_amount": 50.0,
                        "status": "open",
                        "opened_at": "2025-01-27T10:30:00Z",
                        "closed_at": None,
                        "total_sales": 0.0,
                        "total_items": 0
                    }
                }
            }
        },
        400: {
            "description": "Erreur de validation ou session déjà ouverte",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Une session de caisse est déjà ouverte pour cet opérateur"
                    }
                }
            }
        },
        403: {
            "description": "Accès non autorisé",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Accès non autorisé"
                    }
                }
            }
        }
    },
    tags=["Sessions de Caisse"]
)
async def create_cash_session(
    session_data: CashSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashSessionService(db)
    
    try:
        # Vérifier qu'il n'y a pas déjà une session ouverte pour cet opérateur
        existing_session = service.get_open_session_by_operator(session_data.operator_id)
        if existing_session:
            log_cash_session_opening(
                operator_id=current_user.id,
                operator_username=current_user.username or "Unknown",
                session_id="",
                initial_amount=session_data.initial_amount,
                success=False,
                error_message="Session already open for operator"
            )
            raise HTTPException(
                status_code=400,
                detail="Une session de caisse est déjà ouverte pour cet opérateur"
            )
        
        # Créer la nouvelle session
        cash_session = service.create_session(
            operator_id=session_data.operator_id,
            site_id=session_data.site_id,
            initial_amount=session_data.initial_amount
        )
        
        # Log de l'ouverture de session
        log_cash_session_opening(
            operator_id=current_user.id,
            operator_username=current_user.username or "Unknown",
            session_id=str(cash_session.id),
            initial_amount=session_data.initial_amount,
            success=True
        )
        
        return CashSessionResponse.model_validate(cash_session)
        
    except Exception as e:
        log_cash_session_opening(
            operator_id=current_user.id,
            operator_username=current_user.username or "Unknown",
            session_id="",
            initial_amount=session_data.initial_amount,
            success=False,
            error_message=str(e)
        )
        raise


@router.get(
    "/", 
    response_model=CashSessionListResponse,
    summary="Lister les sessions de caisse",
    description="""
    Récupère la liste des sessions de caisse avec filtres optionnels.
    
    **Permissions requises :** CASHIER, ADMIN ou SUPER_ADMIN
    
    **Filtres disponibles :**
    - `status` : Filtrer par statut (open/closed)
    - `operator_id` : Filtrer par opérateur
    - `date_from` : Date de début (ISO 8601)
    - `date_to` : Date de fin (ISO 8601)
    - `skip` : Nombre d'éléments à ignorer (pagination)
    - `limit` : Nombre maximum d'éléments (1-100)
    
    **Pagination :** Les résultats sont paginés pour optimiser les performances
    """,
    responses={
        200: {
            "description": "Liste des sessions récupérée avec succès",
            "content": {
                "application/json": {
                    "example": {
                        "data": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "operator_id": "550e8400-e29b-41d4-a716-446655440001",
                                "initial_amount": 50.0,
                                "current_amount": 100.0,
                                "status": "open",
                                "opened_at": "2025-01-27T10:30:00Z",
                                "closed_at": None,
                                "total_sales": 50.0,
                                "total_items": 5
                            }
                        ],
                        "total": 1,
                        "skip": 0,
                        "limit": 20
                    }
                }
            }
        },
        403: {
            "description": "Accès non autorisé",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Accès non autorisé"
                    }
                }
            }
        }
    },
    tags=["Sessions de Caisse"]
)
async def get_cash_sessions(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre maximum d'éléments à retourner"),
    status: Optional[CashSessionStatus] = Query(None, description="Filtrer par statut"),
    operator_id: Optional[str] = Query(None, description="Filtrer par ID d'opérateur"),
    date_from: Optional[datetime] = Query(None, description="Date de début (ISO 8601)"),
    date_to: Optional[datetime] = Query(None, description="Date de fin (ISO 8601)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashSessionService(db)
    
    filters = CashSessionFilters(
        skip=skip,
        limit=limit,
        status=status,
        operator_id=operator_id,
        date_from=date_from,
        date_to=date_to
    )
    
    sessions, total = service.get_sessions_with_filters(filters)
    
    return CashSessionListResponse(
        data=[CashSessionResponse.model_validate(session) for session in sessions],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/current", response_model=Optional[CashSessionResponse])
async def get_current_cash_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """
    Récupère la session de caisse actuellement ouverte pour l'utilisateur connecté.
    """
    service = CashSessionService(db)
    
    session = service.get_open_session_by_operator(str(current_user.id))
    
    if not session:
        return None
    
    return CashSessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=CashSessionResponse)
async def get_cash_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """
    Récupère une session de caisse par son ID.
    """
    service = CashSessionService(db)
    
    session = service.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session de caisse non trouvée")
    
    # Vérifier que l'utilisateur peut accéder à cette session
    if (current_user.role == UserRole.CASHIER and 
        str(session.operator_id) != str(current_user.id)):
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
    
    return CashSessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=CashSessionResponse)
async def update_cash_session(
    session_id: str,
    session_update: CashSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """
    Met à jour une session de caisse.
    """
    service = CashSessionService(db)
    
    session = service.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session de caisse non trouvée")
    
    # Vérifier que l'utilisateur peut modifier cette session
    if (current_user.role == UserRole.CASHIER and 
        str(session.operator_id) != str(current_user.id)):
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
    
    # Mettre à jour la session
    updated_session = service.update_session(session_id, session_update)
    
    return CashSessionResponse.model_validate(updated_session)


@router.post(
    "/{session_id}/close", 
    response_model=CashSessionResponse,
    summary="Fermer une session de caisse",
    description="""
    Ferme une session de caisse ouverte.
    
    **Permissions requises :** CASHIER, ADMIN, ou SUPER_ADMIN
    
    **Règles métier :**
    - Seul l'opérateur de la session peut la fermer (sauf ADMIN/SUPER_ADMIN)
    - Une session fermée ne peut plus être modifiée
    - La date de fermeture est automatiquement enregistrée
    - Les statistiques finales sont calculées et sauvegardées
    
    **Audit :** La fermeture est tracée avec les statistiques finales
    """,
    responses={
        200: {
            "description": "Session fermée avec succès",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "operator_id": "550e8400-e29b-41d4-a716-446655440001",
                        "initial_amount": 50.0,
                        "current_amount": 100.0,
                        "status": "closed",
                        "opened_at": "2025-01-27T10:30:00Z",
                        "closed_at": "2025-01-27T18:30:00Z",
                        "total_sales": 50.0,
                        "total_items": 5
                    }
                }
            }
        },
        400: {
            "description": "Session déjà fermée",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "La session est déjà fermée"
                    }
                }
            }
        },
        403: {
            "description": "Accès non autorisé à cette session",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Accès non autorisé à cette session"
                    }
                }
            }
        },
        404: {
            "description": "Session non trouvée",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Session de caisse non trouvée"
                    }
                }
            }
        }
    },
    tags=["Sessions de Caisse"]
)
async def close_cash_session(
    session_id: str,
    close_data: CashSessionClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashSessionService(db)
    
    try:
        session = service.get_session_by_id(session_id)
        if not session:
            log_cash_session_closing(
                operator_id=current_user.id,
                operator_username=current_user.username or "Unknown",
                session_id=session_id,
                final_amount=0,
                total_sales=0,
                total_items=0,
                success=False,
                error_message="Session not found"
            )
            raise HTTPException(status_code=404, detail="Session de caisse non trouvée")
        
        # Vérifier que l'utilisateur peut fermer cette session
        if (current_user.role == UserRole.CASHIER and 
            str(session.operator_id) != str(current_user.id)):
            log_cash_session_closing(
                operator_id=current_user.id,
                operator_username=current_user.username or "Unknown",
                session_id=session_id,
                final_amount=session.current_amount,
                total_sales=session.total_sales or 0,
                total_items=session.total_items or 0,
                success=False,
                error_message="Unauthorized access"
            )
            raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
        
        if session.status == CashSessionStatus.CLOSED:
            log_cash_session_closing(
                operator_id=current_user.id,
                operator_username=current_user.username or "Unknown",
                session_id=session_id,
                final_amount=session.current_amount,
                total_sales=session.total_sales or 0,
                total_items=session.total_items or 0,
                success=False,
                error_message="Session already closed"
            )
            raise HTTPException(status_code=400, detail="La session est déjà fermée")
        
        # Valider que le commentaire est fourni si il y a un écart
        theoretical_amount = session.initial_amount + (session.total_sales or 0)
        variance = close_data.actual_amount - theoretical_amount
        
        if abs(variance) > 0.01 and not close_data.variance_comment:  # Tolérance de 1 centime
            log_cash_session_closing(
                operator_id=current_user.id,
                operator_username=current_user.username or "Unknown",
                session_id=session_id,
                final_amount=close_data.actual_amount,
                total_sales=session.total_sales or 0,
                total_items=session.total_items or 0,
                success=False,
                error_message="Commentaire obligatoire pour les écarts"
            )
            raise HTTPException(
                status_code=400, 
                detail="Un commentaire est obligatoire en cas d'écart entre le montant théorique et le montant physique"
            )
        
        # Fermer la session avec contrôle des montants
        closed_session = service.close_session_with_amounts(
            session_id, 
            close_data.actual_amount, 
            close_data.variance_comment
        )
        
        # Log de la fermeture de session
        log_cash_session_closing(
            operator_id=current_user.id,
            operator_username=current_user.username or "Unknown",
            session_id=session_id,
            final_amount=closed_session.current_amount,
            total_sales=closed_session.total_sales or 0,
            total_items=closed_session.total_items or 0,
            success=True
        )
        
        return CashSessionResponse.model_validate(closed_session)
        
    except HTTPException:
        raise
    except Exception as e:
        log_cash_session_closing(
            operator_id=current_user.id,
            operator_username=current_user.username or "Unknown",
            session_id=session_id,
            final_amount=0,
            total_sales=0,
            total_items=0,
            success=False,
            error_message=str(e)
        )
        raise


@router.get("/stats/summary", response_model=CashSessionStats)
async def get_cash_session_stats(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """
    Récupère les statistiques des sessions de caisse.
    
    Seuls les administrateurs peuvent voir les statistiques.
    """
    service = CashSessionService(db)
    
    stats = service.get_session_stats(date_from, date_to)
    
    return CashSessionStats(**stats)
