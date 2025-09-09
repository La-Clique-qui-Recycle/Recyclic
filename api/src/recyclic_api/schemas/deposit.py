from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from recyclic_api.models.deposit import EEECategory

class DepositBase(BaseModel):
    user_id: str
    site_id: str
    category: EEECategory
    weight: Optional[float] = None
    description: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_confidence: Optional[float] = None

class DepositCreate(DepositBase):
    pass

class DepositResponse(DepositBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
