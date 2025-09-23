from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_role_strict
from recyclic_api.models.user import User, UserRole
from recyclic_api.models.cash_register import CashRegister
from recyclic_api.schemas.cash_register import (
    CashRegisterResponse,
    CashRegisterCreate,
    CashRegisterUpdate,
)
from recyclic_api.services.cash_register_service import CashRegisterService


router = APIRouter()


@router.get("/", response_model=List[CashRegisterResponse], summary="Lister les postes de caisse")
async def list_cash_registers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    site_id: Optional[str] = Query(None, description="Filtrer par site"),
    only_active: bool = Query(False, description="Ne retourner que les postes actifs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashRegisterService(db)
    return service.list(skip=skip, limit=limit, site_id=site_id, only_active=only_active)


@router.get("/{register_id}", response_model=CashRegisterResponse, summary="Récupérer un poste de caisse par ID")
async def get_cash_register(
    register_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.CASHIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashRegisterService(db)
    register = service.get(register_id=register_id)
    if not register:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste de caisse introuvable")
    return register


@router.post("/", response_model=CashRegisterResponse, status_code=status.HTTP_201_CREATED, summary="Créer un poste de caisse")
async def create_cash_register(
    payload: CashRegisterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashRegisterService(db)
    return service.create(data=payload)


@router.patch("/{register_id}", response_model=CashRegisterResponse, summary="Mettre à jour un poste de caisse")
async def update_cash_register(
    register_id: str,
    payload: CashRegisterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashRegisterService(db)
    register = service.get(register_id=register_id)
    if not register:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste de caisse introuvable")
    return service.update(register=register, data=payload)


@router.delete("/{register_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer un poste de caisse")
async def delete_cash_register(
    register_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashRegisterService(db)
    register = service.get(register_id=register_id)
    if not register:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste de caisse introuvable")
    service.delete(register=register)
    return None



