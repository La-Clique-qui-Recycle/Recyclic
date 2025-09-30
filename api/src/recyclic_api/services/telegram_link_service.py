from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from ..models.user import User
from ..core.security import verify_password

class TelegramLinkService:
    """Service pour gérer la liaison des comptes Telegram aux comptes web."""

    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authentifie un utilisateur avec username et password."""
        user = self.db.query(User).filter(User.username == username).first()
        if not user or not user.hashed_password:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user if user.is_active else None

    def check_telegram_id_conflict(self, telegram_id: str, exclude_user_id: Optional[str] = None) -> bool:
        """Vérifie si le telegram_id est déjà utilisé par un autre utilisateur."""
        query = self.db.query(User).filter(User.telegram_id == telegram_id)
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)

        # Convertir exclude_user_id en UUID si nécessaire
        if exclude_user_id:
            from uuid import UUID
            try:
                exclude_uuid = UUID(exclude_user_id)
                return query.filter(User.id != exclude_uuid).first() is not None
            except ValueError:
                pass

        return query.first() is not None

    def link_telegram_account(self, username: str, password: str, telegram_id: str) -> Tuple[bool, str]:
        """Lie un compte Telegram à un compte utilisateur existant.

        Returns:
            Tuple[bool, str]: (success, message)
        """
        # Étape 1: Authentification
        user = self.authenticate_user(username, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiants invalides"
            )

        # Étape 2: Vérifier le conflit de telegram_id
        if self.check_telegram_id_conflict(telegram_id, exclude_user_id=str(user.id)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce Telegram ID est déjà lié à un autre compte"
            )

        # Étape 3: Mettre à jour le telegram_id de l'utilisateur
        user.telegram_id = telegram_id
        self.db.commit()
        self.db.refresh(user)

        return True, "Compte Telegram lié avec succès"
