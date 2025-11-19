from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from fastapi import HTTPException

from ..models.preset_button import PresetButton, ButtonType
from ..models.category import Category
from ..schemas.preset_button import (
    PresetButtonCreate,
    PresetButtonUpdate,
    PresetButtonRead,
    PresetButtonWithCategory
)
from .category_service import CategoryService


class PresetManagementService:
    """Service for preset button management operations"""

    def __init__(self, db: Session):
        self.db = db
        self.category_service = CategoryService(db)

    async def create_preset_button(self, preset_data: PresetButtonCreate) -> PresetButtonRead:
        """Create a new preset button with category validation"""

        # Validate category exists and is active
        category = await self._validate_category(preset_data.category_id)
        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Category with ID '{preset_data.category_id}' not found or inactive"
            )

        # Create new preset button
        new_preset = PresetButton(
            name=preset_data.name,
            category_id=UUID(preset_data.category_id),
            preset_price=preset_data.preset_price,
            button_type=preset_data.button_type,
            sort_order=preset_data.sort_order,
            is_active=True
        )

        self.db.add(new_preset)

        try:
            self.db.commit()
            self.db.refresh(new_preset)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Failed to create preset button")

        return PresetButtonRead.model_validate(new_preset)

    async def get_preset_buttons(
        self,
        category_id: Optional[str] = None,
        button_type: Optional[ButtonType] = None,
        is_active: Optional[bool] = None
    ) -> List[PresetButtonWithCategory]:
        """Get all preset buttons, optionally filtered by category, type, or active status"""

        query = self.db.query(PresetButton).options(
            joinedload(PresetButton.category)
        )

        if category_id:
            try:
                cat_uuid = UUID(category_id)
                query = query.filter(PresetButton.category_id == cat_uuid)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid category_id format: '{category_id}'")

        if button_type:
            query = query.filter(PresetButton.button_type == button_type)

        if is_active is not None:
            query = query.filter(PresetButton.is_active == is_active)

        query = query.order_by(PresetButton.sort_order, PresetButton.name)
        presets = query.all()

        # Convert to response with category names
        result = []
        for preset in presets:
            preset_dict = PresetButtonRead.model_validate(preset).model_dump()
            preset_dict['category_name'] = preset.category.name if preset.category else 'Unknown'
            result.append(PresetButtonWithCategory(**preset_dict))

        return result

    def get_preset_button_by_id(self, preset_id: str) -> Optional[PresetButtonWithCategory]:
        """Get a single preset button by ID"""

        try:
            preset_uuid = UUID(preset_id)
        except ValueError:
            return None

        preset = self.db.query(PresetButton).options(
            joinedload(PresetButton.category)
        ).filter(PresetButton.id == preset_uuid).first()

        if not preset:
            return None

        preset_dict = PresetButtonRead.model_validate(preset).model_dump()
        preset_dict['category_name'] = preset.category.name if preset.category else 'Unknown'
        return PresetButtonWithCategory(**preset_dict)

    async def update_preset_button(
        self,
        preset_id: str,
        preset_data: PresetButtonUpdate
    ) -> Optional[PresetButtonRead]:
        """Update a preset button"""

        try:
            preset_uuid = UUID(preset_id)
        except ValueError:
            return None

        # Check if preset exists
        preset = self.db.query(PresetButton).filter(PresetButton.id == preset_uuid).first()
        if not preset:
            return None

        # Validate category if being updated
        if preset_data.category_id:
            category = await self._validate_category(preset_data.category_id)
            if not category:
                raise HTTPException(
                    status_code=400,
                    detail=f"Category with ID '{preset_data.category_id}' not found or inactive"
                )

        # Update fields
        update_data = preset_data.model_dump(exclude_unset=True)
        if update_data:
            for key, value in update_data.items():
                if key == 'category_id' and value:
                    setattr(preset, key, UUID(value))
                else:
                    setattr(preset, key, value)

            try:
                self.db.commit()
                self.db.refresh(preset)
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(status_code=400, detail="Failed to update preset button")

        return PresetButtonRead.model_validate(preset)

    async def delete_preset_button(self, preset_id: str) -> bool:
        """Soft delete a preset button by setting is_active to False"""

        try:
            preset_uuid = UUID(preset_id)
        except ValueError:
            return False

        # Check if preset exists
        preset = self.db.query(PresetButton).filter(PresetButton.id == preset_uuid).first()
        if not preset:
            return False

        # Soft delete
        preset.is_active = False
        self.db.commit()
        self.db.refresh(preset)

        return True

    async def get_active_preset_buttons(self) -> List[PresetButtonWithCategory]:
        """Get all active preset buttons for use in the interface"""
        return await self.get_preset_buttons(is_active=True)

    async def _validate_category(self, category_id: str) -> Optional[Category]:
        """Validate that a category exists and is active"""
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return None

        category = self.db.query(Category).filter(
            Category.id == cat_uuid,
            Category.is_active == True
        ).first()

        return category
