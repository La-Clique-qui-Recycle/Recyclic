from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid

from ....core.database import get_db
from ....models.registration_request import RegistrationRequest, RegistrationStatus
from ....models.user import User
from ....schemas.registration_request import (
    RegistrationRequestCreate, 
    RegistrationRequestResponse, 
    RegistrationRequestUpdate
)

router = APIRouter()

@router.get("/", response_model=List[RegistrationRequestResponse])
async def get_registration_requests(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all registration requests with optional status filter"""
    query = db.query(RegistrationRequest)
    
    if status:
        try:
            status_enum = RegistrationStatus(status)
            query = query.filter(RegistrationRequest.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {[s.value for s in RegistrationStatus]}"
            )
    
    requests = query.offset(skip).limit(limit).all()
    return requests

@router.get("/{request_id}", response_model=RegistrationRequestResponse)
async def get_registration_request(request_id: str, db: Session = Depends(get_db)):
    """Get a specific registration request"""
    request = db.query(RegistrationRequest).filter(RegistrationRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Registration request not found")
    return request

@router.get("/telegram/{telegram_id}", response_model=List[RegistrationRequestResponse])
async def get_registration_requests_by_telegram_id(
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Get registration requests for a specific Telegram user"""
    requests = db.query(RegistrationRequest).filter(
        RegistrationRequest.telegram_id == telegram_id
    ).all()
    return requests

@router.post("/", response_model=RegistrationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_registration_request(
    request: RegistrationRequestCreate,
    db: Session = Depends(get_db)
):
    """Create a new registration request"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.telegram_id == request.telegram_id).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this Telegram ID already exists"
        )
    
    # Check if there's already a pending request
    existing_request = db.query(RegistrationRequest).filter(
        RegistrationRequest.telegram_id == request.telegram_id,
        RegistrationRequest.status == RegistrationStatus.PENDING
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=400,
            detail="A pending registration request already exists for this Telegram ID"
        )
    
    # Create new request
    db_request = RegistrationRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.put("/{request_id}", response_model=RegistrationRequestResponse)
async def update_registration_request(
    request_id: str,
    request_update: RegistrationRequestUpdate,
    db: Session = Depends(get_db)
):
    """Update a registration request (typically for admin approval/rejection)"""
    db_request = db.query(RegistrationRequest).filter(RegistrationRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Registration request not found")
    
    # Update fields
    for field, value in request_update.dict(exclude_unset=True).items():
        setattr(db_request, field, value)
    
    # Set reviewed timestamp if status is being changed
    if request_update.status and request_update.status != db_request.status:
        db_request.reviewed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.delete("/{request_id}")
async def delete_registration_request(request_id: str, db: Session = Depends(get_db)):
    """Delete a registration request"""
    db_request = db.query(RegistrationRequest).filter(RegistrationRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Registration request not found")
    
    db.delete(db_request)
    db.commit()
    
    return {"message": "Registration request deleted successfully"}
