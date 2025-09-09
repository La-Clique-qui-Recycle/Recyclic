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

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
