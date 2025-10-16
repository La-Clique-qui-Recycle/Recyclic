"""
Security utilities for password hashing, validation, and JWT management
"""

# Fix for bcrypt compatibility issue with passlib
# This patches the bcrypt module to add the missing __about__ attribute
try:
    import bcrypt
    if not hasattr(bcrypt, '__about__'):
        class MockAbout:
            __version__ = "4.0.1"
        bcrypt.__about__ = MockAbout()
except ImportError:
    pass

import re
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .config import settings
from ..models.setting import Setting

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """
    Validate password strength according to security best practices.

    Requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")

    return len(errors) == 0, errors


def get_token_expiration_minutes() -> int:
    """
    Récupère la durée d'expiration des tokens depuis la base de données.
    Retourne 480 minutes (8 heures) par défaut si la valeur n'est pas trouvée.
    """
    try:
        from ..core.database import get_db
        db = next(get_db())
        setting = db.query(Setting).filter(Setting.key == "token_expiration_minutes").first()
        if setting:
            value = int(setting.value)
            # Validation de la valeur pour éviter les valeurs aberrantes
            if 1 <= value <= 10080:  # Entre 1 minute et 7 jours
                return value
            else:
                # Log l'erreur mais utilise la valeur par défaut
                import logging
                logging.warning(f"Token expiration value {value} is out of range (1-10080), using default 480")
    except (ValueError, TypeError) as e:
        # Log l'erreur de conversion
        import logging
        logging.warning(f"Invalid token expiration value: {e}, using default 480")
    except Exception as e:
        # Log l'erreur de base de données
        import logging
        logging.warning(f"Database error retrieving token expiration: {e}, using default 480")
    
    # Valeur par défaut : 480 minutes (8 heures)
    return 480


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT d'accès"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Récupérer la durée d'expiration depuis la base de données
        expiration_minutes = get_token_expiration_minutes()
        expire = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    
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


def create_password_reset_token(email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT pour la réinitialisation de mot de passe."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=1)
    
    to_encode = {
        "sub": email,
        "scope": "password-reset",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_reset_token(token: str) -> str:
    """Vérifie et décode un token JWT de réinitialisation de mot de passe"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

        # Vérifier que c'est bien un token de réinitialisation
        if payload.get("scope") != "password-reset":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide pour cette opération",
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
            )

        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )


# Aliases for backward compatibility with tests
def create_reset_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Alias pour create_password_reset_token pour compatibilité avec les tests.

    DEPRECATED: Cette fonction est un alias de compatibilité et sera supprimée dans une version future.
    Utilisez directement `create_password_reset_token()` à la place.

    Args:
        user_id: L'identifiant de l'utilisateur
        expires_delta: Durée de validité du token (optionnel)

    Returns:
        Le token JWT de réinitialisation
    """
    return create_password_reset_token(user_id, expires_delta)
