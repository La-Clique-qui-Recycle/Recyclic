from pydantic import BaseModel, ConfigDict
from datetime import datetime


class SettingBase(BaseModel):
    """Base schema for settings."""
    key: str
    value: str


class SettingCreate(SettingBase):
    """Schema for creating a setting."""
    pass


class SettingUpdate(BaseModel):
    """Schema for updating a setting."""
    value: str


class SettingResponse(SettingBase):
    """Schema for setting response."""
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
