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


class SessionSettingsResponse(BaseModel):
    """Schema for session settings response."""
    token_expiration_minutes: int


class SessionSettingsUpdate(BaseModel):
    """Schema for updating session settings."""
    token_expiration_minutes: int


class EmailSettingsResponse(BaseModel):
    """Schema for email settings response."""
    from_name: str
    from_address: str
    default_recipient: str | None = None
    has_api_key: bool
    webhook_secret_configured: bool


class EmailSettingsUpdate(BaseModel):
    """Schema for updating email settings."""
    from_name: str | None = None
    from_address: str | None = None
    default_recipient: str | None = None


class EmailTestRequest(BaseModel):
    """Schema for email test request."""
    to_email: str