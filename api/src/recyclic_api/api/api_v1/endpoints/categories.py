from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_role_strict
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead, CategoryWithChildren
from recyclic_api.services.category_service import CategoryService


router = APIRouter(tags=["categories"])


@router.post(
    "/",
    response_model=CategoryRead,
    status_code=201,
    summary="Create a new category",
    description="Create a new category. Requires SUPER_ADMIN role."
)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_role_strict(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    service = CategoryService(db)
    return await service.create_category(category_data)


@router.get(
    "/",
    response_model=List[CategoryRead],
    summary="List all categories",
    description="Get all categories, optionally filtered by active status. Requires authentication."
)
async def get_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories with optional filter"""
    service = CategoryService(db)
    return await service.get_categories(is_active=is_active)


@router.get(
    "/hierarchy",
    response_model=List[CategoryWithChildren],
    summary="Get categories hierarchy",
    description="Get all categories in a hierarchical structure with their children. Requires authentication."
)
async def get_categories_hierarchy(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get categories in hierarchical structure"""
    service = CategoryService(db)
    return await service.get_categories_hierarchy(is_active=is_active)


@router.get(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Get a category by ID",
    description="Retrieve a single category by its ID. Requires authentication."
)
async def get_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a category by ID"""
    service = CategoryService(db)
    category = await service.get_category_by_id(category_id)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.put(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Update a category",
    description="Update a category's information. Requires SUPER_ADMIN role."
)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: User = Depends(require_role_strict(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Update a category"""
    service = CategoryService(db)
    category = await service.update_category(category_id, category_data)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.delete(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Soft delete a category",
    description="Soft delete a category by setting is_active to False. Requires SUPER_ADMIN role."
)
async def delete_category(
    category_id: str,
    current_user: User = Depends(require_role_strict(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Soft delete a category"""
    service = CategoryService(db)
    category = await service.soft_delete_category(category_id)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.get(
    "/{category_id}/children",
    response_model=List[CategoryRead],
    summary="Get category children",
    description="Get direct children of a category. Requires authentication."
)
async def get_category_children(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get direct children of a category"""
    service = CategoryService(db)
    return await service.get_category_children(category_id)


@router.get(
    "/{category_id}/parent",
    response_model=CategoryRead,
    summary="Get category parent",
    description="Get parent of a category. Requires authentication."
)
async def get_category_parent(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get parent of a category"""
    service = CategoryService(db)
    parent = await service.get_category_parent(category_id)
    
    if not parent:
        raise HTTPException(status_code=404, detail="Category has no parent or parent not found")
    
    return parent


@router.get(
    "/{category_id}/breadcrumb",
    response_model=List[CategoryRead],
    summary="Get category breadcrumb",
    description="Get the full breadcrumb path from root to category. Requires authentication."
)
async def get_category_breadcrumb(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the full breadcrumb path from root to category"""
    service = CategoryService(db)
    breadcrumb = await service.get_category_breadcrumb(category_id)
    
    if not breadcrumb:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return breadcrumb
