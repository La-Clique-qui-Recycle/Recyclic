from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from recyclic_api.core.database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from recyclic_api.core.security import verify_token
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.sale import SaleResponse, SaleCreate

router = APIRouter()
auth_scheme = HTTPBearer(auto_error=False)

@router.get("/", response_model=List[SaleResponse])
async def get_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all sales"""
    sales = db.query(Sale).offset(skip).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(sale_id: str, db: Session = Depends(get_db)):
    """Get sale by ID"""
    try:
        sale_uuid = UUID(sale_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid sale ID format")
    
    sale = db.query(Sale).filter(Sale.id == sale_uuid).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme),
):
    """
    Create new sale with items and operator traceability.

    STORY-B12-P5: Finalisation du Ticket de Caisse
    - Accepts: category, weight (kg), unit_price, total_price for each item
    - CRITICAL: total_amount = sum of all total_price (NO multiplication by weight)
    - Example: Item with weight=2.5kg and total_price=15.0 contributes 15.0 to total (NOT 37.5)
    """
    # Enforce 401 when no Authorization header is provided
    if credentials is None:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

    # Validate token and extract user_id (operator)
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

    # Create the sale with operator_id for traceability
    db_sale = Sale(
        cash_session_id=sale_data.cash_session_id,
        operator_id=user_id,  # Associate sale with current operator
        total_amount=sale_data.total_amount
    )
    db.add(db_sale)
    db.flush()  # Get the sale ID
    
    # Create sale items
    for item_data in sale_data.items:
        db_item = SaleItem(
            sale_id=db_sale.id,
            category=item_data.category,
            quantity=item_data.quantity,
            weight=item_data.weight,  # Poids en kg avec décimales
            unit_price=item_data.unit_price,
            total_price=item_data.total_price  # Note: total_price = unit_price (pas de multiplication)
        )
        db.add(db_item)

    # Commit to ensure the sale is in the database before querying
    db.commit()

    # Update cash session counters
    cash_session = db.query(CashSession).filter(CashSession.id == sale_data.cash_session_id).first()
    if cash_session:
        # Calculate total sales and items for this session (includes the sale we just created)
        session_sales = db.query(
            func.coalesce(func.sum(Sale.total_amount), 0).label('total_sales'),
            func.count(Sale.id).label('total_items')
        ).filter(Sale.cash_session_id == sale_data.cash_session_id).first()

        # Update session with totals from all sales
        cash_session.total_sales = float(session_sales.total_sales)
        cash_session.total_items = session_sales.total_items
        cash_session.current_amount = cash_session.initial_amount + cash_session.total_sales

        db.commit()
    db.refresh(db_sale)
    return db_sale
