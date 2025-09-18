"""
Authentication helpers for the Recyclic API.
Handles JWT authentication and role checks.
"""

from typing import Union, List, Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select

from .database import get_db
from .security import verify_token, create_access_token  # noqa: F401
from ..models.user import User, UserRole

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
    # If we reached here, credentials is present; delegate to normal validation
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
                if not (
                    current_user.role == UserRole.SUPER_ADMIN and UserRole.ADMIN in required_role
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


def require_admin_role():
    """Require admin or super-admin role."""

    def admin_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé - rôle administrateur requis",
            )
        return current_user

    return admin_checker


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
