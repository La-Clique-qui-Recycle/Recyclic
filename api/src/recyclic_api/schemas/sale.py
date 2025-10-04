from pydantic import BaseModel, field_validator, ConfigDict
from uuid import UUID
from typing import List, Optional
from datetime import datetime

class SaleItemBase(BaseModel):
    category: str
    quantity: int  # Kept for backward compatibility
    weight: float  # Poids en kg avec décimales
    unit_price: float
    total_price: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(SaleItemBase):
    id: str
    sale_id: str

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', 'sale_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v

class SaleBase(BaseModel):
    cash_session_id: str
    total_amount: float

class SaleCreate(BaseModel):
    cash_session_id: UUID
    items: List[SaleItemCreate]
    total_amount: float

class SaleResponse(SaleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    items: List[SaleItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', 'cash_session_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v
