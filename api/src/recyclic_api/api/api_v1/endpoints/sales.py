from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from recyclic_api.core.database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from recyclic_api.core.security import verify_token
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
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
    # Enforce 401 when no Authorization header is provided
    if credentials is None:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

    # Validate token
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})
    """Create new sale with items"""
    # Create the sale
    db_sale = Sale(
        cash_session_id=sale_data.cash_session_id,
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
            unit_price=item_data.unit_price,
            total_price=item_data.total_price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_sale)
    return db_sale
