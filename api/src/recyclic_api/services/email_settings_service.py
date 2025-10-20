"""
Service for managing email settings like Brevo configuration.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Dict, Any
import re

from recyclic_api.models.setting import Setting
from recyclic_api.core.config import settings


class EmailSettingsService:
    """Service for managing email-related settings."""

    def __init__(self, db: Session):
        self.db = db

    def get_email_settings(self) -> Dict[str, Any]:
        """
        Récupère les paramètres d'email configuration.

        Returns:
            Dict contenant:
            - from_name: Nom de l'expéditeur
            - from_address: Email de l'expéditeur
            - default_recipient: Email du destinataire par défaut pour les tests
            - has_api_key: Boolean indiquant si la clé API est configurée
            - webhook_secret_configured: Boolean indiquant si le secret webhook est configuré
        """
        # Récupérer les paramètres depuis la base de données
        from_name_setting = self.db.query(Setting).filter(
            Setting.key == "email_from_name"
        ).first()

        from_address_setting = self.db.query(Setting).filter(
            Setting.key == "email_from_address"
        ).first()

        default_recipient_setting = self.db.query(Setting).filter(
            Setting.key == "email_default_recipient"
        ).first()

        # Utiliser les valeurs de la DB ou les valeurs par défaut du config
        from_name = from_name_setting.value if from_name_setting else settings.EMAIL_FROM_NAME
        from_address = from_address_setting.value if from_address_setting else settings.EMAIL_FROM_ADDRESS
        default_recipient = default_recipient_setting.value if default_recipient_setting else None

        # Vérifier si les clés sensibles sont configurées dans l'environnement
        has_api_key = bool(settings.BREVO_API_KEY)
        webhook_secret_configured = bool(settings.BREVO_WEBHOOK_SECRET)

        return {
            "from_name": from_name,
            "from_address": from_address,
            "default_recipient": default_recipient,
            "has_api_key": has_api_key,
            "webhook_secret_configured": webhook_secret_configured
        }

    def update_email_settings(
        self,
        from_name: str = None,
        from_address: str = None,
        default_recipient: str = None
    ) -> Dict[str, Any]:
        """
        Met à jour les paramètres d'email.

        Args:
            from_name: Nom de l'expéditeur (optionnel)
            from_address: Email de l'expéditeur (optionnel)
            default_recipient: Email du destinataire par défaut (optionnel)

        Returns:
            Dict avec les nouveaux paramètres

        Raises:
            ValueError: Si les valeurs sont invalides
        """
        # Validation de l'adresse email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if from_address is not None:
            if not re.match(email_pattern, from_address):
                raise ValueError("L'adresse email de l'expéditeur est invalide")
            self._upsert_setting("email_from_address", from_address)

        if default_recipient is not None:
            if default_recipient and not re.match(email_pattern, default_recipient):
                raise ValueError("L'adresse email du destinataire est invalide")
            self._upsert_setting("email_default_recipient", default_recipient)

        if from_name is not None:
            if not from_name or len(from_name.strip()) == 0:
                raise ValueError("Le nom de l'expéditeur ne peut pas être vide")
            if len(from_name) > 255:
                raise ValueError("Le nom de l'expéditeur est trop long (max 255 caractères)")
            self._upsert_setting("email_from_name", from_name)

        try:
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la sauvegarde: {str(e)}") from e
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur inattendue lors de la sauvegarde: {str(e)}") from e

        # Retourner les paramètres mis à jour
        return self.get_email_settings()

    def _upsert_setting(self, key: str, value: str) -> None:
        """
        Crée ou met à jour un paramètre dans la base de données.

        Args:
            key: Clé du paramètre
            value: Valeur du paramètre
        """
        setting = self.db.query(Setting).filter(Setting.key == key).first()

        if setting:
            setting.value = value
        else:
            setting = Setting(key=key, value=value)
            self.db.add(setting)
