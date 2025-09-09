from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from recyclic_api.models.sale import PaymentMethod

class SaleBase(BaseModel):
    cash_session_id: str
    deposit_id: str
    amount: float
    payment_method: PaymentMethod

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
