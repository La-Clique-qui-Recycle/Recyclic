from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SiteBase(BaseModel):
    name: str
    address: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    is_active: bool = True

class SiteCreate(SiteBase):
    pass

class SiteResponse(SiteBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
