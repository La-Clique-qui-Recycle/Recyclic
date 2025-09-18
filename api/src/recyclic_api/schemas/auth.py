from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr


class LoginRequest(BaseModel):
    """Schéma de requête pour la connexion via nom d'utilisateur et mot de passe."""

    username: str = Field(..., description="Nom d'utilisateur")
    password: str = Field(..., description="Mot de passe")


class SignupRequest(BaseModel):
    """Schéma de requête pour l'inscription d'un nouvel utilisateur."""

    username: str = Field(..., description="Nom d'utilisateur", min_length=3, max_length=50)
    password: str = Field(..., description="Mot de passe", min_length=8)
    email: Optional[str] = Field(None, description="Adresse email (optionnelle)")


class AuthUser(BaseModel):
    """Représentation de l'utilisateur retournée après authentification."""

    id: str
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    status: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class LoginResponse(BaseModel):
    """Réponse d'authentification contenant le token et l'utilisateur."""

    access_token: str = Field(..., description="JWT d'accès")
    token_type: str = Field("bearer", description="Type de token")
    user: AuthUser


class SignupResponse(BaseModel):
    """Réponse d'inscription d'un nouvel utilisateur."""

    message: str = Field(..., description="Message de confirmation")
    user_id: str = Field(..., description="ID de l'utilisateur créé")
    status: str = Field(..., description="Statut du compte")


class ForgotPasswordRequest(BaseModel):
    """Schéma de requête pour demander la réinitialisation du mot de passe."""

    email: EmailStr = Field(..., description="Adresse email de l'utilisateur")


class ForgotPasswordResponse(BaseModel):
    """Réponse pour la demande de réinitialisation du mot de passe."""

    message: str = Field(..., description="Message de confirmation")


class ResetPasswordRequest(BaseModel):
    """Schéma de requête pour réinitialiser le mot de passe."""

    token: str = Field(..., description="Token de réinitialisation")
    new_password: str = Field(..., description="Nouveau mot de passe")


class ResetPasswordResponse(BaseModel):
    """Réponse pour la réinitialisation du mot de passe."""

    message: str = Field(..., description="Message de confirmation")


