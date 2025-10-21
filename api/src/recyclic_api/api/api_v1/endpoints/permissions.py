from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_admin_role
from recyclic_api.models.user import User
from recyclic_api.models.permission import Permission
from recyclic_api.schemas.permission import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
)

router = APIRouter(tags=["permissions"])
logger = logging.getLogger(__name__)


# ============================================================================
# Permission CRUD Endpoints
# ============================================================================

@router.get(
    "/",
    response_model=List[PermissionResponse],
    summary="Liste des permissions",
    description="Récupère la liste de toutes les permissions disponibles"
)
def list_permissions(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre d'éléments par page"),
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Liste toutes les permissions."""
    try:
        stmt = select(Permission).offset(skip).limit(limit)
        result = db.execute(stmt)
        permissions = result.scalars().all()

        return [PermissionResponse.model_validate(perm) for perm in permissions]

    except Exception as e:
        logger.error(f"Error listing permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des permissions"
        )


@router.get(
    "/{permission_id}",
    response_model=PermissionResponse,
    summary="Détails d'une permission",
    description="Récupère les détails d'une permission spécifique"
)
def get_permission(
    permission_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Récupère une permission par son ID."""
    try:
        permission_uuid = UUID(permission_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de permission invalide"
        )

    stmt = select(Permission).where(Permission.id == permission_uuid)
    result = db.execute(stmt)
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission non trouvée"
        )

    return PermissionResponse.model_validate(permission)


@router.post(
    "/",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une permission",
    description="Crée une nouvelle permission"
)
def create_permission(
    permission_data: PermissionCreate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle permission."""
    # Check if permission name already exists
    existing = db.execute(
        select(Permission).where(Permission.name == permission_data.name)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Une permission avec le nom '{permission_data.name}' existe déjà"
        )

    # Create new permission
    new_permission = Permission(
        name=permission_data.name,
        description=permission_data.description
    )

    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)

    logger.info(f"Permission '{new_permission.name}' created by user {current_user.id}")
    return PermissionResponse.model_validate(new_permission)


@router.put(
    "/{permission_id}",
    response_model=PermissionResponse,
    summary="Mettre à jour une permission",
    description="Met à jour les informations d'une permission"
)
def update_permission(
    permission_id: str,
    permission_data: PermissionUpdate,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Met à jour une permission."""
    try:
        permission_uuid = UUID(permission_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de permission invalide"
        )

    # Find permission
    stmt = select(Permission).where(Permission.id == permission_uuid)
    result = db.execute(stmt)
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission non trouvée"
        )

    # Check if new name conflicts with existing permission
    if permission_data.name and permission_data.name != permission.name:
        existing = db.execute(
            select(Permission).where(Permission.name == permission_data.name)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Une permission avec le nom '{permission_data.name}' existe déjà"
            )

    # Update fields
    if permission_data.name is not None:
        permission.name = permission_data.name
    if permission_data.description is not None:
        permission.description = permission_data.description

    db.commit()
    db.refresh(permission)

    logger.info(f"Permission {permission_id} updated by user {current_user.id}")
    return PermissionResponse.model_validate(permission)


@router.delete(
    "/{permission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une permission",
    description="Supprime une permission (sera retirée de tous les groupes qui l'ont)"
)
def delete_permission(
    permission_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Supprime une permission."""
    try:
        permission_uuid = UUID(permission_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de permission invalide"
        )

    stmt = select(Permission).where(Permission.id == permission_uuid)
    result = db.execute(stmt)
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission non trouvée"
        )

    db.delete(permission)
    db.commit()

    logger.info(f"Permission {permission_id} deleted by user {current_user.id}")
    return None
