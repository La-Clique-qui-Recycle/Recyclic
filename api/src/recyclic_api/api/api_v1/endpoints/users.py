from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from recyclic_api.core.database import get_db
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.user import UserResponse, UserCreate, UserUpdate, UserStatusUpdate
from recyclic_api.core.auth import require_role_strict
from uuid import UUID

router = APIRouter()

@router.get("/active-operators", response_model=List[UserResponse])
async def get_active_operators(db: Session = Depends(get_db), current_user=Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Retourne les utilisateurs actifs pouvant opérer une caisse.

    Rôles inclus: user, admin, super-admin; exclut les inactifs.
    """
    users = db.query(User).filter(
        User.is_active.is_(True),
        User.role.in_([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])
    ).all()
    return users

@router.get("/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create new user"""
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(user_id: str, status_update: UserStatusUpdate, db: Session = Depends(get_db)):
    """Update user status by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = status_update.status
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


