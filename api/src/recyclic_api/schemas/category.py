from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    parent_id: Optional[str] = None
    price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    display_order: Optional[int] = 0
    is_visible: Optional[bool] = True
    shortcut_key: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    parent_id: Optional[str] = None
    price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    display_order: Optional[int] = None
    is_visible: Optional[bool] = None
    shortcut_key: Optional[str] = None


class CategoryRead(CategoryBase):
    id: str
    is_active: bool
    parent_id: Optional[str] = None
    price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    display_order: int
    is_visible: bool
    shortcut_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v

    @field_validator('parent_id', mode='before')
    @classmethod
    def _parent_uuid_to_str(cls, v):
        return str(v) if v is not None else v


class CategoryWithChildren(CategoryRead):
    children: List['CategoryWithChildren'] = []

    model_config = ConfigDict(from_attributes=True)


class CategoryImportAnalyzeResponse(BaseModel):
    session_id: Optional[str]
    summary: dict
    sample: List[dict]
    errors: List[str]


class CategoryImportExecuteRequest(BaseModel):
    session_id: str
    delete_existing: bool = False