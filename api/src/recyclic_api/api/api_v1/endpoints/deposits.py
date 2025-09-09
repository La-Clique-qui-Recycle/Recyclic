from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from recyclic_api.core.database import get_db
from recyclic_api.models.deposit import Deposit
from recyclic_api.schemas.deposit import DepositResponse, DepositCreate

router = APIRouter()

@router.get("/", response_model=List[DepositResponse])
async def get_deposits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all deposits"""
    deposits = db.query(Deposit).offset(skip).limit(limit).all()
    return deposits

@router.get("/{deposit_id}", response_model=DepositResponse)
async def get_deposit(deposit_id: str, db: Session = Depends(get_db)):
    """Get deposit by ID"""
    deposit = db.query(Deposit).filter(Deposit.id == deposit_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit

@router.post("/", response_model=DepositResponse)
async def create_deposit(deposit: DepositCreate, db: Session = Depends(get_db)):
    """Create new deposit"""
    db_deposit = Deposit(**deposit.dict())
    db.add(db_deposit)
    db.commit()
    db.refresh(db_deposit)
    return db_deposit
