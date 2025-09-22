from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_admin_role, require_admin_role_strict
from recyclic_api.core.audit import log_role_change, log_admin_access
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.services.telegram_service import telegram_service
from recyclic_api.schemas.admin import (
    AdminUserList, 
    AdminUser, 
    UserRoleUpdate, 
    AdminResponse,
    AdminErrorResponse,
    PaginationInfo,
    PendingUserResponse,
    UserApprovalRequest,
    UserRejectionRequest,
    UserStatusUpdate,
    UserProfileUpdate,
    UserHistoryResponse
)
from recyclic_api.services.user_history_service import UserHistoryService

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)

# Configuration du rate limiting
limiter = Limiter(key_func=get_remote_address)

# La fonction require_admin_role est maintenant importée depuis core.auth

@router.get(
    "/users",
    response_model=List[AdminUser],
    summary="Liste des utilisateurs (Admin)",
    description="Récupère la liste des utilisateurs avec filtres optionnels"
)
@limiter.limit("30/minute")
def get_users(
    request: Request,
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    role: Optional[UserRole] = Query(None, description="Filtrer par rôle"),
    user_status: Optional[UserStatus] = Query(None, description="Filtrer par statut"),
    current_user: User = Depends(require_admin_role_strict()),
    db: Session = Depends(get_db)
):
    """Récupère la liste des utilisateurs avec filtres"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users",
            success=True
        )
        
        query = db.query(User)
        
        # Application des filtres
        if role:
            query = query.filter(User.role == role)
        if user_status:
            query = query.filter(User.status == user_status)
        
        users = query.offset(skip).limit(limit).all()
        
        # Conversion en AdminUser
        admin_users = []
        for user in users:
            full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
            admin_user = AdminUser(
                id=str(user.id),
                telegram_id=user.telegram_id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                full_name=full_name,
                email=None,
                role=user.role,
                status=user.status,
                is_active=user.is_active,
                site_id=str(user.site_id) if user.site_id else None,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            admin_users.append(admin_user)
        
        return admin_users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des utilisateurs: {str(e)}"
        )

@router.put(
    "/users/{user_id}/role",
    response_model=AdminResponse,
    summary="Modifier le rôle d'un utilisateur (Admin)",
    description="Met à jour le rôle d'un utilisateur spécifique"
)
def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_admin_role_strict()),
    db: Session = Depends(get_db)
):
    """Met à jour le rôle d'un utilisateur"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}/role",
            success=True
        )
        
        # Recherche de l'utilisateur - conversion UUID
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            # user_id n'est pas un UUID valide
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        if not user:
            # Log de l'échec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}/role",
                success=False,
                error_message="Utilisateur non trouvé"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Vérifier que l'admin ne se dégrade pas lui-même
        if str(user.id) == str(current_user.id):
            # Empêcher la rétrogradation (admin -> role inférieur)
            admin_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN]
            if (current_user.role in admin_roles and
                role_update.role not in admin_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Un administrateur ne peut pas se dégrader lui-même"
                )

        # Mise à jour du rôle
        old_role = user.role
        user.role = role_update.role
        db.commit()
        db.refresh(user)
        
        # Log de la modification de rôle
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role=old_role.value,
            new_role=user.role.value,
            success=True
        )
        
        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        
        return AdminResponse(
            data={
                "user_id": str(user.id), 
                "role": user.role.value,
                "previous_role": old_role.value
            },
            message=f"Rôle de l'utilisateur {full_name or user.username} mis à jour de {old_role.value} vers {user.role.value}",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du rôle: {str(e)}"
        )

@router.get(
    "/users/pending",
    response_model=List[PendingUserResponse],
    summary="Liste des utilisateurs en attente (Admin)",
    description="Récupère la liste des utilisateurs avec le statut 'pending'"
)
def get_pending_users(
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Récupère la liste des utilisateurs en attente d'approbation"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/pending",
            success=True
        )
        
        # Récupérer les utilisateurs en attente
        pending_users = db.query(User).filter(User.status == UserStatus.PENDING).all()
        
        # Conversion en PendingUserResponse
        pending_responses = []
        for user in pending_users:
            full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
            pending_response = PendingUserResponse(
                id=str(user.id),
                telegram_id=int(user.telegram_id),
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                full_name=full_name,
                role=user.role,
                status=user.status,
                created_at=user.created_at
            )
            pending_responses.append(pending_response)
        
        return pending_responses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des utilisateurs en attente: {str(e)}"
        )

@router.post(
    "/users/{user_id}/approve",
    response_model=AdminResponse,
    summary="Approuver un utilisateur (Admin)",
    description="Approuve un utilisateur en attente et envoie une notification"
)
async def approve_user(
    user_id: str,
    approval_request: UserApprovalRequest = None,
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Approuve un utilisateur en attente"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}/approve",
            success=True
        )
        
        # Recherche de l'utilisateur
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if user.status != UserStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur n'est pas en attente d'approbation"
            )
        
        # Approuver l'utilisateur
        user.status = UserStatus.APPROVED
        db.commit()
        db.refresh(user)
        
        # Log de l'approbation
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role="pending",
            new_role="approved",
            success=True
        )
        
        # Envoyer notification Telegram à l'utilisateur
        try:
            user_name = user.first_name or user.username or f"User {user.telegram_id}"
            custom_message = approval_request.message if approval_request else None
            await telegram_service.send_user_approval_notification(
                telegram_id=user.telegram_id,
                user_name=user_name,
                message=custom_message
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification d'approbation: {e}")
        
        # Notifier les autres admins
        try:
            await telegram_service.notify_admins_user_processed(
                admin_user_id=str(current_user.id),
                target_user_name=user_name,
                action="approved"
            )
        except Exception as e:
            logger.error(f"Erreur lors de la notification admin: {e}")
        
        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        
        return AdminResponse(
            data={
                "user_id": str(user.id),
                "status": user.status.value,
                "telegram_id": user.telegram_id
            },
            message=f"Utilisateur {full_name or user.username} approuvé avec succès",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'approbation: {str(e)}"
        )

@router.post(
    "/users/{user_id}/reject",
    response_model=AdminResponse,
    summary="Rejeter un utilisateur (Admin)",
    description="Rejette un utilisateur en attente"
)
async def reject_user(
    user_id: str,
    rejection_request: UserRejectionRequest = None,
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Rejette un utilisateur en attente"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}/reject",
            success=True
        )
        
        # Recherche de l'utilisateur
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if user.status != UserStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur n'est pas en attente d'approbation"
            )
        
        # Rejeter l'utilisateur
        user.status = UserStatus.REJECTED
        db.commit()
        db.refresh(user)
        
        # Log du rejet
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role="pending",
            new_role="rejected",
            success=True
        )
        
        # Envoyer notification Telegram à l'utilisateur
        try:
            user_name = user.first_name or user.username or f"User {user.telegram_id}"
            reason = rejection_request.reason if rejection_request and rejection_request.reason else "Aucune raison spécifiée"
            await telegram_service.send_user_rejection_notification(
                telegram_id=user.telegram_id,
                user_name=user_name,
                reason=reason
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification de rejet: {e}")
        
        # Notifier les autres admins
        try:
            await telegram_service.notify_admins_user_processed(
                admin_user_id=str(current_user.id),
                target_user_name=user_name,
                action="rejected"
            )
        except Exception as e:
            logger.error(f"Erreur lors de la notification admin: {e}")
        
        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        reason = rejection_request.reason if rejection_request and rejection_request.reason else "Aucune raison spécifiée"
        
        return AdminResponse(
            data={
                "user_id": str(user.id),
                "status": user.status.value,
                "reason": reason
            },
            message=f"Utilisateur {full_name or user.username} rejeté avec succès",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du rejet: {str(e)}"
        )

@router.put(
    "/users/{user_id}/status",
    response_model=AdminResponse,
    summary="Modifier le statut actif d'un utilisateur (Admin)",
    description="Met à jour le statut is_active d'un utilisateur et enregistre l'historique"
)
def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Met à jour le statut is_active d'un utilisateur et enregistre l'historique"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}/status",
            success=True
        )
        
        # Recherche de l'utilisateur
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if not user:
            # Log de l'échec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}/status",
                success=False,
                error_message="Utilisateur non trouvé"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Vérifier que l'admin ne se désactive pas lui-même
        if str(user.id) == str(current_user.id) and not status_update.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Un administrateur ne peut pas se désactiver lui-même"
            )
        
        # Enregistrer l'ancien statut
        old_status = user.is_active
        
        # Mettre à jour le statut de l'utilisateur
        user.is_active = status_update.is_active
        db.commit()
        db.refresh(user)
        
        # Créer une entrée dans l'historique
        status_history = UserStatusHistory(
            user_id=user.id,
            changed_by_admin_id=current_user.id,
            old_status=old_status,
            new_status=status_update.is_active,
            reason=status_update.reason
        )
        db.add(status_history)
        db.commit()
        
        # Log de la modification de statut
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role=f"is_active={old_status}",
            new_role=f"is_active={status_update.is_active}",
            success=True
        )
        
        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        status_text = "activé" if status_update.is_active else "désactivé"
        
        return AdminResponse(
            data={
                "user_id": str(user.id),
                "is_active": user.is_active,
                "previous_status": old_status,
                "reason": status_update.reason
            },
            message=f"Utilisateur {full_name or user.username} {status_text} avec succès",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du statut: {str(e)}"
        )

@router.put(
    "/users/{user_id}",
    response_model=AdminResponse,
    summary="Mettre à jour le profil d'un utilisateur (Admin)",
    description="Met à jour les informations de base du profil utilisateur"
)
def update_user_profile(
    user_id: str,
    profile_update: UserProfileUpdate,
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Met à jour les informations du profil utilisateur"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}",
            success=True
        )
        
        # Recherche de l'utilisateur
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        if not user:
            # Log de l'échec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}",
                success=False,
                error_message="Utilisateur non trouvé"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Mettre à jour les champs fournis
        updated_fields = []
        if profile_update.first_name is not None:
            user.first_name = profile_update.first_name
            updated_fields.append("first_name")
        if profile_update.last_name is not None:
            user.last_name = profile_update.last_name
            updated_fields.append("last_name")
        
        if not updated_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun champ à mettre à jour fourni"
            )
        
        db.commit()
        db.refresh(user)
        
        # Log de la modification de profil
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role="profile_update",
            new_role=f"updated_fields={','.join(updated_fields)}",
            success=True
        )
        
        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        
        return AdminResponse(
            data={
                "user_id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "updated_fields": updated_fields
            },
            message=f"Profil de l'utilisateur {full_name or user.username} mis à jour avec succès",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du profil: {str(e)}"
        )

@router.get(
    "/users/{user_id}/history",
    response_model=UserHistoryResponse,
    summary="Historique d'activité d'un utilisateur (Admin)",
    description="Récupère la chronologie complète et filtrable de l'activité d'un utilisateur"
)
def get_user_history(
    user_id: str,
    date_from: Optional[datetime] = Query(None, description="Date de début du filtre (format ISO)"),
    date_to: Optional[datetime] = Query(None, description="Date de fin du filtre (format ISO)"),
    event_type: Optional[str] = Query(None, description="Type d'événement à filtrer (ADMINISTRATION, SESSION CAISSE, VENTE, DEPOT)"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    current_user: User = Depends(require_admin_role()),
    db: Session = Depends(get_db)
):
    """Récupère l'historique complet d'activité d'un utilisateur"""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=True
        )
        
        # Créer le service d'historique
        history_service = UserHistoryService(db)
        
        # Récupérer l'historique
        history_response = history_service.get_user_activity_history(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            event_type=event_type,
            skip=skip,
            limit=limit
        )
        
        return history_response
        
    except ValueError as e:
        # Log de l'échec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        # Log de l'échec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'historique: {str(e)}"
        )


# Endpoints pour le monitoring et la santé du système

@router.get(
    "/health-test",
    summary="Test simple de l'endpoint admin"
)
@limiter.limit("10/minute")
async def test_admin_endpoint(request: Request):
    """Test simple pour vérifier que l'endpoint admin fonctionne"""
    return {"message": "Admin endpoint accessible"}

# Endpoints de health check publics (sans authentification)
@router.get(
    "/health/public",
    summary="Health check public",
    description="Endpoint de health check public pour Docker et monitoring externe"
)
async def get_public_health():
    """Health check public - accessible sans authentification"""
    return {
        "status": "healthy",
        "service": "recyclic-api",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get(
    "/health/database",
    summary="Health check base de données",
    description="Vérifie la connectivité à la base de données"
)
async def get_database_health(db: Session = Depends(get_db)):
    """Health check de la base de données"""
    try:
        # Test simple de connexion à la base
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get(
    "/health",
    summary="Métriques de santé du système",
    description="Expose les métriques de santé, anomalies détectées et recommandations"
)
@limiter.limit("20/minute")
async def get_system_health(
    request: Request,
    current_user: User = Depends(require_admin_role_strict()),
    db: Session = Depends(get_db)
):
    """Récupère les métriques de santé du système"""
    try:
        from recyclic_api.services.anomaly_detection_service import get_anomaly_detection_service
        from recyclic_api.services.scheduler_service import get_scheduler_service

        # Exécuter la détection d'anomalies
        anomaly_service = get_anomaly_detection_service(db)
        anomalies = await anomaly_service.run_anomaly_detection()

        # Récupérer le statut du scheduler
        scheduler = get_scheduler_service()
        scheduler_status = scheduler.get_status()

        return {
            "status": "success",
            "system_health": {
                "overall_status": "healthy" if anomalies["summary"]["critical_anomalies"] == 0 else "degraded",
                "anomalies_detected": anomalies["summary"]["total_anomalies"],
                "critical_anomalies": anomalies["summary"]["critical_anomalies"],
                "scheduler_running": scheduler_status["running"],
                "active_tasks": scheduler_status["total_tasks"],
                "timestamp": anomalies["timestamp"]
            },
            "anomalies": anomalies["anomalies"],
            "recommendations": anomalies["recommendations"],
            "scheduler_status": scheduler_status
        }

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des métriques de santé: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des métriques: {str(e)}"
        )


@router.get(
    "/health/anomalies",
    summary="Anomalies détectées",
    description="Récupère uniquement les anomalies détectées sans réexécuter la détection"
)
@limiter.limit("15/minute")
async def get_anomalies(
    request: Request,
    current_user: User = Depends(require_admin_role_strict()),
    db: Session = Depends(get_db)
):
    """Récupère les anomalies détectées"""
    try:
        from recyclic_api.services.anomaly_detection_service import get_anomaly_detection_service

        # Exécuter la détection d'anomalies
        anomaly_service = get_anomaly_detection_service(db)
        anomalies = await anomaly_service.run_anomaly_detection()

        return {
            "status": "success",
            "anomalies": anomalies["anomalies"],
            "summary": anomalies["summary"],
            "timestamp": anomalies["timestamp"]
        }

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des anomalies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des anomalies: {str(e)}"
        )


@router.post(
    "/health/test-notifications",
    summary="Test des notifications",
    description="Envoie une notification de test pour vérifier le système de notifications"
)
@limiter.limit("5/minute")
async def test_notifications(
    request: Request,
    current_user: User = Depends(require_admin_role_strict())
):
    """Envoie une notification de test"""
    try:
        await telegram_service.notify_sync_failure(
            file_path="system-test",
            remote_path="notification-test",
            error_message="[TEST] Notification de test du système de monitoring - Si vous recevez ce message, le système fonctionne correctement !"
        )

        return {
            "status": "success",
            "message": "Notification de test envoyée avec succès"
        }

    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de la notification de test: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de la notification: {str(e)}"
        )


@router.get(
    "/health/scheduler",
    summary="Statut du scheduler",
    description="Récupère le statut du scheduler de tâches planifiées"
)
@limiter.limit("10/minute")
async def get_scheduler_status(
    request: Request,
    current_user: User = Depends(require_admin_role_strict())
):
    """Récupère le statut du scheduler"""
    try:
        from recyclic_api.services.scheduler_service import get_scheduler_service

        scheduler = get_scheduler_service()
        status = scheduler.get_status()

        return {
            "status": "success",
            "scheduler": status
        }

    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut du scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du statut: {str(e)}"
        )