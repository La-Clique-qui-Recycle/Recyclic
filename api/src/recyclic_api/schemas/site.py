from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

class SiteBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255, description="Nom du site")
    address: Optional[str] = Field(None, max_length=500, description="Adresse du site")
    city: Optional[str] = Field(None, max_length=100, description="Ville")
    postal_code: Optional[str] = Field(None, max_length=20, description="Code postal")
    country: Optional[str] = Field(None, max_length=100, description="Pays")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Configuration JSONB")
    is_active: bool = Field(default=True, description="Site actif")

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    """Schéma de mise à jour partielle d'un site."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    configuration: Optional[Dict[str, Any]] = Field(None)
    is_active: Optional[bool] = Field(None)

class SiteResponse(SiteBase):
    id: str = Field(..., description="ID du site")
    created_at: datetime
    updated_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def _id_uuid_to_str(cls, v):
        if hasattr(v, '__str__'):
            return str(v)
        return v
