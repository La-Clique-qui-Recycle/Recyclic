import httpx
import logging
from typing import Optional, Dict, Any
from ..config import settings

logger = logging.getLogger(__name__)

class UserService:
    """Service pour gérer les utilisateurs via l'API"""
    
    def __init__(self):
        self.api_base_url = f"{settings.API_BASE_URL}{settings.API_V1_STR}"
    
    async def get_user_by_telegram_id(self, telegram_id: str) -> Optional[Dict[str, Any]]:
        """Récupérer un utilisateur par son Telegram ID"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/users/telegram/{telegram_id}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    return None
                else:
                    logger.error(f"Erreur API get_user_by_telegram_id: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None
    
    async def create_registration_request(self, telegram_id: str, username: str, 
                                        first_name: str, last_name: str) -> Optional[Dict[str, Any]]:
        """Créer une demande d'inscription"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base_url}/users/registration-requests",
                    json={
                        "telegram_id": telegram_id,
                        "username": username,
                        "first_name": first_name,
                        "last_name": last_name
                    },
                    timeout=10.0
                )
                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Erreur API create_registration_request: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Erreur lors de la création de la demande d'inscription: {e}")
            return None
    
    async def get_registration_link(self, telegram_id: str) -> str:
        """Générer le lien d'inscription pour un utilisateur"""
        return f"{settings.FRONTEND_URL}/inscription?telegram_id={telegram_id}"
    
    def get_admin_telegram_ids(self) -> list[str]:
        """Récupérer la liste des IDs Telegram des admins"""
        if not settings.ADMIN_TELEGRAM_IDS:
            return []
        return [admin_id.strip() for admin_id in settings.ADMIN_TELEGRAM_IDS.split(",") if admin_id.strip()]

user_service = UserService()
