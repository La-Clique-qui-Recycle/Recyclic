from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from uuid import UUID
from recyclic_api.models.user import UserRole, UserStatus

class AdminUser(BaseModel):
    """Schéma pour les utilisateurs dans l'interface d'administration"""
    id: Union[str, UUID]
    telegram_id: Optional[Union[int, str]] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None  # Computed field
    email: Optional[str] = None
    role: UserRole
    status: UserStatus
    is_active: bool
    site_id: Optional[Union[str, UUID]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
    
    def model_post_init(self, __context) -> None:
        """Convertit les UUIDs en strings après validation"""
        if isinstance(self.id, UUID):
            self.id = str(self.id)
        if isinstance(self.site_id, UUID):
            self.site_id = str(self.site_id)
        # Normaliser telegram_id en chaîne pour cohérence d'API et compatibilité tests
        if self.telegram_id is not None:
            self.telegram_id = str(self.telegram_id)

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
    id: Union[str, UUID]
    telegram_id: Union[int, str]
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = {"from_attributes": True}
    
    def model_post_init(self, __context) -> None:
        """Convertit les UUIDs en strings après validation"""
        if isinstance(self.id, UUID):
            self.id = str(self.id)
        if isinstance(self.telegram_id, str):
            self.telegram_id = int(self.telegram_id)

class UserApprovalRequest(BaseModel):
    """Schéma pour l'approbation d'un utilisateur"""
    message: Optional[str] = Field(None, description="Message personnalisé pour l'utilisateur")

class UserRejectionRequest(BaseModel):
    """Schéma pour le rejet d'un utilisateur"""
    reason: Optional[str] = Field(None, description="Raison du rejet")

class UserStatusUpdate(BaseModel):
    """Schéma pour la modification du statut is_active d'un utilisateur"""
    is_active: bool = Field(..., description="Nouveau statut actif de l'utilisateur")
    reason: Optional[str] = Field(None, description="Raison du changement de statut")

class UserProfileUpdate(BaseModel):
    """Schéma pour la mise à jour du profil utilisateur"""
    first_name: Optional[str] = Field(None, description="Prénom de l'utilisateur")
    last_name: Optional[str] = Field(None, description="Nom de famille de l'utilisateur")
    username: Optional[str] = Field(None, description="Nom d'utilisateur")
    role: Optional[UserRole] = Field(None, description="Rôle de l'utilisateur")
    status: Optional[UserStatus] = Field(None, description="Statut de l'utilisateur")

class ActivityEvent(BaseModel):
    """Schéma pour un événement d'activité utilisateur"""
    id: Union[str, UUID]
    event_type: str = Field(..., description="Type d'événement (ADMINISTRATION, LOGIN, SESSION CAISSE, VENTE, DEPOT)")
    description: str = Field(..., description="Description de l'événement")
    date: datetime = Field(..., description="Date de l'événement")
    metadata: Optional[dict] = Field(None, description="Métadonnées supplémentaires de l'événement")
    
    model_config = {"from_attributes": True}
    
    def model_post_init(self, __context) -> None:
        """Convertit les UUIDs en strings après validation"""
        if isinstance(self.id, UUID):
            self.id = str(self.id)

class UserHistoryResponse(BaseModel):
    """Schéma pour la réponse de l'historique utilisateur"""
    user_id: Union[str, UUID]
    events: List[ActivityEvent]
    total_count: int = Field(..., description="Nombre total d'événements")
    page: int = Field(..., ge=1, description="Page actuelle")
    limit: int = Field(..., ge=1, le=100, description="Nombre d'éléments par page")
    has_next: bool = Field(..., description="Y a-t-il une page suivante")
    has_prev: bool = Field(..., description="Y a-t-il une page précédente")
    
    model_config = {"from_attributes": True}
    
    def model_post_init(self, __context) -> None:
        """Convertit les UUIDs en strings après validation"""
        if isinstance(self.user_id, UUID):
            self.user_id = str(self.user_id)
