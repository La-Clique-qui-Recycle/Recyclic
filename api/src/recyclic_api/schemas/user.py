from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional, Tuple, List
from datetime import datetime
import re
from recyclic_api.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.PENDING
    is_active: bool = True
    site_id: Optional[str] = None

class UserCreate(UserBase):
    password: str
    telegram_id: Optional[str] = None  # Rendre optionnel

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength according to security best practices."""
        errors = []

        if len(v) < 8:
            errors.append("Password must be at least 8 characters long")

        if not re.search(r'[A-Z]', v):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r'[a-z]', v):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r'\d', v):
            errors.append("Password must contain at least one digit")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("Password must contain at least one special character")

        if errors:
            raise ValueError("; ".join(errors))

        return v

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        """Validate username format if provided."""
        if v is not None:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    site_id: Optional[str] = None

class UserSelfUpdate(BaseModel):
    """Champs autorisés pour la mise à jour par l'utilisateur lui-même.

    Contrairement à UserUpdate (admin), on n'autorise pas la modification des champs sensibles
    comme role, status, is_active, site_id.
    """
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v

class UserStatusUpdate(BaseModel):
    status: UserStatus
    is_active: bool
    reason: Optional[str] = None

class LinkTelegramRequest(BaseModel):
    """Schéma pour la requête de liaison de compte Telegram."""
    username: str
    password: str
    telegram_id: str

from pydantic import field_validator, ConfigDict


class UserResponse(UserBase):
    # Override to allow null telegram_id in DB
    telegram_id: Optional[str] = None
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, exclude={'hashed_password'})

    @field_validator('id', 'site_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v


class PasswordChangeRequest(BaseModel):
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Réutilise les règles de robustesse du mot de passe de UserCreate."""
        errors: List[str] = []
        if len(v) < 8:
            errors.append("Password must be at least 8 characters long")
        if not re.search(r'[A-Z]', v):
            errors.append("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            errors.append("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            errors.append("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("Password must contain at least one special character")
        if errors:
            raise ValueError("; ".join(errors))
        return v

    @field_validator('confirm_password')
    @classmethod
    def validate_confirm(cls, v: str, info):
        new_password = info.data.get('new_password')
        if new_password is not None and v != new_password:
            raise ValueError("Passwords do not match")
        return v