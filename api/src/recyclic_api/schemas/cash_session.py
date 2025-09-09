from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from recyclic_api.models.cash_session import SessionStatus

class CashSessionBase(BaseModel):
    user_id: str
    site_id: str
    status: SessionStatus = SessionStatus.OPEN
    total_amount: float = 0.0

class CashSessionCreate(CashSessionBase):
    pass

class CashSessionResponse(CashSessionBase):
    id: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
