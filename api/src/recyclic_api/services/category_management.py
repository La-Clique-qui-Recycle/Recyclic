"""Service for category visibility and display management (Story 1.2)."""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from uuid import UUID
from fastapi import HTTPException

from ..models.category import Category
from ..schemas.category import CategoryRead
from .category_service import CategoryService


class CategoryManagementService:
    """Service for managing category visibility and display order"""
    
    def __init__(self, db: Session):
        self.db = db
        self.category_service = CategoryService(db)
    
    async def get_visible_categories(
        self, 
        is_active: Optional[bool] = True,
        for_entry_tickets: bool = True
    ) -> List[CategoryRead]:
        """
        Get categories filtered by visibility.
        
        Args:
            is_active: Filter by active status (default: True)
            for_entry_tickets: If True, filter by is_visible. If False, return all categories.
        
        Returns:
            List of visible categories ordered by display_order, then name
        """
        query = self.db.query(Category)
        
        if is_active is not None:
            query = query.filter(Category.is_active == is_active)
        
        # CRITICAL SCOPE: Only apply visibility filter for ENTRY tickets
        # SALE/CASH REGISTER tickets must display ALL categories
        if for_entry_tickets:
            query = query.filter(Category.is_visible == True)
        
        # Order by display_order first, then name
        query = query.order_by(Category.display_order, Category.name)
        
        categories = query.all()
        return [CategoryRead.model_validate(cat) for cat in categories]
    
    async def update_category_visibility(
        self, 
        category_id: str, 
        is_visible: bool
    ) -> CategoryRead:
        """
        Update category visibility.
        
        Args:
            category_id: Category ID
            is_visible: New visibility status
        
        Returns:
            Updated category
        
        Raises:
            HTTPException: If category not found or constraint violation
        """
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category ID format: '{category_id}'")
        
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()
        
        if not category:
            raise HTTPException(status_code=404, detail=f"Category with ID '{category_id}' not found")
        
        # Validation: At least one category must remain visible
        if not is_visible:
            visible_count = self.db.query(Category).filter(
                and_(
                    Category.is_visible == True,
                    Category.is_active == True,
                    Category.id != cat_uuid  # Exclude current category
                )
            ).count()
            
            if visible_count == 0:
                raise HTTPException(
                    status_code=422,
                    detail="Cannot hide category: at least one category must remain visible"
                )
        
        # Update visibility
        category.is_visible = is_visible
        self.db.commit()
        self.db.refresh(category)
        
        return CategoryRead.model_validate(category)
    
    async def update_display_order(
        self, 
        category_id: str, 
        display_order: int
    ) -> CategoryRead:
        """
        Update category display order.
        
        Args:
            category_id: Category ID
            display_order: New display order value
        
        Returns:
            Updated category
        
        Raises:
            HTTPException: If category not found
        """
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category ID format: '{category_id}'")
        
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()
        
        if not category:
            raise HTTPException(status_code=404, detail=f"Category with ID '{category_id}' not found")
        
        # Update display order
        category.display_order = display_order
        self.db.commit()
        self.db.refresh(category)
        
        return CategoryRead.model_validate(category)
    
    async def get_categories_for_entry_tickets(
        self,
        is_active: Optional[bool] = True
    ) -> List[CategoryRead]:
        """
        Get categories filtered for ENTRY tickets (respects visibility settings).
        
        This is the main method to use when displaying categories in ENTRY/DEPOT tickets.
        """
        return await self.get_visible_categories(is_active=is_active, for_entry_tickets=True)
    
    async def get_categories_for_sale_tickets(
        self,
        is_active: Optional[bool] = True
    ) -> List[CategoryRead]:
        """
        Get categories for SALE/CASH REGISTER tickets (always shows ALL categories).
        
        This method ignores visibility settings as per story requirements.
        """
        return await self.get_visible_categories(is_active=is_active, for_entry_tickets=False)
    
    async def get_category_hierarchy_with_visibility(
        self,
        for_entry_tickets: bool = True,
        is_active: Optional[bool] = True
    ) -> List[CategoryRead]:
        """
        Get category hierarchy respecting visibility settings.
        
        If a parent category has all children hidden, the parent itself should be
        selectable (AC 1.2.2).
        """
        # Get all categories
        all_categories = await self.category_service.get_categories(is_active=is_active)
        
        if not for_entry_tickets:
            # For sale tickets, return all categories
            return all_categories
        
        # For entry tickets, filter by visibility
        visible_categories = await self.get_visible_categories(
            is_active=is_active,
            for_entry_tickets=True
        )
        
        visible_ids = {cat.id for cat in visible_categories}
        
        # Build result: include visible categories + parents of visible categories
        result_ids = set(visible_ids)
        
        # Add parents of visible categories
        for cat in visible_categories:
            parent_id = cat.parent_id
            while parent_id:
                if parent_id not in result_ids:
                    # Find parent category
                    parent_cat = next((c for c in all_categories if c.id == parent_id), None)
                    if parent_cat:
                        result_ids.add(parent_id)
                        parent_id = parent_cat.parent_id
                    else:
                        break
                else:
                    break
        
        # Return filtered and ordered categories
        result = [cat for cat in all_categories if cat.id in result_ids]
        result.sort(key=lambda x: (x.display_order, x.name))
        
        return result

