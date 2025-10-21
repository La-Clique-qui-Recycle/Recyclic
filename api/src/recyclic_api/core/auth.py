"""
Authentication helpers for the Recyclic API.
Handles JWT authentication, role checks, and permission checks.
"""

from typing import Union, List, Optional
import os
import uuid
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from .database import get_db
from .security import verify_token, create_access_token, create_password_reset_token
from ..models.user import User, UserRole
from ..models.permission import Permission, Group
from .email_service import get_email_service
from .config import settings

# Security scheme (don't auto-raise 403 so we can return 401)
security = HTTPBearer(auto_error=False)
# Strict variant that returns 403 when Authorization header is missing
security_strict = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Return current user from JWT, or raise 401."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # En absence de credentials → 401 (schéma HTTPBearer non strict)
        if credentials is None:
            raise credentials_exception
        # Verify token
        payload = verify_token(credentials.credentials)
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception

    # Load user from database
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise credentials_exception

    result = db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def get_current_user_strict(
    credentials: HTTPAuthorizationCredentials = Depends(security_strict),
    db: Session = Depends(get_db),
) -> User:
    """Variant that raises 403 on missing credentials (via security_strict)."""
    # If we reached here, credentials is present (auto_error=True); delegate to normal validation
    return await get_current_user(credentials=credentials, db=db)


def require_role(required_role: Union[UserRole, str, List[UserRole]]):
    """Dependency to require a specific role or one of a list of roles."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Handle list of roles
        if isinstance(required_role, list):
            if current_user.role not in required_role:
                # Super-admins inherit admin permissions
                if not (
                    current_user.role == UserRole.SUPER_ADMIN
                    and UserRole.ADMIN in required_role
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Permissions insuffisantes",
                    )
            return current_user

        # Convert string to enum if needed
        if isinstance(required_role, str):
            try:
                required_role_enum = UserRole(required_role)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rôle invalide: {required_role}",
                )
        else:
            required_role_enum = required_role

        # Check role
        if current_user.role != required_role_enum:
            # Super-admins inherit admin permissions
            if not (
                current_user.role == UserRole.SUPER_ADMIN
                and required_role_enum == UserRole.ADMIN
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permissions insuffisantes",
                )

        return current_user

    return role_checker


def require_role_strict(required_role: Union[UserRole, str, List[UserRole]]):
    """Same as require_role but uses strict bearer (403 when header missing)."""

    def role_checker(current_user: User = Depends(get_current_user_strict)) -> User:
        # Handle list of roles
        if isinstance(required_role, list):
            if current_user.role not in required_role:
                if not (current_user.role == UserRole.SUPER_ADMIN and UserRole.ADMIN in required_role):
                    raise HTTPException(status_code=403, detail="Permissions insuffisantes")
            return current_user

        # Convert string to enum if needed
        if isinstance(required_role, str):
            try:
                required_role_enum = UserRole(required_role)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rôle invalide: {required_role}",
                )
        else:
            required_role_enum = required_role

        if current_user.role != required_role_enum:
            if not (
                current_user.role == UserRole.SUPER_ADMIN and required_role_enum == UserRole.ADMIN
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permissions insuffisantes",
                )
        return current_user

    return role_checker


def require_admin_role(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dépendance FastAPI pour exiger un rôle admin ou super-admin.

    Lève une erreur 401 si l'utilisateur n'est pas authentifié.
    Lève une erreur 403 si l'utilisateur est authentifié mais n'a pas le bon rôle.
    """
    # Étape 1: Vérifier l'authentification (logique de get_current_user)
    unauthenticated_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthenticated_exception

    try:
        payload = verify_token(credentials.credentials)
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise unauthenticated_exception
    except JWTError:
        raise unauthenticated_exception

    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise unauthenticated_exception

    user = db.query(User).filter(User.id == user_uuid).first()

    if user is None or not user.is_active:
        raise unauthenticated_exception

    # Étape 2: Vérifier l'autorisation (rôle)
    forbidden_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé - rôle administrateur requis",
    )

    if user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise forbidden_exception

    return user


def require_super_admin_role():
    """Require super-admin role."""

    def super_admin_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé - rôle super-administrateur requis",
            )
        return current_user

    return super_admin_checker


def require_admin_role_strict():
    """Require admin or super-admin role using strict bearer (403 on missing header)."""

    def admin_checker(current_user: User = Depends(get_current_user_strict)) -> User:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé - rôle administrateur requis",
            )
        return current_user

    return admin_checker


# Utilities for Telegram auth flows
def get_user_by_telegram_id(db: Session, telegram_id: str) -> Optional[User]:
    """Fetch user by telegram_id."""
    result = db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


def authenticate_user(db: Session, telegram_id: str) -> Optional[User]:
    """Authenticate a user by telegram_id."""
    user = get_user_by_telegram_id(db, telegram_id)
    if user and user.is_active:
        return user
    return None

async def send_reset_password_email(email: str, db: Session) -> None:
    """Génère un token de réinitialisation et envoie l'e-mail."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Ne pas révéler si l'utilisateur existe ou non
        return

    reset_token = create_password_reset_token(email)
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    email_service = get_email_service()
    email_service.send_email(
        to_email=email,
        subject="Réinitialisation de votre mot de passe",
        html_content=f"""
            <p>Bonjour,</p>
            <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
            <a href="{reset_url}">Réinitialiser le mot de passe</a>
            <p>Ce lien expirera dans 1 heure.</p>
        """,
        db_session=db
    )


# ============================================================================
# Permission-Based Access Control
# ============================================================================

def user_has_permission(user: User, permission_name: str, db: Session) -> bool:
    """Check if a user has a specific permission through their groups.

    Args:
        user: The user to check
        permission_name: The name of the permission (e.g., 'caisse.access')
        db: Database session

    Returns:
        True if user has the permission, False otherwise
    """
    # Super-admins have all permissions
    if user.role == UserRole.SUPER_ADMIN:
        return True

    # Load user with groups and their permissions (anti N+1)
    stmt = (
        select(User)
        .options(
            selectinload(User.groups).selectinload(Group.permissions)
        )
        .where(User.id == user.id)
    )
    result = db.execute(stmt)
    user_with_groups = result.scalar_one_or_none()

    if not user_with_groups or not user_with_groups.groups:
        return False

    # Check if any of the user's groups have the required permission
    for group in user_with_groups.groups:
        for permission in group.permissions:
            if permission.name == permission_name:
                return True

    return False


def require_permission(permission_name: str):
    """Dependency to require a specific permission.

    This creates a reusable dependency for FastAPI endpoints that
    checks if the current user has the required permission.

    Example:
        @router.get("/caisse", dependencies=[Depends(require_permission("caisse.access"))])
        def access_caisse():
            pass

    Args:
        permission_name: The name of the permission required

    Returns:
        A dependency function for FastAPI
    """

    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        """Check if current user has the required permission."""
        if not user_has_permission(current_user, permission_name, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission requise: {permission_name}",
            )
        return current_user

    return permission_checker


def get_user_permissions(user: User, db: Session) -> List[str]:
    """Get all permissions for a user.

    Args:
        user: The user
        db: Database session

    Returns:
        List of permission names the user has
    """
    # Super-admins have all permissions
    if user.role == UserRole.SUPER_ADMIN:
        # Return all available permissions
        stmt = select(Permission)
        result = db.execute(stmt)
        all_permissions = result.scalars().all()
        return [perm.name for perm in all_permissions]

    # Load user with groups and their permissions (anti N+1)
    stmt = (
        select(User)
        .options(
            selectinload(User.groups).selectinload(Group.permissions)
        )
        .where(User.id == user.id)
    )
    result = db.execute(stmt)
    user_with_groups = result.scalar_one_or_none()

    if not user_with_groups or not user_with_groups.groups:
        return []

    # Collect unique permissions from all groups
    permissions = set()
    for group in user_with_groups.groups:
        for permission in group.permissions:
            permissions.add(permission.name)

    return sorted(list(permissions))
