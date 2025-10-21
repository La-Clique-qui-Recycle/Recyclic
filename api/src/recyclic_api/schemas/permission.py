from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Permission Schemas
# ============================================================================

class PermissionBase(BaseModel):
    """Base schema for Permission with common fields."""
    name: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    """Schema for creating a new permission."""
    pass


class PermissionUpdate(BaseModel):
    """Schema for updating an existing permission.

    All fields are optional for partial updates.
    """
    name: Optional[str] = None
    description: Optional[str] = None


class PermissionResponse(PermissionBase):
    """Schema for permission responses from the API."""
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v


# ============================================================================
# Group Schemas
# ============================================================================

class GroupBase(BaseModel):
    """Base schema for Group with common fields."""
    name: str
    description: Optional[str] = None


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupUpdate(BaseModel):
    """Schema for updating an existing group.

    All fields are optional for partial updates.
    """
    name: Optional[str] = None
    description: Optional[str] = None


class GroupResponse(GroupBase):
    """Schema for group responses from the API.

    Includes basic group info plus lists of user IDs and permission IDs.
    """
    id: str
    created_at: datetime
    updated_at: datetime
    user_ids: List[str] = []
    permission_ids: List[str] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v


class GroupDetailResponse(GroupBase):
    """Detailed schema for group responses including full user and permission objects."""
    id: str
    created_at: datetime
    updated_at: datetime
    users: List['UserResponse'] = []
    permissions: List[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def _uuid_to_str(cls, v):
        return str(v) if v is not None else v


# ============================================================================
# Assignment Schemas
# ============================================================================

class AssignPermissionsToGroupRequest(BaseModel):
    """Schema for assigning multiple permissions to a group."""
    permission_ids: List[str]


class AssignUsersToGroupRequest(BaseModel):
    """Schema for assigning multiple users to a group."""
    user_ids: List[str]


class RemovePermissionFromGroupRequest(BaseModel):
    """Schema for removing a permission from a group."""
    permission_id: str


class RemoveUserFromGroupRequest(BaseModel):
    """Schema for removing a user from a group."""
    user_id: str


# Avoid circular imports - import UserResponse at the end
from recyclic_api.schemas.user import UserResponse
GroupDetailResponse.model_rebuild()
