from pydantic import BaseModel, field_validator, ConfigDict
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from recyclic_api.models.sale import PaymentMethod

class SaleItemBase(BaseModel):
    category: str
    quantity: int  # Kept for backward compatibility
    weight: float  # Poids en kg avec décimales
    unit_price: float
    total_price: float
    # Story 1.1.2: Champs ajoutés pour preset et notes par item
    preset_id: Optional[UUID] = None
    notes: Optional[str] = None

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(SaleItemBase):
    id: str
    sale_id: str

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', 'sale_id', 'preset_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v

class SaleBase(BaseModel):
    cash_session_id: str
    total_amount: float
    donation: Optional[float] = 0.0
    payment_method: Optional[PaymentMethod] = PaymentMethod.CASH
    # Story 1.1.2: notes et preset_id déplacés vers sale_items (par item individuel)

    @field_validator('cash_session_id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v

class SaleCreate(BaseModel):
    cash_session_id: UUID
    items: List[SaleItemCreate]
    total_amount: float
    donation: Optional[float] = 0.0
    payment_method: Optional[PaymentMethod] = PaymentMethod.CASH
    # Story 1.1.2: notes et preset_id déplacés vers sale_items (par item individuel)

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
