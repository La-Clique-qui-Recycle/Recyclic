from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.cash_session import CashSession
from ...schemas.cash_session import CashSessionResponse, CashSessionCreate

router = APIRouter()

@router.get("/", response_model=List[CashSessionResponse])
async def get_cash_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all cash sessions"""
    sessions = db.query(CashSession).offset(skip).limit(limit).all()
    return sessions

@router.get("/{session_id}", response_model=CashSessionResponse)
async def get_cash_session(session_id: str, db: Session = Depends(get_db)):
    """Get cash session by ID"""
    session = db.query(CashSession).filter(CashSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Cash session not found")
    return session

@router.post("/", response_model=CashSessionResponse)
async def create_cash_session(session: CashSessionCreate, db: Session = Depends(get_db)):
    """Create new cash session"""
    db_session = CashSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session
