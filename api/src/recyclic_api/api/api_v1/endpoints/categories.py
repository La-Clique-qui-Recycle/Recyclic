from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse, Response
import io
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_role_strict
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryRead,
    CategoryWithChildren,
    CategoryImportAnalyzeResponse,
    CategoryImportExecuteRequest,
)
from recyclic_api.services.category_service import CategoryService
from recyclic_api.services.category_export_service import CategoryExportService
from recyclic_api.services.category_import_service import CategoryImportService


router = APIRouter(tags=["categories"])


@router.post(
    "/",
    response_model=CategoryRead,
    status_code=201,
    summary="Create a new category",
    description="Create a new category. Requires ADMIN or SUPER_ADMIN role."
)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    "/actions/export",
    summary="Export categories configuration",
    description="Export all categories to PDF, Excel or CSV format. Requires ADMIN or SUPER_ADMIN role."
)
async def export_categories(
    format: str = Query(..., description="Export format: 'pdf' or 'xls' or 'csv'"),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Export categories configuration to PDF or Excel format.

    - **format**: Either 'pdf' or 'xls'
    - Returns the file as a downloadable stream
    """
    if format not in ['pdf', 'xls', 'csv']:
        raise HTTPException(status_code=400, detail="Invalid format. Must be 'pdf', 'xls' or 'csv'")

    export_service = CategoryExportService(db)

    if format == 'pdf':
        buffer = export_service.export_to_pdf()
        filename = f"categories_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    elif format == 'xls':
        buffer = export_service.export_to_excel()
        filename = f"categories_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:  # csv
        content_bytes = CategoryExportService(db).export_to_csv()
        filename = f"categories_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        media_type = "text/csv"
        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get(
    "/import/template",
    summary="Télécharger le modèle CSV d'import des catégories",
    description="Retourne un fichier CSV modèle avec les colonnes requises. Nécessite ADMIN ou SUPER_ADMIN.",
)
async def download_categories_import_template(
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    service = CategoryImportService(db)
    content = service.generate_template_csv()
    filename = f"categories_import_template.csv"
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post(
    "/import/analyze",
    response_model=CategoryImportAnalyzeResponse,
    summary="Analyser un CSV d'import de catégories",
    description="Valide le CSV et prépare une session d'import. Nécessite ADMIN ou SUPER_ADMIN.",
)
async def analyze_categories_import(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".csv")):
        raise HTTPException(status_code=400, detail="Format non supporté: fournir un fichier .csv")

    content = await file.read()
    service = CategoryImportService(db)
    result = service.analyze(content)
    return result


@router.post(
    "/import/execute",
    summary="Exécuter un import de catégories depuis une session",
    description="Exécute l'upsert transactionnel à partir d'une session d'analyse. Nécessite ADMIN ou SUPER_ADMIN.",
)
async def execute_categories_import(
    payload: CategoryImportExecuteRequest,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    service = CategoryImportService(db)
    result = service.execute(payload.session_id, payload.delete_existing)
    return result


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
    description="Update a category's information. Requires ADMIN or SUPER_ADMIN role."
)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    description="Soft delete a category by setting is_active to False. Requires ADMIN or SUPER_ADMIN role."
)
async def delete_category(
    category_id: str,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Soft delete a category"""
    service = CategoryService(db)
    category = await service.soft_delete_category(category_id)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.delete(
    "/{category_id}/hard",
    summary="Hard delete a category",
    description="Delete a category permanently if it has no children. Requires ADMIN or SUPER_ADMIN role.",
    status_code=204,
)
async def hard_delete_category(
    category_id: str,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    await service.hard_delete_category(category_id)


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


@router.get(
    "/export",
    summary="Export categories configuration",
    description="Export all categories to PDF or Excel format. Requires ADMIN or SUPER_ADMIN role."
)
async def export_categories(
    format: str = Query(..., description="Export format: 'pdf' or 'xls'"),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Export categories configuration to PDF or Excel format.

    - **format**: Either 'pdf' or 'xls'
    - Returns the file as a downloadable stream
    """
    if format not in ['pdf', 'xls']:
        raise HTTPException(status_code=400, detail="Invalid format. Must be 'pdf' or 'xls'")

    export_service = CategoryExportService(db)

    if format == 'pdf':
        buffer = export_service.export_to_pdf()
        filename = f"categories_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:  # xls
        buffer = export_service.export_to_excel()
        filename = f"categories_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
