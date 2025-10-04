from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from recyclic_api.core.database import get_db
from recyclic_api.models.setting import Setting
from recyclic_api.models.user import UserRole
from recyclic_api.schemas.setting import SettingResponse, SettingCreate, SettingUpdate
from recyclic_api.core.auth import require_role_strict

router = APIRouter()


@router.get("/", response_model=List[SettingResponse])
async def get_settings(
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Récupérer tous les paramètres (Admin seulement)."""
    settings = db.query(Setting).all()
    return settings


@router.get("/{key}", response_model=SettingResponse)
async def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Récupérer un paramètre par sa clé (Admin seulement)."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.post("/", response_model=SettingResponse)
async def create_setting(
    setting_data: SettingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Créer un nouveau paramètre (Admin seulement)."""
    # Vérifier si la clé existe déjà
    existing_setting = db.query(Setting).filter(Setting.key == setting_data.key).first()
    if existing_setting:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")

    db_setting = Setting(**setting_data.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    setting_update: SettingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Mettre à jour un paramètre existant (Admin seulement)."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    setting.value = setting_update.value
    db.commit()
    db.refresh(setting)
    return setting


@router.delete("/{key}")
async def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Supprimer un paramètre (Admin seulement)."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted successfully"}
