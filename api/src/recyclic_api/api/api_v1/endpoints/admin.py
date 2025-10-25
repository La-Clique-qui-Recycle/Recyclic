from fastapi import APIRouter, Depends, HTTPException, status as http_status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from uuid import UUID

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_admin_role, require_admin_role_strict
from recyclic_api.core.audit import log_role_change, log_admin_access, log_audit, AuditActionType
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.models.login_history import LoginHistory
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
    UserProfileUpdate,
    UserHistoryResponse,
    UserStatusInfo,
    UserStatusesResponse,
    ForcePasswordRequest
)
from recyclic_api.schemas.permission import UserGroupUpdateRequest
from recyclic_api.schemas.user import UserStatusUpdate
from recyclic_api.services.user_history_service import UserHistoryService
from recyclic_api.core.auth import send_reset_password_email
from recyclic_api.schemas.email_log import EmailLogListResponse, EmailLogFilters
from recyclic_api.services.email_log_service import EmailLogService
from recyclic_api.services.activity_service import (
    ActivityService,
    DEFAULT_ACTIVITY_THRESHOLD_MINUTES,
)

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)

# Configuration du rate limiting
limiter = Limiter(key_func=get_remote_address)

# La fonction require_admin_role est maintenant import├®e depuis core.auth

@router.get(
    "/users",
    response_model=List[AdminUser],
    summary="Liste des utilisateurs (Admin)",
    description="R├®cup├¿re la liste des utilisateurs avec filtres optionnels"
)
@limiter.limit("30/minute")
def get_users(
    request: Request,
    skip: int = Query(0, ge=0, description="Nombre d'├®l├®ments ├á ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'├®l├®ments par page"),
    role: Optional[UserRole] = Query(None, description="Filtrer par r├┤le"),
    user_status: Optional[UserStatus] = Query(None, description="Filtrer par statut"),
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re la liste des utilisateurs avec filtres"""
    try:
        # Log de l'acc├¿s admin
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des utilisateurs: {str(e)}"
        )

@router.get(
    "/users/statuses",
    response_model=UserStatusesResponse,
    summary="Statuts des utilisateurs (Admin)",
    description="R├®cup├¿re les statuts en ligne/hors ligne de tous les utilisateurs"
)
@limiter.limit("30/minute")
def get_users_statuses(
    request: Request,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re les statuts en ligne/hors ligne de tous les utilisateurs"""
    try:
        from datetime import datetime
        from sqlalchemy import func, and_

        # Journalise l'acces admin pour l'endpoint
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/statuses",
            success=True
        )

        activity_service = ActivityService(db)
        threshold_minutes = activity_service.get_activity_threshold_minutes()
        now_utc = datetime.now(timezone.utc)

        last_logins_subquery = db.query(
            LoginHistory.user_id,
            func.max(LoginHistory.created_at).label('last_login')
        ).filter(
            and_(
                LoginHistory.success == True,
                LoginHistory.user_id.isnot(None)
            )
        ).group_by(LoginHistory.user_id).subquery()

        users_with_logins = db.query(
            User.id,
            User.username,
            User.first_name,
            User.last_name,
            last_logins_subquery.c.last_login
        ).outerjoin(
            last_logins_subquery,
            User.id == last_logins_subquery.c.user_id
        ).all()

        user_statuses = []
        online_count = 0
        offline_count = 0

        for user_data in users_with_logins:
            user_id, username, first_name, last_name, last_login = user_data

            minutes_since_activity = activity_service.get_minutes_since_activity(str(user_id))
            logout_timestamp = activity_service.get_last_logout_timestamp(str(user_id))
            last_login_utc = None
            minutes_since_login = None

            if last_login:
                if last_login.tzinfo is None:
                    last_login_utc = last_login.replace(tzinfo=timezone.utc)
                else:
                    last_login_utc = last_login.astimezone(timezone.utc)
                minutes_since_login = (now_utc - last_login_utc).total_seconds() / 60

            is_online = minutes_since_activity is not None and minutes_since_activity <= threshold_minutes

            logout_after_last_login = False
            if logout_timestamp is not None and last_login_utc is not None:
                logout_after_last_login = logout_timestamp >= int(last_login_utc.timestamp())

            if not is_online and minutes_since_login is not None:
                if minutes_since_login <= threshold_minutes and not logout_after_last_login:
                    is_online = True
                    minutes_since_activity = minutes_since_login
                else:
                    if minutes_since_activity is None:
                        minutes_since_activity = minutes_since_login

            if is_online and logout_after_last_login:
                is_online = False

            if minutes_since_activity is None and minutes_since_login is not None:
                minutes_since_activity = minutes_since_login

            if is_online:
                online_count += 1
            else:
                offline_count += 1

            user_status = UserStatusInfo(
                user_id=str(user_id),
                is_online=is_online,
                last_login=last_login,
                minutes_since_login=int(minutes_since_activity) if minutes_since_activity is not None else None
            )
            user_statuses.append(user_status)

        total_count = len(user_statuses)

        return UserStatusesResponse(
            user_statuses=user_statuses,
            total_count=total_count,
            online_count=online_count,
            offline_count=offline_count,
            timestamp=datetime.now(timezone.utc)
        )

    except Exception as e:
        # Log de l'├®chec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/statuses",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des statuts: {str(e)}"
        )

@router.put(
    "/users/{user_id}/role",
    response_model=AdminResponse,
    summary="Modifier le r├┤le d'un utilisateur (Admin)",
    description="Met ├á jour le r├┤le d'un utilisateur sp├®cifique"
)
def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met ├á jour le r├┤le d'un utilisateur"""
    try:
        # Log de l'acc├¿s admin
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )
        if not user:
            # Log de l'├®chec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}/role",
                success=False,
                error_message="Utilisateur non trouv├®"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        # V├®rifier que l'admin ne se d├®grade pas lui-m├¬me
        if str(user.id) == str(current_user.id):
            # Emp├¬cher la r├®trogradation (admin -> role inf├®rieur)
            admin_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN]
            if (current_user.role in admin_roles and
                role_update.role not in admin_roles):
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Un administrateur ne peut pas se d├®grader lui-m├¬me"
                )

        # Mise ├á jour du r├┤le
        old_role = user.role
        user.role = role_update.role
        db.commit()
        db.refresh(user)

        # Log de la modification de r├┤le
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role=old_role.value,
            new_role=user.role.value,
            success=True,
            db=db
        )

        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name

        return AdminResponse(
            data={
                "user_id": str(user.id),
                "role": user.role.value,
                "previous_role": old_role.value
            },
            message=f"R├┤le de l'utilisateur {full_name or user.username} mis ├á jour de {old_role.value} vers {user.role.value}",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise ├á jour du r├┤le: {str(e)}"
        )

@router.get(
    "/users/pending",
    response_model=List[PendingUserResponse],
    summary="Liste des utilisateurs en attente (Admin)",
    description="R├®cup├¿re la liste des utilisateurs avec le statut 'pending'"
)
def get_pending_users(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re la liste des utilisateurs en attente d'approbation"""
    try:
        # Log de l'acc├¿s admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/pending",
            success=True
        )

        # R├®cup├®rer les utilisateurs en attente
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des utilisateurs en attente: {str(e)}"
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
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Approuve un utilisateur en attente"""
    try:
        # Log de l'acc├¿s admin
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not user:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if user.status != UserStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
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
            success=True,
            db=db
        )

        # Envoyer notification Telegram ├á l'utilisateur
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
            message=f"Utilisateur {full_name or user.username} approuv├® avec succ├¿s",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
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
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Rejette un utilisateur en attente"""
    try:
        # Log de l'acc├¿s admin
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not user:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if user.status != UserStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
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
            success=True,
            db=db
        )

        # Envoyer notification Telegram ├á l'utilisateur
        try:
            user_name = user.first_name or user.username or f"User {user.telegram_id}"
            reason = rejection_request.reason if rejection_request and rejection_request.reason else "Aucune raison sp├®cifi├®e"
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
        reason = rejection_request.reason if rejection_request and rejection_request.reason else "Aucune raison sp├®cifi├®e"

        return AdminResponse(
            data={
                "user_id": str(user.id),
                "status": user.status.value,
                "reason": reason
            },
            message=f"Utilisateur {full_name or user.username} rejet├® avec succ├¿s",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du rejet: {str(e)}"
        )

@router.put(
    "/users/{user_id}/status",
    response_model=AdminResponse,
    summary="Modifier le statut actif d'un utilisateur (Admin)",
    description="Met ├á jour le statut is_active d'un utilisateur et enregistre l'historique"
)
def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met ├á jour le statut is_active d'un utilisateur et enregistre l'historique"""
    try:
        # Log de l'acc├¿s admin
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not user:
            # Log de l'├®chec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}/status",
                success=False,
                error_message="Utilisateur non trouv├®"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        # V├®rifier que l'admin ne se d├®sactive pas lui-m├¬me
        if str(user.id) == str(current_user.id) and not status_update.is_active:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Un administrateur ne peut pas se d├®sactiver lui-m├¬me"
            )

        # Enregistrer l'ancien statut
        old_status = user.is_active

        # Mettre ├á jour le statut de l'utilisateur
        user.is_active = status_update.is_active
        db.commit()
        db.refresh(user)

        # Cr├®er une entr├®e dans l'historique
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
            success=True,
            db=db
        )

        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        status_text = "activ├®" if status_update.is_active else "d├®sactiv├®"

        return AdminResponse(
            data={
                "user_id": str(user.id),
                "is_active": user.is_active,
                "previous_status": old_status,
                "reason": status_update.reason
            },
            message=f"Utilisateur {full_name or user.username} {status_text} avec succ├¿s",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise ├á jour du statut: {str(e)}"
        )

@router.put(
    "/users/{user_id}",
    response_model=AdminResponse,
    summary="Mettre ├á jour le profil d'un utilisateur (Admin)",
    description="Met ├á jour les informations de base du profil utilisateur"
)
def update_user_profile(
    user_id: str,
    profile_update: UserProfileUpdate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met ├á jour les informations du profil utilisateur"""
    try:
        # Log de l'acc├¿s admin
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not user:
            # Log de l'├®chec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}",
                success=False,
                error_message="Utilisateur non trouv├®"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        # Mettre ├á jour les champs fournis
        updated_fields = []
        update_data = profile_update.model_dump(exclude_unset=True)

        # V├®rifier l'unicit├® du nom d'utilisateur si modifi├®
        if 'username' in update_data and update_data['username'] != user.username:
            existing_user = db.query(User).filter(User.username == update_data['username']).first()
            if existing_user:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Ce nom d'utilisateur est d├®j├á pris"
                )

        # V├®rifier l'unicit├® de l'email si modifi├®
        if 'email' in update_data and update_data['email'] is not None and update_data['email'] != user.email:
            existing_email_user = db.query(User).filter(
                User.email == update_data['email'],
                User.id != user.id
            ).first()
            if existing_email_user:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Un compte avec cet email existe d├®j├á"
                )

        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
                updated_fields.append(field)

        if not updated_fields:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Aucun champ ├á mettre ├á jour fourni"
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
            success=True,
            db=db
        )

        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name

        return AdminResponse(
            data={
                "user_id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "role": user.role,
                "status": user.status,
                "updated_fields": updated_fields
            },
            message=f"Profil de l'utilisateur {full_name or user.username} mis ├á jour avec succ├¿s",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise ├á jour du profil: {str(e)}"
        )

@router.post(
    "/users/{user_id}/reset-password",
    response_model=AdminResponse,
    summary="D├®clencher la r├®initialisation du mot de passe (Admin)",
    description="Envoie un e-mail de r├®initialisation de mot de passe ├á l'utilisateur sp├®cifi├®."
)
async def trigger_reset_password(
    user_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """D├®clenche l'envoi d'un e-mail de r├®initialisation de mot de passe."""
    try:
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()

        if not user:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not user.email:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur n'a pas d'adresse e-mail configur├®e."
            )

        await send_reset_password_email(user.email, db)

        # Log audit for password reset trigger
        log_audit(
            action_type=AuditActionType.PASSWORD_RESET,
            actor=current_user,
            target_id=user.id,
            target_type="user",
            details={
                "target_username": user.username or user.telegram_id,
                "target_email": user.email,
                "admin_username": current_user.username or current_user.telegram_id
            },
            description=f"R├®initialisation de mot de passe d├®clench├®e pour {user.username or user.telegram_id} par {current_user.username or current_user.telegram_id}",
            db=db
        )

        return AdminResponse(
            message=f"E-mail de r├®initialisation de mot de passe envoy├® ├á {user.email}",
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de l'e-mail de r├®initialisation: {str(e)}"
        )

@router.get(
    "/users/{user_id}/history",
    response_model=UserHistoryResponse,
    summary="Historique d'activit├® d'un utilisateur (Admin)",
    description="R├®cup├¿re la chronologie compl├¿te et filtrable de l'activit├® d'un utilisateur"
)
def get_user_history(
    user_id: str,
    date_from: Optional[datetime] = Query(None, description="Date de d├®but du filtre (format ISO)"),
    date_to: Optional[datetime] = Query(None, description="Date de fin du filtre (format ISO)"),
    event_type: Optional[str] = Query(None, description="Type d'├®v├®nement ├á filtrer (ADMINISTRATION, SESSION CAISSE, VENTE, DEPOT)"),
    skip: int = Query(0, ge=0, description="Nombre d'├®l├®ments ├á ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'├®l├®ments par page"),
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re l'historique complet d'activit├® d'un utilisateur"""
    try:
        # Log de l'acc├¿s admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=True
        )

        # R├®cup├®rer le nom de l'utilisateur cible pour une description plus lisible
        target_user = db.query(User).filter(User.id == user_id).first()
        target_name = "utilisateur inconnu"
        if target_user:
            if target_user.first_name and target_user.last_name:
                target_name = f"{target_user.first_name} {target_user.last_name}"
            elif target_user.first_name:
                target_name = target_user.first_name
            elif target_user.username:
                target_name = target_user.username
            elif target_user.telegram_id:
                target_name = f"@{target_user.telegram_id}"


        # Cr├®er le service d'historique
        history_service = UserHistoryService(db)

        # R├®cup├®rer l'historique
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
        # Log de l'├®chec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        # Log de l'├®chec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/history",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration de l'historique: {str(e)}"
        )


# Endpoints pour le monitoring et la sant├® du syst├¿me

@router.get(
    "/health-test",
    summary="Test simple de l'endpoint admin"
)
@limiter.limit("10/minute")
async def test_admin_endpoint(request: Request):
    """Test simple pour v├®rifier que l'endpoint admin fonctionne"""
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
    summary="Health check base de donn├®es",
    description="V├®rifie la connectivit├® ├á la base de donn├®es"
)
async def get_database_health(db: Session = Depends(get_db)):
    """Health check de la base de donn├®es"""
    try:
        # Test simple de connexion ├á la base
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
    summary="M├®triques de sant├® du syst├¿me",
    description="Expose les m├®triques de sant├®, anomalies d├®tect├®es et recommandations"
)
@limiter.limit("20/minute")
async def get_system_health(
    request: Request,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re les m├®triques de sant├® du syst├¿me"""
    try:
        from recyclic_api.services.anomaly_detection_service import get_anomaly_detection_service
        from recyclic_api.services.scheduler_service import get_scheduler_service

        # Ex├®cuter la d├®tection d'anomalies
        anomaly_service = get_anomaly_detection_service(db)
        anomalies = await anomaly_service.run_anomaly_detection()

        # R├®cup├®rer le statut du scheduler
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
        logger.error(f"Erreur lors de la r├®cup├®ration des m├®triques de sant├®: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des m├®triques: {str(e)}"
        )


@router.get(
    "/health/anomalies",
    summary="Anomalies d├®tect├®es",
    description="R├®cup├¿re uniquement les anomalies d├®tect├®es sans r├®ex├®cuter la d├®tection"
)
@limiter.limit("15/minute")
async def get_anomalies(
    request: Request,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re les anomalies d├®tect├®es"""
    try:
        from recyclic_api.services.anomaly_detection_service import get_anomaly_detection_service

        # Ex├®cuter la d├®tection d'anomalies
        anomaly_service = get_anomaly_detection_service(db)
        anomalies = await anomaly_service.run_anomaly_detection()

        return {
            "status": "success",
            "anomalies": anomalies["anomalies"],
            "summary": anomalies["summary"],
            "timestamp": anomalies["timestamp"]
        }

    except Exception as e:
        logger.error(f"Erreur lors de la r├®cup├®ration des anomalies: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des anomalies: {str(e)}"
        )


@router.post(
    "/health/test-notifications",
    summary="Test des notifications",
    description="Envoie une notification de test pour v├®rifier le syst├¿me de notifications"
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
            error_message="[TEST] Notification de test du syst├¿me de monitoring - Si vous recevez ce message, le syst├¿me fonctionne correctement !"
        )

        return {
            "status": "success",
            "message": "Notification de test envoy├®e avec succ├¿s"
        }

    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de la notification de test: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de la notification: {str(e)}"
        )


@router.get(
    "/health/scheduler",
    summary="Statut du scheduler",
    description="R├®cup├¿re le statut du scheduler de t├óches planifi├®es"
)
@limiter.limit("10/minute")
async def get_scheduler_status(
    request: Request,
    current_user: User = Depends(require_admin_role_strict())
):
    """R├®cup├¿re le statut du scheduler"""
    try:
        from recyclic_api.services.scheduler_service import get_scheduler_service

        scheduler = get_scheduler_service()
        status = scheduler.get_status()

        return {
            "status": "success",
            "scheduler": status
        }

    except Exception as e:
        logger.error(f"Erreur lors de la r├®cup├®ration du statut du scheduler: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration du statut: {str(e)}"
        )

@router.post(
    "/users/{user_id}/force-password",
    response_model=AdminResponse,
    summary="Forcer un nouveau mot de passe (Super Admin uniquement)",
    description="Force un nouveau mot de passe pour un utilisateur. R├®serv├® aux Super Administrateurs uniquement."
)
@limiter.limit("5/minute")
async def force_user_password(
    user_id: str,
    force_request: ForcePasswordRequest,
    request: Request,
    current_user: User = Depends(require_admin_role_strict()),
    db: Session = Depends(get_db)
):
    """Force un nouveau mot de passe pour un utilisateur (Super Admin uniquement)"""
    try:
        # V├®rifier que l'utilisateur actuel est un Super Admin
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Cette action est r├®serv├®e aux Super Administrateurs uniquement"
            )

        # Log de l'acc├¿s admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/force-password",
            success=True
        )

        # Recherche de l'utilisateur cible
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            target_user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not target_user:
            # Log de l'├®chec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint=f"/admin/users/{user_id}/force-password",
                success=False,
                error_message="Utilisateur non trouv├®"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        # Valider la force du nouveau mot de passe
        from recyclic_api.core.security import validate_password_strength
        is_valid, errors = validate_password_strength(force_request.new_password)
        if not is_valid:
            # Translate common English messages to French keywords expected by tests
            translations = {
                "Password must be at least 8 characters long": "Le mot de passe doit contenir au moins 8 caract├¿res",
                "Password must contain at least one uppercase letter": "Le mot de passe doit contenir au moins une lettre majuscule",
                "Password must contain at least one lowercase letter": "Le mot de passe doit contenir au moins une lettre minuscule",
                "Password must contain at least one digit": "Le mot de passe doit contenir au moins un chiffre",
                "Password must contain at least one special character": "Le mot de passe doit contenir au moins un caract├¿re sp├®cial",
            }
            fr_errors = [translations.get(e, e) for e in errors]
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Mot de passe invalide: {' '.join(fr_errors)}",
            )

        # Hasher le nouveau mot de passe
        from recyclic_api.core.security import hash_password
        new_hashed_password = hash_password(force_request.new_password)

        # Sauvegarder l'ancien mot de passe pour l'audit
        old_password_hash = target_user.hashed_password

        # Mettre ├á jour le mot de passe
        target_user.hashed_password = new_hashed_password
        db.commit()
        db.refresh(target_user)

        # Log de l'action de for├ºage de mot de passe
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(target_user.id),
            target_username=target_user.username or target_user.telegram_id,
            old_role="password_forced",
            new_role=f"new_password_set_by_super_admin",
            success=True,
            db=db
        )

        # Enregistrer l'action dans l'historique utilisateur
        from recyclic_api.models.user_status_history import UserStatusHistory
        password_force_history = UserStatusHistory(
            user_id=target_user.id,
            changed_by_admin_id=current_user.id,
            old_status=True,  # L'utilisateur ├®tait actif
            new_status=True,  # L'utilisateur reste actif
            reason=f"Mot de passe forc├® par Super Admin. Raison: {force_request.reason or 'Non sp├®cifi├®e'}"
        )
        db.add(password_force_history)
        db.commit()

        # Log audit pour le for├ºage de mot de passe
        log_audit(
            action_type=AuditActionType.PASSWORD_FORCED,
            actor=current_user,
            target_id=target_user.id,
            target_type="user",
            details={
                "target_username": target_user.username,
                "target_telegram_id": target_user.telegram_id,
                "reason": force_request.reason,
                "admin_username": current_user.username or current_user.telegram_id
            },
            description=f"Mot de passe forc├® pour l'utilisateur {target_user.username} par Super Admin {current_user.username or current_user.telegram_id}",
            db=db
        )

        full_name = f"{target_user.first_name} {target_user.last_name}" if target_user.first_name and target_user.last_name else target_user.first_name or target_user.last_name

        return AdminResponse(
            data={
                "user_id": str(target_user.id),
                "action": "password_forced",
                "reason": force_request.reason,
                "forced_by": str(current_user.id),
                "forced_at": datetime.now(timezone.utc).isoformat()
            },
            message=f"Mot de passe forc├® avec succ├¿s pour l'utilisateur {full_name or target_user.username}",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        # Log de l'├®chec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/force-password",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du for├ºage du mot de passe: {str(e)}"
        )


@router.post(
    "/users/{user_id}/reset-pin",
    response_model=dict,
    summary="R├®initialiser le PIN d'un utilisateur",
    description="Efface le PIN d'un utilisateur, le for├ºant ├á en cr├®er un nouveau"
)
@limiter.limit("10/minute")
def reset_user_pin(
    request: Request,
    user_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®initialise le PIN d'un utilisateur (Admin uniquement)"""
    try:
        # Log de l'acc├¿s admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/reset-pin",
            success=True
        )

        # Recherche de l'utilisateur cible
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            target_user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        if not target_user:
            # Log de l'├®chec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint=f"/admin/users/{user_id}/reset-pin",
                success=False,
                error_message="Utilisateur non trouv├®"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouv├®"
            )

        # Effacer le PIN (mettre ├á NULL)
        target_user.hashed_pin = None
        db.commit()

        # Log audit pour la r├®initialisation de PIN
        log_audit(
            action_type=AuditActionType.PIN_RESET,
            actor=current_user,
            target_id=target_user.id,
            target_type="user",
            details={
                "target_username": target_user.username,
                "target_telegram_id": target_user.telegram_id,
                "admin_username": current_user.username or current_user.telegram_id
            },
            description=f"PIN r├®initialis├® pour l'utilisateur {target_user.username} par Admin {current_user.username or current_user.telegram_id}",
            db=db
        )

        # Log de l'action
        full_name = f"{target_user.first_name} {target_user.last_name}".strip() if target_user.first_name and target_user.last_name else target_user.first_name or target_user.last_name
        logger.info(
            f"PIN reset for user {target_user.id} by admin {current_user.id}",
            extra={
                "target_user_id": str(target_user.id),
                "target_username": target_user.username,
                "admin_user_id": str(current_user.id),
                "admin_username": current_user.username or current_user.telegram_id,
                "action": "pin_reset",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

        return {
            "message": f"PIN r├®initialis├® avec succ├¿s pour l'utilisateur {full_name or target_user.username}",
            "user_id": str(target_user.id),
            "username": target_user.username
        }

    except HTTPException:
        raise
    except Exception as e:
        # Log de l'├®chec
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint=f"/admin/users/{user_id}/reset-pin",
            success=False,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®initialisation du PIN: {str(e)}"
        )


@router.get(
    "/audit-log",
    response_model=dict,
    summary="Journal d'audit (Admin)",
    description="R├®cup├¿re le journal d'audit avec filtres et pagination"
)
@limiter.limit("30/minute")
async def get_audit_log(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role_strict()),
    page: int = Query(1, ge=1, description="Num├®ro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    action_type: Optional[str] = Query(None, description="Filtrer par type d'action"),
    actor_username: Optional[str] = Query(None, description="Filtrer par nom d'utilisateur acteur"),
    target_type: Optional[str] = Query(None, description="Filtrer par type de cible"),
    start_date: Optional[datetime] = Query(None, description="Date de d├®but (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="Date de fin (ISO format)"),
    search: Optional[str] = Query(None, description="Recherche dans description ou d├®tails")
):
    """
    R├®cup├¿re le journal d'audit avec filtres et pagination.
    Seuls les administrateurs peuvent acc├®der ├á cette fonctionnalit├®.
    """
    try:
        from recyclic_api.models.audit_log import AuditLog
        from sqlalchemy import and_, or_, desc
        
        # Construire la requ├¬te de base
        query = db.query(AuditLog)
        
        # Appliquer les filtres
        filters = []
        
        if action_type:
            filters.append(AuditLog.action_type == action_type)
        
        if actor_username:
            filters.append(AuditLog.actor_username.ilike(f"%{actor_username}%"))
        
        if target_type:
            filters.append(AuditLog.target_type == target_type)
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        if search:
            from sqlalchemy import cast, String
            search_filter = or_(
                AuditLog.description.ilike(f"%{search}%"),
                cast(AuditLog.details_json, String).ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Compter le total d'entr├®es
        total_count = query.count()
        
        # Appliquer la pagination et l'ordre
        offset = (page - 1) * page_size
        audit_entries = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(page_size).all()
        
        # Calculer les informations de pagination
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1
        
        # Formater les entr├®es pour la r├®ponse
        entries = []
        for entry in audit_entries:
            # R├®cup├®rer le nom complet de l'acteur avec fallback intelligent
            actor_display_name = entry.actor_username or "Syst├¿me"
            if entry.actor_id:
                actor_user = db.query(User).filter(User.id == entry.actor_id).first()
                if actor_user:
                    # Logique de fallback intelligente
                    if actor_user.first_name and actor_user.last_name:
                        # Nom complet + identifiant
                        if actor_user.username:
                            actor_display_name = f"{actor_user.first_name} {actor_user.last_name} (@{actor_user.username})"
                        elif actor_user.telegram_id:
                            actor_display_name = f"{actor_user.first_name} {actor_user.last_name} (@{actor_user.telegram_id})"
                        else:
                            actor_display_name = f"{actor_user.first_name} {actor_user.last_name}"
                    elif actor_user.first_name:
                        # Pr├®nom seul + identifiant
                        if actor_user.username:
                            actor_display_name = f"{actor_user.first_name} (@{actor_user.username})"
                        elif actor_user.telegram_id:
                            actor_display_name = f"{actor_user.first_name} (@{actor_user.telegram_id})"
                        else:
                            actor_display_name = actor_user.first_name
                    elif actor_user.username:
                        actor_display_name = f"@{actor_user.username}"
                    elif actor_user.telegram_id:
                        actor_display_name = f"@{actor_user.telegram_id}"
                    else:
                        # Dernier recours : ID
                        actor_display_name = f"ID: {str(actor_user.id)[:8]}..."
            
            # R├®cup├®rer le nom complet de l'utilisateur cible avec fallback intelligent
            target_display_name = None
            if entry.target_id and entry.target_type == "user":
                target_user = db.query(User).filter(User.id == entry.target_id).first()
                if target_user:
                    # Logique de fallback intelligente
                    if target_user.first_name and target_user.last_name:
                        # Nom complet + identifiant
                        if target_user.username:
                            target_display_name = f"{target_user.first_name} {target_user.last_name} (@{target_user.username})"
                        elif target_user.telegram_id:
                            target_display_name = f"{target_user.first_name} {target_user.last_name} (@{target_user.telegram_id})"
                        else:
                            target_display_name = f"{target_user.first_name} {target_user.last_name}"
                    elif target_user.first_name:
                        # Pr├®nom seul + identifiant
                        if target_user.username:
                            target_display_name = f"{target_user.first_name} (@{target_user.username})"
                        elif target_user.telegram_id:
                            target_display_name = f"{target_user.first_name} (@{target_user.telegram_id})"
                        else:
                            target_display_name = target_user.first_name
                    elif target_user.username:
                        target_display_name = f"@{target_user.username}"
                    elif target_user.telegram_id:
                        target_display_name = f"@{target_user.telegram_id}"
                    else:
                        # Dernier recours : ID
                        target_display_name = f"ID: {str(target_user.id)[:8]}..."
            
            # Am├®liorer la description en rempla├ºant les IDs par des noms
            improved_description = entry.description
            if entry.description and entry.target_id and target_display_name:
                # Remplacer les IDs par les noms dans la description
                improved_description = entry.description.replace(
                    str(entry.target_id), 
                    target_display_name
                )
            
            entry_data = {
                "id": str(entry.id),
                "timestamp": entry.timestamp.isoformat(),
                "actor_id": str(entry.actor_id) if entry.actor_id else None,
                "actor_username": actor_display_name,
                "action_type": entry.action_type,
                "target_id": str(entry.target_id) if entry.target_id else None,
                "target_username": target_display_name,
                "target_type": entry.target_type,
                "details": entry.details_json,
                "description": improved_description,
                "ip_address": entry.ip_address,
                "user_agent": entry.user_agent
            }
            entries.append(entry_data)
        
        # Log de l'acc├¿s au journal d'audit
        logger.info(
            f"Audit log accessed by admin {current_user.id}",
            extra={
                "admin_user_id": str(current_user.id),
                "admin_username": current_user.username or current_user.telegram_id,
                "action": "audit_log_access",
                "filters": {
                    "action_type": action_type,
                    "actor_username": actor_username,
                    "target_type": target_type,
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                    "search": search
                },
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
        return {
            "entries": entries,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            },
            "filters_applied": {
                "action_type": action_type,
                "actor_username": actor_username,
                "target_type": target_type,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "search": search
            }
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la r├®cup├®ration du journal d'audit: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration du journal d'audit: {str(e)}"
        )


@router.get(
    "/email-logs",
    response_model=EmailLogListResponse,
    summary="Liste des logs d'emails (Admin)",
    description="R├®cup├¿re la liste des emails envoy├®s avec filtrage et pagination"
)
@limiter.limit("30/minute")
async def get_email_logs(
    request: Request,
    recipient_email: Optional[str] = Query(None, description="Filtrer par adresse email du destinataire"),
    status: Optional[str] = Query(None, description="Filtrer par statut de l'email"),
    email_type: Optional[str] = Query(None, description="Filtrer par type d'email"),
    user_id: Optional[str] = Query(None, description="Filtrer par ID utilisateur"),
    page: int = Query(1, ge=1, description="Num├®ro de page"),
    per_page: int = Query(50, ge=1, le=100, description="Nombre d'├®l├®ments par page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role_strict())
):
    """
    R├®cup├¿re la liste des logs d'emails avec filtrage et pagination.
    
    Seuls les administrateurs et super-administrateurs peuvent acc├®der ├á cette fonctionnalit├®.
    """
    try:
        # Log de l'acc├¿s admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username,
            endpoint="get_email_logs",
            success=True,
            db=db
        )
        
        # Cr├®er le service de logs d'email
        email_log_service = EmailLogService(db)
        
        # Convertir les param├¿tres de filtrage
        from recyclic_api.models.email_log import EmailStatus, EmailType
        
        status_filter = None
        if status:
                   try:
                       status_filter = EmailStatus(status)
                   except ValueError:
                       raise HTTPException(
                           status_code=http_status.HTTP_400_BAD_REQUEST,
                           detail=f"Statut invalide: {status}"
                       )
        
        type_filter = None
        if email_type:
            try:
                type_filter = EmailType(email_type)
            except ValueError:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Type d'email invalide: {email_type}"
                )
        
        # Calculer l'offset pour la pagination
        skip = (page - 1) * per_page
        
        # R├®cup├®rer les logs d'email
        email_logs = email_log_service.get_email_logs(
            skip=skip,
            limit=per_page,
            recipient_email=recipient_email,
            status=status_filter,
            email_type=type_filter,
            user_id=user_id
        )
        
        # R├®cup├®rer le total pour la pagination
        total = email_log_service.get_email_logs_count(
            recipient_email=recipient_email,
            status=status_filter,
            email_type=type_filter,
            user_id=user_id
        )
        
        # Calculer le nombre total de pages
        total_pages = (total + per_page - 1) // per_page
        
        return EmailLogListResponse(
            email_logs=email_logs,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la r├®cup├®ration des logs d'emails: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration des logs d'emails: {str(e)}"
        )


@router.get(
    "/settings/activity-threshold",
    summary="R├®cup├®rer le seuil d'activit├®",
    description="R├®cup├¿re le seuil d'activit├® configur├® pour d├®terminer si un utilisateur est en ligne"
)
@limiter.limit("30/minute")
async def get_activity_threshold(
    request: Request,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """R├®cup├¿re le seuil d'activit├® configur├®"""
    try:
        from recyclic_api.models.setting import Setting
        
        # R├®cup├®rer le seuil d'activit├® depuis la base de donn├®es
        setting = db.query(Setting).filter(Setting.key == "activity_threshold_minutes").first()
        
        if setting:
            threshold = int(setting.value)
        else:
            # Valeur par d├®faut si pas configur├®
            threshold = 15
        
        return {
            "activity_threshold_minutes": threshold,
            "description": "Seuil en minutes pour consid├®rer un utilisateur comme en ligne"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la r├®cup├®ration du seuil d'activit├®: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la r├®cup├®ration du seuil d'activit├®: {str(e)}"
        )


@router.put(
    "/settings/activity-threshold",
    summary="Modifier le seuil d'activit├®",
    description="Modifie le seuil d'activit├® pour d├®terminer si un utilisateur est en ligne"
)
@limiter.limit("10/minute")
async def update_activity_threshold(
    request: Request,
    threshold_data: dict,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Modifie le seuil d'activit├® configur├®"""
    try:
        from recyclic_api.models.setting import Setting
        
        # Valider les donn├®es
        threshold = threshold_data.get("activity_threshold_minutes")
        if not isinstance(threshold, int) or threshold < 1 or threshold > 1440:  # Max 24h
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Le seuil doit ├¬tre un entier entre 1 et 1440 minutes"
            )
        
        # R├®cup├®rer ou cr├®er le param├¿tre
        setting = (
            db.query(Setting)
            .filter(Setting.key == "activity_threshold_minutes")
            .with_for_update()
            .first()
        )

        previous_value = setting.value if setting else None

        if setting:
            setting.value = str(threshold)
        else:
            setting = Setting(
                key="activity_threshold_minutes",
                value=str(threshold)
            )
            db.add(setting)

        db.commit()
        db.refresh(setting)
        ActivityService.refresh_cache(threshold)
        
        # Log de l'audit
        log_audit(
            action_type=AuditActionType.SETTING_UPDATED,
            actor=current_user,
            details={
                "setting_key": "activity_threshold_minutes",
                "old_value": previous_value if previous_value is not None else str(DEFAULT_ACTIVITY_THRESHOLD_MINUTES),
                "new_value": str(threshold)
            },
            description=f"Seuil d'activit├® modifi├® ├á {threshold} minutes",
            ip_address=getattr(request.client, 'host', 'unknown') if request.client else 'unknown',
            user_agent=request.headers.get("user-agent", "unknown"),
            db=db
        )
        
        return {
            "message": f"Seuil d'activit├® mis ├á jour ├á {threshold} minutes",
            "activity_threshold_minutes": threshold
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise ├á jour du seuil d'activit├®: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise ├á jour du seuil d'activit├®: {str(e)}"
        )


@router.put(
    "/users/{user_id}/groups",
    response_model=AdminResponse,
    summary="Mettre à jour les groupes d'un utilisateur (Admin)",
    description="Met à jour l'assignation des groupes pour un utilisateur spécifique"
)
def update_user_groups(
    user_id: str,
    group_update: UserGroupUpdateRequest,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met à jour les groupes d'un utilisateur."""
    try:
        # Log de l'accès admin
        log_admin_access(
            user_id=str(current_user.id),
            username=current_user.username or current_user.telegram_id,
            endpoint="/admin/users/{user_id}/groups",
            success=True
        )

        # Recherche de l'utilisateur
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )

        if not user:
            # Log de l'échec
            log_admin_access(
                user_id=str(current_user.id),
                username=current_user.username or current_user.telegram_id,
                endpoint="/admin/users/{user_id}/groups",
                success=False,
                error_message="Utilisateur non trouvé"
            )
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )

        # Importer le modèle Group
        from recyclic_api.models.permission import Group

        # Valider que tous les groupes existent
        group_uuids = []
        for group_id in group_update.group_ids:
            try:
                group_uuid = uuid.UUID(group_id)
                group = db.query(Group).filter(Group.id == group_uuid).first()
                if not group:
                    raise HTTPException(
                        status_code=http_status.HTTP_404_NOT_FOUND,
                        detail=f"Groupe non trouvé: {group_id}"
                    )
                group_uuids.append(group_uuid)
            except ValueError:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"ID de groupe invalide: {group_id}"
                )

        # Récupérer les groupes existants
        existing_groups = db.query(Group).filter(Group.id.in_(group_uuids)).all()
        
        # Mettre à jour les groupes de l'utilisateur
        user.groups = existing_groups
        db.commit()
        db.refresh(user)

        # Log de la modification des groupes
        log_role_change(
            admin_user_id=str(current_user.id),
            admin_username=current_user.username or current_user.telegram_id,
            target_user_id=str(user.id),
            target_username=user.username or user.telegram_id,
            old_role=f"groups={[g.name for g in user.groups]}",
            new_role=f"groups={[g.name for g in existing_groups]}",
            success=True,
            db=db
        )

        full_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.first_name or user.last_name
        group_names = [group.name for group in existing_groups]

        return AdminResponse(
            data={
                "user_id": str(user.id),
                "group_ids": group_update.group_ids,
                "group_names": group_names
            },
            message=f"Groupes de l'utilisateur {full_name or user.username} mis à jour avec succès",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour des groupes: {str(e)}"
        )


 




