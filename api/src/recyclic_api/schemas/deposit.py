from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any, Union, List, Dict
from datetime import datetime
from recyclic_api.models.deposit import EEECategory, DepositStatus
import uuid

class DepositBase(BaseModel):
    user_id: str
    site_id: Optional[str] = None  # Made optional for telegram deposits
    telegram_user_id: Optional[str] = None
    audio_file_path: Optional[str] = None
    status: Optional[DepositStatus] = DepositStatus.PENDING_AUDIO
    category: Optional[EEECategory] = None  # Made optional initially
    weight: Optional[float] = None
    description: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_confidence: Optional[float] = None
    # Story 4.2 fields - AI classification
    transcription: Optional[str] = None
    eee_category: Optional[EEECategory] = None
    confidence_score: Optional[float] = None
    alternative_categories: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None

class DepositCreate(DepositBase):
    pass

class DepositCreateFromBot(BaseModel):
    """Schema for creating deposits from Telegram bot"""
    telegram_user_id: str
    audio_file_path: str
    status: DepositStatus = DepositStatus.PENDING_AUDIO

class DepositFinalize(BaseModel):
    """Schema for finalizing deposits after validation/correction"""
    final_category: Optional[EEECategory] = None
    correction_applied: bool = False
    validated: bool = False

class DepositResponse(DepositBase):
    id: str = Field(..., description="Deposit ID")
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

    @field_validator('id', 'user_id', 'site_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> str:
        """Convert UUID objects to strings"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
