from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from recyclic_api.models.user import UserRole, UserStatus

class AdminUser(BaseModel):
    """Schéma pour les utilisateurs dans l'interface d'administration"""
    id: str
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None  # Computed field
    email: Optional[str] = None
    role: UserRole
    status: UserStatus
    is_active: bool
    site_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class UserRoleUpdate(BaseModel):
    """Schéma pour la modification du rôle d'un utilisateur"""
    role: UserRole = Field(..., description="Nouveau rôle à assigner à l'utilisateur")

class AdminUserList(BaseModel):
    """Schéma pour la réponse de la liste des utilisateurs avec pagination"""
    users: List[AdminUser]
    pagination: "PaginationInfo"

class PaginationInfo(BaseModel):
    """Schéma pour les informations de pagination"""
    page: int = Field(..., ge=1, description="Page actuelle")
    limit: int = Field(..., ge=1, le=100, description="Nombre d'éléments par page")
    total: int = Field(..., ge=0, description="Nombre total d'éléments")
    pages: int = Field(..., ge=0, description="Nombre total de pages")
    has_next: bool = Field(..., description="Y a-t-il une page suivante")
    has_prev: bool = Field(..., description="Y a-t-il une page précédente")

class AdminResponse(BaseModel):
    """Schéma de réponse standardisé pour les opérations d'administration"""
    data: Optional[dict] = None
    message: str
    success: bool = True

class AdminErrorResponse(BaseModel):
    """Schéma de réponse d'erreur pour les opérations d'administration"""
    message: str
    detail: Optional[str] = None
    success: bool = False

class PendingUserResponse(BaseModel):
    """Schéma pour la réponse des utilisateurs en attente"""
    id: str
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = {"from_attributes": True}

class UserApprovalRequest(BaseModel):
    """Schéma pour l'approbation d'un utilisateur"""
    message: Optional[str] = Field(None, description="Message personnalisé pour l'utilisateur")

class UserRejectionRequest(BaseModel):
    """Schéma pour le rejet d'un utilisateur"""
    reason: Optional[str] = Field(None, description="Raison du rejet")