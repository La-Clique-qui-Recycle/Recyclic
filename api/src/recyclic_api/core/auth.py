"""
Module d'authentification pour l'API Recyclic
Gère l'authentification JWT et la vérification des rôles
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import select

from .config import settings
from .database import get_db
from ..models.user import User, UserRole

# Configuration JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Schéma de sécurité
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crée un token JWT d'accès"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Vérifie et décode un token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Récupère l'utilisateur actuel à partir du token JWT"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Vérifier le token
        payload = verify_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Récupérer l'utilisateur depuis la base de données
    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

def require_role(required_role: Union[UserRole, str]):
    """Décorateur pour vérifier qu'un utilisateur a un rôle spécifique"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Convertir en UserRole si c'est une string
        if isinstance(required_role, str):
            try:
                required_role_enum = UserRole(required_role)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rôle invalide: {required_role}"
                )
        else:
            required_role_enum = required_role
        
        # Vérifier le rôle
        if current_user.role != required_role_enum:
            # Les super-admins héritent automatiquement des permissions admin
            if not (current_user.role == UserRole.SUPER_ADMIN and required_role_enum == UserRole.ADMIN):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permissions insuffisantes"
                )
        
        return current_user
    return role_checker

def require_admin_role():
    """Vérifie que l'utilisateur a le rôle admin ou super-admin"""
    def admin_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé - Rôle administrateur requis"
            )
        return current_user
    return admin_checker

def require_super_admin_role():
    """Vérifie que l'utilisateur a le rôle super-admin"""
    def super_admin_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé - Rôle super-administrateur requis"
            )
        return current_user
    return super_admin_checker

# Fonctions utilitaires pour l'authentification
def get_user_by_telegram_id(db: Session, telegram_id: str) -> Optional[User]:
    """Récupère un utilisateur par son telegram_id"""
    result = db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()

def authenticate_user(db: Session, telegram_id: str) -> Optional[User]:
    """Authentifie un utilisateur par son telegram_id"""
    user = get_user_by_telegram_id(db, telegram_id)
    if user and user.is_active:
        return user
    return None
