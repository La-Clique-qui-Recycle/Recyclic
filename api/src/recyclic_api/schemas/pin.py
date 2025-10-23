from pydantic import BaseModel, field_validator
import re


class PinSetRequest(BaseModel):
    """Schéma pour la définition d'un PIN."""
    pin: str

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate that PIN is exactly 4 digits."""
        if not re.match(r'^\d{4}$', v):
            raise ValueError("PIN must be exactly 4 digits")
        return v


class PinAuthRequest(BaseModel):
    """Schéma pour l'authentification par PIN."""
    user_id: str
    pin: str

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate that PIN is exactly 4 digits."""
        if not re.match(r'^\d{4}$', v):
            raise ValueError("PIN must be exactly 4 digits")
        return v


class PinAuthResponse(BaseModel):
    """Schéma pour la réponse d'authentification par PIN."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str
