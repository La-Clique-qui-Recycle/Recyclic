from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from recyclic_api.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.PENDING
    is_active: bool = True
    site_id: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    site_id: Optional[str] = None

class UserStatusUpdate(BaseModel):
    status: UserStatus

from pydantic import field_validator, ConfigDict


class UserResponse(UserBase):
    # Override to allow null telegram_id in DB
    telegram_id: Optional[str] = None
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', 'site_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v
