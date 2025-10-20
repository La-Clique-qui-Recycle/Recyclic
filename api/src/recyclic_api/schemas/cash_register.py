from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional


class CashRegisterBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=100, description="Nom du poste de caisse")
    location: Optional[str] = Field(None, max_length=255, description="Localisation du poste")
    site_id: Optional[str] = Field(None, description="ID du site")
    is_active: bool = Field(default=True, description="Poste actif")

    @field_validator('site_id', mode='before')
    @classmethod
    def _validate_site_id(cls, v):
        """Validate site_id: reject empty strings, convert UUID to str."""
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            if not v:  # Empty string after stripping
                raise ValueError("site_id ne peut pas être une chaîne vide")
        if hasattr(v, '__str__'):
            return str(v)
        return v


class CashRegisterCreate(CashRegisterBase):
    pass


class CashRegisterUpdate(BaseModel):
    """Schéma de mise à jour partielle d'un poste de caisse."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    site_id: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)

    @field_validator("site_id", mode="before")
    @classmethod
    def _validate_site_id(cls, v):
        """Validate site_id: reject empty strings, convert UUID to str."""
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            if not v:  # Empty string after stripping
                raise ValueError("site_id ne peut pas être une chaîne vide")
        if hasattr(v, "__str__"):
            return str(v)
        return v


class CashRegisterResponse(CashRegisterBase):
    id: str = Field(..., description="ID du poste de caisse")

    @field_validator('id', mode='before')
    @classmethod
    def _id_uuid_to_str(cls, v):
        if hasattr(v, '__str__'):
            return str(v)
        return v



