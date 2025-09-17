from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import logging

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_admin_role
from recyclic_api.core.audit import log_role_change, log_admin_access
from recyclic_api.models.user import User, UserRole, UserStatus
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
    UserRejectionRequest
)

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)

# La fonction require_admin_role est maintenant importée depuis core.auth

@router.get(
    "/users",
    response_model=List[AdminUser],
    summary="Liste des utilisateurs (Admin)",
    description="Récupère la liste des utilisateurs avec filtres optionnels"
)
def get_users(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    role: Optional[UserRole] = Query(None, description="Filtrer par rôle"),
    user_status: Optional[UserStatus] = Query(None, description="Filtrer par statut"),
    current_user: User = Depends(require_admin_role()),
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
    current_user: User = Depends(require_admin_role()),
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
