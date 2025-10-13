"""
Service for managing session settings like token expiration.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from recyclic_api.models.setting import Setting
from recyclic_api.schemas.setting import SessionSettingsResponse, SessionSettingsUpdate


class SessionSettingsService:
    """Service for managing session-related settings."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_session_settings(self) -> SessionSettingsResponse:
        """
        Récupère les paramètres de session.
        Retourne 480 minutes par défaut si la valeur n'est pas trouvée.
        """
        setting = self.db.query(Setting).filter(
            Setting.key == "token_expiration_minutes"
        ).first()
        
        if setting:
            try:
                token_expiration_minutes = int(setting.value)
            except (ValueError, TypeError):
                token_expiration_minutes = 480  # Valeur par défaut
        else:
            token_expiration_minutes = 480  # Valeur par défaut
        
        return SessionSettingsResponse(
            token_expiration_minutes=token_expiration_minutes
        )
    
    def update_session_settings(self, settings_update: SessionSettingsUpdate) -> SessionSettingsResponse:
        """
        Met à jour les paramètres de session.
        """
        # Validation de la valeur
        if settings_update.token_expiration_minutes <= 0:
            raise ValueError("La durée d'expiration doit être positive")
        
        if settings_update.token_expiration_minutes > 10080:  # 7 jours max
            raise ValueError("La durée d'expiration ne peut pas dépasser 7 jours (10080 minutes)")
        
        # Rechercher ou créer le paramètre
        setting = self.db.query(Setting).filter(
            Setting.key == "token_expiration_minutes"
        ).first()
        
        if setting:
            # Mettre à jour la valeur existante
            setting.value = str(settings_update.token_expiration_minutes)
        else:
            # Créer un nouveau paramètre
            setting = Setting(
                key="token_expiration_minutes",
                value=str(settings_update.token_expiration_minutes)
            )
            self.db.add(setting)
        
        try:
            self.db.commit()
            self.db.refresh(setting)
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la sauvegarde: {str(e)}") from e
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur inattendue lors de la sauvegarde: {str(e)}") from e
        
        return SessionSettingsResponse(
            token_expiration_minutes=settings_update.token_expiration_minutes
        )

