from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from recyclic_api.core.database import get_db
from recyclic_api.services.preset_management import PresetManagementService
from recyclic_api.schemas.sale import SaleCreate, SaleResponse
from recyclic_api.services.cash_session_service import CashSessionService

# Import the sale creation function (assuming it exists)
# This would need to be adapted based on the actual sale creation logic
from .sales import create_sale

router = APIRouter()


@router.post("/", response_model=SaleResponse)
async def create_transaction(
    transaction_data: SaleCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new transaction (sale) with support for preset buttons and notes.

    Extended to support:
    - preset_id: Reference to a preset button used for this transaction
    - notes: Additional notes for the transaction
    """
    # If preset_id is provided, validate that the preset exists and is active
    if hasattr(transaction_data, 'preset_id') and transaction_data.preset_id:
        preset_service = PresetManagementService(db)
        preset = preset_service.get_preset_button_by_id(str(transaction_data.preset_id))

        if not preset:
            raise HTTPException(
                status_code=400,
                detail=f"Preset button with ID '{transaction_data.preset_id}' not found or inactive"
            )

    # For now, delegate to the existing sale creation logic
    # Story 1.1.2: preset_id et notes sont maintenant sur sale_items (par item individuel)
    return create_sale(transaction_data, db, None)
