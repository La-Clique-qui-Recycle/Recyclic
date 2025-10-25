"""
Authentication helpers for the Recyclic API.
Handles JWT authentication, role checks, and permission checks.
"""

from dataclasses import dataclass
from datetime import datetime
import json
import os
import uuid
from typing import List, Optional, Union

import redis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .database import get_db
from .email_service import get_email_service
from .redis import get_redis
from .security import create_access_token, create_password_reset_token, verify_token
from ..models.permission import Group, Permission
from ..models.user import User, UserRole, UserStatus

# Security scheme (don't auto-raise 403 so we can return 401)
security = HTTPBearer(auto_error=False)
# Strict variant that returns 403 when Authorization header is missing
security_strict = HTTPBearer(auto_error=True)

SAFE_CACHE_METHODS = {"GET", "HEAD", "OPTIONS"}
USER_CACHE_TTL_SECONDS = 300


@dataclass
class CachedUser:
    """Lightweight representation of an authenticated user stored in Redis."""

    id: uuid.UUID
    username: Optional[str]
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    role: UserRole
    status: UserStatus
    is_active: bool
    telegram_id: Optional[str]
    site_id: Optional[uuid.UUID]
    phone_number: Optional[str]
    address: Optional[str]
    notes: Optional[str]
    skills: Optional[str]
    availability: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @classmethod
    def from_dict(cls, data: dict) -> "CachedUser":
        """Rehydrate a cached user payload into a strongly typed object."""

        def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
            return datetime.fromisoformat(value) if value else None

        def _parse_uuid(value: Optional[str]) -> Optional[uuid.UUID]:
            return uuid.UUID(value) if value else None

        return cls(
            id=uuid.UUID(data["id"]),
            username=data.get("username"),
            email=data.get("email"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role=UserRole(data["role"]),
            status=UserStatus(data["status"]),
            is_active=bool(data.get("is_active", True)),
            telegram_id=data.get("telegram_id"),
            site_id=_parse_uuid(data.get("site_id")),
            phone_number=data.get("phone_number"),
            address=data.get("address"),
            notes=data.get("notes"),
            skills=data.get("skills"),
            availability=data.get("availability"),
            created_at=_parse_datetime(data.get("created_at")),
            updated_at=_parse_datetime(data.get("updated_at")),
        )

    def to_cache_dict(self) -> dict:
        """Serialize the cached user back to a JSON-friendly payload."""

        def _serialize_value(value):
            if isinstance(value, uuid.UUID):
                return str(value)
            if isinstance(value, (UserRole, UserStatus)):
                return value.value
            if isinstance(value, datetime):
                return value.isoformat()
            return value

        return {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role.value,
            "status": self.status.value,
            "is_active": self.is_active,
            "telegram_id": self.telegram_id,
            "site_id": str(self.site_id) if self.site_id else None,
            "phone_number": self.phone_number,
            "address": self.address,
            "notes": self.notes,
            "skills": self.skills,
            "availability": self.availability,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def serialize_user_for_cache(user: User) -> dict:
    """Serialize a SQLAlchemy user into a cache-ready dictionary."""
    payload = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value if user.role else UserRole.USER.value,
        "status": user.status.value if user.status else UserStatus.PENDING.value,
        "is_active": user.is_active,
        "telegram_id": user.telegram_id,
        "site_id": str(user.site_id) if user.site_id else None,
        "phone_number": user.phone_number,
        "address": user.address,
        "notes": user.notes,
        "skills": user.skills,
        "availability": user.availability,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }
    return payload


def load_cached_user(redis_client: redis.Redis, cache_key: str) -> Optional[CachedUser]:
    """Return a cached user if the payload is valid."""
    try:
        cached_user_data = redis_client.get(cache_key)
    except Exception:
        return None

    if not cached_user_data:
        return None

    try:
        deserialized = json.loads(cached_user_data)
        return CachedUser.from_dict(deserialized)
    except (json.JSONDecodeError, KeyError, ValueError):
        return None


def should_use_cached_payload(request: Optional[Request]) -> bool:
    """Determine whether it is safe to return the cached DTO (read-only requests)."""
    if request is None:
        return False
    return request.method.upper() in SAFE_CACHE_METHODS


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    request: Request = None,
) -> Union[User, CachedUser]:
    """Return current user from JWT, using Redis cache for safe requests when possible."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        if credentials is None:
            raise credentials_exception
        payload = verify_token(credentials.credentials)
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception

    cache_key = f"user_cache:{user_id}"
    cached_user = load_cached_user(redis_client, cache_key)
    if cached_user:
        if not cached_user.is_active:
            raise credentials_exception
        if should_use_cached_payload(request):
            return cached_user

    # --- Database Lookup (Cache Miss or unsafe method) ---
    try:
        user_uuid = uuid.UUID(user_id)
    except Exception:
        raise credentials_exception

    result = db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    # --- Cache Population ---
    try:
        redis_client.set(
            cache_key,
            json.dumps(serialize_user_for_cache(user)),
            ex=USER_CACHE_TTL_SECONDS,
        )
    except Exception:
        # If caching fails, do not block the request
        pass

    return user


async def get_current_user_strict(
    credentials: HTTPAuthorizationCredentials = Depends(security_strict),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    request: Request = None,
) -> Union[User, CachedUser]:
    """Variant that raises 403 on missing credentials (via security_strict)."""
    # If we reached here, credentials is present (auto_error=True); delegate to normal validation
    return await get_current_user(
        credentials=credentials,
        db=db,
        redis_client=redis_client,
        request=request,
    )


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
    # Admins and Super-admins have all permissions
    if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
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
    # Admins and Super-admins have all permissions
    if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
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
