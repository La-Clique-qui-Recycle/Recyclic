from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class ButtonType(str, Enum):
    DONATION = "donation"
    RECYCLING = "recycling"


class PresetButtonBase(BaseModel):
    name: str
    category_id: str
    preset_price: Decimal
    button_type: ButtonType
    sort_order: Optional[int] = 0


class PresetButtonCreate(PresetButtonBase):
    pass


class PresetButtonUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    preset_price: Optional[Decimal] = None
    button_type: Optional[ButtonType] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class PresetButtonRead(PresetButtonBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v

    @field_validator('category_id', mode='before')
    @classmethod
    def _category_uuid_to_str(cls, v):
        return str(v) if v is not None else v


class PresetButtonWithCategory(PresetButtonRead):
    category_name: str

    model_config = ConfigDict(from_attributes=True)
