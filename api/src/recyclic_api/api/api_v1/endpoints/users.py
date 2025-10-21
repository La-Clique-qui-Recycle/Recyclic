from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from recyclic_api.core.database import get_db
from recyclic_api.core.uuid_validation import validate_and_convert_uuid
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.user import (
    UserResponse,
    UserCreate,
    UserUpdate,
    UserStatusUpdate,
    LinkTelegramRequest,
    UserSelfUpdate,
    PasswordChangeRequest,
)
from recyclic_api.schemas.pin import PinSetRequest
from recyclic_api.core.auth import require_role_strict, get_current_user
from recyclic_api.core.security import hash_password
from recyclic_api.services.telegram_link_service import TelegramLinkService
from recyclic_api.utils.rate_limit import conditional_rate_limit

router = APIRouter()


# --- Self endpoints MUST come before /{user_id} to avoid route shadowing ---
@router.put("/me", response_model=UserResponse)
async def update_me(
    payload: UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour les informations de l'utilisateur connecté (champs non sensibles)."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password", response_model=dict)
async def change_my_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Changer le mot de passe de l'utilisateur connecté."""
    # La validation de robustesse et de confirmation est gérée par le schéma
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.put("/me/pin", response_model=dict)
async def set_user_pin(
    pin_request: PinSetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Définir ou modifier le PIN de l'utilisateur connecté.

    Le PIN doit être exactement 4 chiffres et sera haché avant stockage.
    Si l'utilisateur a déjà un PIN, le mot de passe actuel est requis.
    """
    from recyclic_api.core.security import verify_password
    
    # Si l'utilisateur a déjà un PIN, vérifier le mot de passe
    if current_user.hashed_pin is not None:
        if not pin_request.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required to modify existing PIN"
            )
        
        # Vérifier le mot de passe actuel
        if not verify_password(pin_request.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )
    
    # Hash the PIN using the same security mechanism as passwords
    current_user.hashed_pin = hash_password(pin_request.pin)

    db.commit()
    db.refresh(current_user)

    return {"message": "PIN successfully set"}

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
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID"""
    user_uuid = validate_and_convert_uuid(user_id)

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create new user"""
    from recyclic_api.core.security import hash_password
    from recyclic_api.core.audit import log_audit, AuditActionType

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash the password before creating user
    user_data = user.model_dump()
    user_data['hashed_password'] = hash_password(user.password)

    # Remove password from user data as it's not needed for User model
    del user_data['password']

    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log audit for user creation
    log_audit(
        action_type=AuditActionType.USER_CREATED,
        actor=None,  # System creation, no specific actor
        target_id=db_user.id,
        target_type="user",
        details={
            "username": db_user.username,
            "role": db_user.role.value if db_user.role else None,
            "status": db_user.status.value if db_user.status else None
        },
        description=f"Utilisateur créé: {db_user.username}",
        db=db
    )
    
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user by ID"""
    from recyclic_api.core.audit import log_audit, AuditActionType
    
    user_uuid = validate_and_convert_uuid(user_id)

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    updated_fields = list(update_data.keys())
    
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    
    # Log audit for user update
    log_audit(
        action_type=AuditActionType.USER_UPDATED,
        actor=None,  # Self-update, no specific actor
        target_id=user.id,
        target_type="user",
        details={
            "username": user.username,
            "updated_fields": updated_fields
        },
        description=f"Utilisateur modifié: {user.username} (champs: {', '.join(updated_fields)})",
        db=db
    )
    
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete user by ID"""
    from recyclic_api.core.audit import log_audit, AuditActionType
    
    user_uuid = validate_and_convert_uuid(user_id)

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Log audit before deletion
    log_audit(
        action_type=AuditActionType.USER_DELETED,
        actor=None,  # System deletion, no specific actor
        target_id=user.id,
        target_type="user",
        details={
            "username": user.username,
            "role": user.role.value if user.role else None,
            "status": user.status.value if user.status else None
        },
        description=f"Utilisateur supprimé: {user.username}",
        db=db
    )

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@conditional_rate_limit("5/minute")
@router.post("/link-telegram", response_model=dict)
async def link_telegram_account(link_request: LinkTelegramRequest, request: Request, db: Session = Depends(get_db)):
    """Lier un compte Telegram à un compte utilisateur existant.

    Cette route permet à un utilisateur existant de lier son compte Telegram
    en fournissant ses identifiants web et son ID Telegram.

    Limite de taux : 5 requêtes par minute pour éviter les attaques par force brute.
    """
    service = TelegramLinkService(db)
    success, message = service.link_telegram_account(
        username=link_request.username,
        password=link_request.password,
        telegram_id=link_request.telegram_id
    )

    if success:
        return {"message": message}
    else:
        raise HTTPException(status_code=400, detail=message)




