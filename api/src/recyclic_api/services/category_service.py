from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from fastapi import HTTPException

from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryUpdate, CategoryRead, CategoryWithChildren


class CategoryService:
    """Service for category management operations"""
    
    MAX_HIERARCHY_DEPTH = 5  # Maximum depth for category hierarchy

    def __init__(self, db: Session):
        self.db = db

    def _get_hierarchy_depth(self, category_id: UUID) -> int:
        """Calculate the depth of a category in the hierarchy (1-based)"""
        depth = 1  # Start at 1 for the category itself
        current_id = category_id
        
        while current_id:
            category = self.db.query(Category).filter(Category.id == current_id).first()
            if not category or not category.parent_id:
                break
            current_id = category.parent_id
            depth += 1
            
            # Safety check to prevent infinite loops
            if depth > self.MAX_HIERARCHY_DEPTH + 1:
                break
                
        return depth

    async def create_category(self, category_data: CategoryCreate) -> CategoryRead:
        """Create a new category with unique name validation and optional parent"""

        # Check if category name already exists
        existing = self.db.query(Category).filter(Category.name == category_data.name).first()

        if existing:
            raise HTTPException(status_code=400, detail=f"Category with name '{category_data.name}' already exists")

        # Validate price fields: prices can only be set on subcategories (with parent_id)
        has_price_fields = any([
            category_data.price is not None,
            category_data.min_price is not None,
            category_data.max_price is not None
        ])

        if has_price_fields and not category_data.parent_id:
            raise HTTPException(
                status_code=422,
                detail="Price fields can only be set on subcategories (categories with a parent_id)"
            )

        # Validate parent_id if provided
        parent_id = None
        if category_data.parent_id:
            try:
                parent_id = UUID(category_data.parent_id)
                # Check if parent exists and is active
                parent = self.db.query(Category).filter(
                    Category.id == parent_id,
                    Category.is_active == True
                ).first()
                if not parent:
                    raise HTTPException(status_code=400, detail=f"Parent category with ID '{category_data.parent_id}' not found or inactive")

                # Check hierarchy depth
                parent_depth = self._get_hierarchy_depth(parent_id)
                if parent_depth >= self.MAX_HIERARCHY_DEPTH:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot create category: maximum hierarchy depth of {self.MAX_HIERARCHY_DEPTH} levels exceeded"
                    )
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid parent_id format: '{category_data.parent_id}'")

        # Create new category
        new_category = Category(
            name=category_data.name,
            is_active=True,
            parent_id=parent_id,
            price=category_data.price,
            min_price=category_data.min_price,
            max_price=category_data.max_price
        )

        self.db.add(new_category)

        try:
            self.db.commit()
            self.db.refresh(new_category)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Category with name '{category_data.name}' already exists")

        return CategoryRead.model_validate(new_category)

    async def get_categories(self, is_active: Optional[bool] = None) -> List[CategoryRead]:
        """Get all categories, optionally filtered by active status"""

        query = self.db.query(Category)

        if is_active is not None:
            query = query.filter(Category.is_active == is_active)

        query = query.order_by(Category.name)
        categories = query.all()

        return [CategoryRead.model_validate(cat) for cat in categories]

    async def get_category_by_id(self, category_id: str) -> Optional[CategoryRead]:
        """Get a single category by ID"""

        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return None

        category = self.db.query(Category).filter(Category.id == cat_uuid).first()

        if not category:
            return None

        return CategoryRead.model_validate(category)

    async def update_category(self, category_id: str, category_data: CategoryUpdate) -> Optional[CategoryRead]:
        """Update a category"""

        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return None

        # Check if category exists
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()

        if not category:
            return None

        # Check for duplicate name if name is being updated
        if category_data.name and category_data.name != category.name:
            existing = self.db.query(Category).filter(Category.name == category_data.name).first()

            if existing:
                raise HTTPException(status_code=400, detail=f"Category with name '{category_data.name}' already exists")

        # Determine final parent_id value for validation
        # We need to check if parent_id was provided in the update, even if it's None
        update_data_dict = category_data.model_dump(exclude_unset=True)
        parent_id_provided = 'parent_id' in update_data_dict

        final_parent_id = category.parent_id  # Start with current value
        if parent_id_provided:
            if category_data.parent_id:
                try:
                    final_parent_id = UUID(category_data.parent_id)
                    # Check if parent exists and is active
                    parent = self.db.query(Category).filter(
                        Category.id == final_parent_id,
                        Category.is_active == True
                    ).first()
                    if not parent:
                        raise HTTPException(status_code=400, detail=f"Parent category with ID '{category_data.parent_id}' not found or inactive")
                    # Prevent self-reference
                    if final_parent_id == cat_uuid:
                        raise HTTPException(status_code=400, detail="Category cannot be its own parent")

                    # Check hierarchy depth
                    parent_depth = self._get_hierarchy_depth(final_parent_id)
                    if parent_depth >= self.MAX_HIERARCHY_DEPTH:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Cannot update category: maximum hierarchy depth of {self.MAX_HIERARCHY_DEPTH} levels exceeded"
                        )
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid parent_id format: '{category_data.parent_id}'")
            else:
                final_parent_id = None

        # Validate price fields: prices can only be set on subcategories (with parent_id)
        # Check both incoming price fields and existing ones on the category
        has_new_price_fields = any([
            category_data.price is not None,
            category_data.min_price is not None,
            category_data.max_price is not None
        ])

        has_existing_price_fields = any([
            category.price is not None,
            category.min_price is not None,
            category.max_price is not None
        ])

        if (has_new_price_fields or has_existing_price_fields) and not final_parent_id:
            raise HTTPException(
                status_code=422,
                detail="Price fields can only be set on subcategories (categories with a parent_id)"
            )

        # Update fields
        update_data = update_data_dict  # Already computed above
        # Always update parent_id if it was provided in the request (even if None)
        if parent_id_provided:
            update_data['parent_id'] = final_parent_id

        if update_data:
            for key, value in update_data.items():
                setattr(category, key, value)

            try:
                self.db.commit()
                self.db.refresh(category)
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(status_code=400, detail=f"Category with name '{category_data.name}' already exists")

        return CategoryRead.model_validate(category)

    async def get_categories_hierarchy(self, is_active: Optional[bool] = None) -> List[CategoryWithChildren]:
        """Get all categories with their children in a hierarchical structure"""
        
        query = self.db.query(Category)
        
        if is_active is not None:
            query = query.filter(Category.is_active == is_active)
        
        # Load parent-child relationships with recursive loading
        query = query.options(selectinload(Category.children).selectinload(Category.children))
        
        # Get only root categories (no parent)
        query = query.filter(Category.parent_id.is_(None))
        
        query = query.order_by(Category.name)
        root_categories = query.all()
        
        return [self._build_category_hierarchy(cat) for cat in root_categories]
    
    def _build_category_hierarchy(self, category: Category) -> CategoryWithChildren:
        """Recursively build category hierarchy"""
        children = []
        for child in category.children:
            if child.is_active:  # Only include active children
                children.append(self._build_category_hierarchy(child))
        
        # Sort children by name for consistent ordering
        children.sort(key=lambda x: x.name)
        
        return CategoryWithChildren(
            id=str(category.id),
            name=category.name,
            is_active=category.is_active,
            parent_id=str(category.parent_id) if category.parent_id else None,
            created_at=category.created_at,
            updated_at=category.updated_at,
            children=children
        )
    
    async def get_category_children(self, category_id: str) -> List[CategoryRead]:
        """Get direct children of a category"""
        
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return []
        
        children = self.db.query(Category).filter(
            Category.parent_id == cat_uuid,
            Category.is_active == True
        ).order_by(Category.name).all()
        
        return [CategoryRead.model_validate(child) for child in children]
    
    async def get_category_parent(self, category_id: str) -> Optional[CategoryRead]:
        """Get parent of a category"""
        
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return None
        
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()
        
        if not category or not category.parent_id:
            return None
        
        parent = self.db.query(Category).filter(
            Category.id == category.parent_id,
            Category.is_active == True
        ).first()
        
        return CategoryRead.model_validate(parent) if parent else None

    async def get_category_breadcrumb(self, category_id: str) -> List[CategoryRead]:
        """Get the full breadcrumb path from root to category"""
        
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return []
        
        # Get the category
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()
        if not category:
            return []
        
        # Build breadcrumb by traversing up the hierarchy
        breadcrumb = []
        current_id = cat_uuid
        
        while current_id:
            cat = self.db.query(Category).filter(Category.id == current_id).first()
            if not cat:
                break
            breadcrumb.insert(0, CategoryRead.model_validate(cat))  # Insert at beginning for root->leaf order
            current_id = cat.parent_id
            
            # Safety check to prevent infinite loops
            if len(breadcrumb) > self.MAX_HIERARCHY_DEPTH + 1:
                break
        
        return breadcrumb

    async def soft_delete_category(self, category_id: str) -> Optional[CategoryRead]:
        """Soft delete a category by setting is_active to False"""

        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            return None

        # Check if category exists
        category = self.db.query(Category).filter(Category.id == cat_uuid).first()

        if not category:
            return None

        # Soft delete by setting is_active to False
        category.is_active = False
        self.db.commit()
        self.db.refresh(category)

        return CategoryRead.model_validate(category)
