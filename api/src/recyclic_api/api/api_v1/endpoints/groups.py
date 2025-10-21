from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_admin_role
from recyclic_api.models.user import User
from recyclic_api.models.permission import Group, Permission
from recyclic_api.schemas.permission import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    AssignPermissionsToGroupRequest,
    AssignUsersToGroupRequest,
)

router = APIRouter(tags=["groups"])
logger = logging.getLogger(__name__)


# ============================================================================
# Group CRUD Endpoints
# ============================================================================

@router.get(
    "/",
    response_model=List[GroupResponse],
    summary="Liste des groupes",
    description="Récupère la liste de tous les groupes avec leurs utilisateurs et permissions"
)
def list_groups(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre d'éléments par page"),
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Liste tous les groupes."""
    try:
        # Load groups with their relationships using selectinload (anti N+1)
        stmt = (
            select(Group)
            .options(selectinload(Group.users), selectinload(Group.permissions))
            .offset(skip)
            .limit(limit)
        )
        result = db.execute(stmt)
        groups = result.scalars().all()

        # Convert to response schema
        response = []
        for group in groups:
            response.append(GroupResponse(
                id=str(group.id),
                name=group.name,
                description=group.description,
                created_at=group.created_at,
                updated_at=group.updated_at,
                user_ids=[str(user.id) for user in group.users],
                permission_ids=[str(perm.id) for perm in group.permissions]
            ))

        return response

    except Exception as e:
        logger.error(f"Error listing groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des groupes"
        )


@router.get(
    "/{group_id}",
    response_model=GroupDetailResponse,
    summary="Détails d'un groupe",
    description="Récupère les détails complets d'un groupe incluant les objets utilisateurs et permissions"
)
def get_group(
    group_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Récupère les détails d'un groupe spécifique."""
    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de groupe invalide"
        )

    # Load group with relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    return GroupDetailResponse.model_validate(group)


@router.post(
    "/",
    response_model=GroupDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un groupe",
    description="Crée un nouveau groupe"
)
def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Crée un nouveau groupe."""
    # Check if group name already exists
    existing_group = db.execute(
        select(Group).where(Group.name == group_data.name)
    ).scalar_one_or_none()

    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un groupe avec le nom '{group_data.name}' existe déjà"
        )

    # Create new group
    new_group = Group(
        name=group_data.name,
        description=group_data.description
    )

    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # Load relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == new_group.id)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Group '{new_group.name}' created by user {current_user.id}")
    return GroupDetailResponse.model_validate(group)


@router.put(
    "/{group_id}",
    response_model=GroupDetailResponse,
    summary="Mettre à jour un groupe",
    description="Met à jour les informations d'un groupe"
)
def update_group(
    group_id: str,
    group_data: GroupUpdate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met à jour un groupe."""
    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de groupe invalide"
        )

    # Find group
    group = db.execute(
        select(Group).where(Group.id == group_uuid)
    ).scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    # Check if new name conflicts with existing group
    if group_data.name and group_data.name != group.name:
        existing = db.execute(
            select(Group).where(Group.name == group_data.name)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Un groupe avec le nom '{group_data.name}' existe déjà"
            )

    # Update fields
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description

    db.commit()
    db.refresh(group)

    # Reload with relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Group {group_id} updated by user {current_user.id}")
    return GroupDetailResponse.model_validate(group)


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un groupe",
    description="Supprime un groupe (les utilisateurs et permissions ne sont pas supprimés)"
)
def delete_group(
    group_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Supprime un groupe."""
    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de groupe invalide"
        )

    group = db.execute(
        select(Group).where(Group.id == group_uuid)
    ).scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    db.delete(group)
    db.commit()

    logger.info(f"Group {group_id} deleted by user {current_user.id}")
    return None


# ============================================================================
# Group Permissions Management
# ============================================================================

@router.post(
    "/{group_id}/permissions",
    response_model=GroupDetailResponse,
    summary="Assigner des permissions à un groupe",
    description="Ajoute une ou plusieurs permissions à un groupe"
)
def assign_permissions_to_group(
    group_id: str,
    request: AssignPermissionsToGroupRequest,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Assigne des permissions à un groupe."""
    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de groupe invalide"
        )

    # Load group with permissions
    stmt = (
        select(Group)
        .options(selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    # Validate and load permissions
    permissions_to_add = []
    for perm_id in request.permission_ids:
        try:
            perm_uuid = UUID(perm_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID de permission invalide: {perm_id}"
            )

        permission = db.execute(
            select(Permission).where(Permission.id == perm_uuid)
        ).scalar_one_or_none()

        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission non trouvée: {perm_id}"
            )

        # Only add if not already assigned
        if permission not in group.permissions:
            permissions_to_add.append(permission)

    # Add permissions to group
    group.permissions.extend(permissions_to_add)
    db.commit()

    # Reload with all relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Assigned {len(permissions_to_add)} permissions to group {group_id}")
    return GroupDetailResponse.model_validate(group)


@router.delete(
    "/{group_id}/permissions/{permission_id}",
    response_model=GroupDetailResponse,
    summary="Retirer une permission d'un groupe",
    description="Retire une permission d'un groupe"
)
def remove_permission_from_group(
    group_id: str,
    permission_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Retire une permission d'un groupe."""
    try:
        group_uuid = UUID(group_id)
        perm_uuid = UUID(permission_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID invalide"
        )

    # Load group with permissions
    stmt = (
        select(Group)
        .options(selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    # Find permission in group
    permission = next((p for p in group.permissions if p.id == perm_uuid), None)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission non trouvée dans ce groupe"
        )

    group.permissions.remove(permission)
    db.commit()

    # Reload with all relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Removed permission {permission_id} from group {group_id}")
    return GroupDetailResponse.model_validate(group)


# ============================================================================
# Group Users Management
# ============================================================================

@router.post(
    "/{group_id}/users",
    response_model=GroupDetailResponse,
    summary="Assigner des utilisateurs à un groupe",
    description="Ajoute un ou plusieurs utilisateurs à un groupe"
)
def assign_users_to_group(
    group_id: str,
    request: AssignUsersToGroupRequest,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Assigne des utilisateurs à un groupe."""
    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de groupe invalide"
        )

    # Load group with users
    stmt = (
        select(Group)
        .options(selectinload(Group.users))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    # Validate and load users
    users_to_add = []
    for user_id in request.user_ids:
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID utilisateur invalide: {user_id}"
            )

        user = db.execute(
            select(User).where(User.id == user_uuid)
        ).scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Utilisateur non trouvé: {user_id}"
            )

        # Only add if not already in group
        if user not in group.users:
            users_to_add.append(user)

    # Add users to group
    group.users.extend(users_to_add)
    db.commit()

    # Reload with all relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Assigned {len(users_to_add)} users to group {group_id}")
    return GroupDetailResponse.model_validate(group)


@router.delete(
    "/{group_id}/users/{user_id}",
    response_model=GroupDetailResponse,
    summary="Retirer un utilisateur d'un groupe",
    description="Retire un utilisateur d'un groupe"
)
def remove_user_from_group(
    group_id: str,
    user_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Retire un utilisateur d'un groupe."""
    try:
        group_uuid = UUID(group_id)
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID invalide"
        )

    # Load group with users
    stmt = (
        select(Group)
        .options(selectinload(Group.users))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Groupe non trouvé"
        )

    # Find user in group
    user = next((u for u in group.users if u.id == user_uuid), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé dans ce groupe"
        )

    group.users.remove(user)
    db.commit()

    # Reload with all relationships
    stmt = (
        select(Group)
        .options(selectinload(Group.users), selectinload(Group.permissions))
        .where(Group.id == group_uuid)
    )
    result = db.execute(stmt)
    group = result.scalar_one()

    logger.info(f"Removed user {user_id} from group {group_id}")
    return GroupDetailResponse.model_validate(group)
