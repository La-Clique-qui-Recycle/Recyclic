from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_role_strict
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.site import (
    SiteResponse,
    SiteCreate,
    SiteUpdate,
)
from recyclic_api.services.site_service import SiteService


router = APIRouter()


@router.get("/", response_model=List[SiteResponse], summary="Lister les sites")
async def list_sites(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    only_active: bool = Query(False, description="Ne retourner que les sites actifs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Lister tous les sites"""
    service = SiteService(db)
    return service.list(skip=skip, limit=limit, only_active=only_active)


@router.get("/{site_id}", response_model=SiteResponse, summary="Récupérer un site par ID")
async def get_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Récupérer un site par son ID"""
    service = SiteService(db)
    site = service.get(site_id=site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site introuvable")
    return site


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED, summary="Créer un site")
async def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Créer un nouveau site"""
    service = SiteService(db)
    return service.create(data=payload)


@router.patch("/{site_id}", response_model=SiteResponse, summary="Mettre à jour un site")
async def update_site(
    site_id: str,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Mettre à jour un site existant"""
    service = SiteService(db)
    site = service.get(site_id=site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site introuvable")
    return service.update(site=site, data=payload)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer un site")
async def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Supprimer un site"""
    service = SiteService(db)
    site = service.get(site_id=site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site introuvable")
    service.delete(site=site)
    return None
