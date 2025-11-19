from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from recyclic_api.core.database import get_db
from recyclic_api.services.preset_management import PresetManagementService
from recyclic_api.schemas.preset_button import (
    PresetButtonRead,
    PresetButtonWithCategory,
    ButtonType
)

router = APIRouter()


@router.get("/", response_model=List[PresetButtonWithCategory])
async def get_preset_buttons(
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    button_type: Optional[ButtonType] = Query(None, description="Filter by button type"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """
    Get all preset buttons with optional filtering.

    Returns preset buttons with category information.
    """
    service = PresetManagementService(db)
    return await service.get_preset_buttons(
        category_id=category_id,
        button_type=button_type,
        is_active=is_active
    )


@router.get("/active", response_model=List[PresetButtonWithCategory])
async def get_active_preset_buttons(db: Session = Depends(get_db)):
    """
    Get all active preset buttons for use in the interface.

    Optimized endpoint for frontend consumption.
    """
    service = PresetManagementService(db)
    return await service.get_active_preset_buttons()


@router.get("/{preset_id}", response_model=PresetButtonWithCategory)
async def get_preset_button(preset_id: str, db: Session = Depends(get_db)):
    """
    Get a specific preset button by ID.
    """
    service = PresetManagementService(db)
    preset = await service.get_preset_button_by_id(preset_id)

    if not preset:
        raise HTTPException(status_code=404, detail="Preset button not found")

    return preset
