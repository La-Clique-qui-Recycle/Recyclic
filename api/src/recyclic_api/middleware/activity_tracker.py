"""
Middleware pour enregistrer l'activité utilisateur dans Redis
"""
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from recyclic_api.core.redis import get_redis
from recyclic_api.core.config import settings
import logging

logger = logging.getLogger(__name__)

class ActivityTrackerMiddleware(BaseHTTPMiddleware):
    """Middleware pour tracker l'activité des utilisateurs authentifiés"""
    
    def __init__(self, app, activity_threshold_minutes: int = 15):
        super().__init__(app)
        self.activity_threshold_minutes = activity_threshold_minutes
        self.redis = get_redis()
    
    async def dispatch(self, request: Request, call_next):
        """Traite la requête et enregistre l'activité si l'utilisateur est authentifié"""
        
        # Exécuter la requête d'abord
        response = await call_next(request)
        
        # Vérifier si l'utilisateur est authentifié
        # On peut le faire en vérifiant la présence d'un header Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return response
        
        # Extraire le token (on ne le valide pas ici, juste on l'utilise pour identifier l'utilisateur)
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Décoder le token JWT manuellement pour obtenir l'user_id
            # On utilise base64 pour décoder le payload sans vérifier la signature
            import base64
            import json
            
            try:
                # JWT a 3 parties séparées par des points : header.payload.signature
                parts = token.split('.')
                if len(parts) == 3:
                    # Décoder le payload (partie 2)
                    payload_encoded = parts[1]
                    # Ajouter padding si nécessaire
                    missing_padding = len(payload_encoded) % 4
                    if missing_padding:
                        payload_encoded += '=' * (4 - missing_padding)
                    
                    payload_bytes = base64.urlsafe_b64decode(payload_encoded)
                    payload = json.loads(payload_bytes.decode('utf-8'))
                    user_id = payload.get("sub")
                    
                    if user_id:
                        # Enregistrer l'activité dans Redis
                        await self._record_user_activity(user_id, request)
                        
            except Exception as jwt_error:
                # Token invalide, on ignore silencieusement
                logger.debug(f"Token JWT invalide: {jwt_error}")
                pass
                
        except Exception as e:
            # En cas d'erreur, on log mais on ne fait pas échouer la requête
            logger.warning(f"Erreur lors de l'enregistrement de l'activité: {e}")
        
        return response
    
    async def _record_user_activity(self, user_id: str, request: Request):
        """Enregistre l'activité de l'utilisateur dans Redis"""
        try:
            current_time = int(time.time())
            
            # Clé Redis pour l'activité de l'utilisateur
            activity_key = f"user_activity:{user_id}"
            
            # Enregistrer le timestamp de la dernière activité
            self.redis.set(activity_key, current_time)
            
            # Définir une expiration pour nettoyer automatiquement les anciennes activités
            # On garde les données 2x plus longtemps que le seuil d'activité
            expiration_seconds = self.activity_threshold_minutes * 60 * 2
            self.redis.expire(activity_key, expiration_seconds)
            
            # Optionnel: Enregistrer des métadonnées sur l'activité
            activity_meta_key = f"user_activity_meta:{user_id}"
            activity_meta = {
                "last_endpoint": str(request.url.path),
                "last_method": request.method,
                "last_ip": request.client.host if request.client else "unknown",
                "last_user_agent": request.headers.get("user-agent", "unknown")
            }
            
            # Stocker les métadonnées avec expiration
            self.redis.hset(activity_meta_key, mapping=activity_meta)
            self.redis.expire(activity_meta_key, expiration_seconds)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement de l'activité pour l'utilisateur {user_id}: {e}")
    
    def get_user_last_activity(self, user_id: str) -> int | None:
        """Récupère le timestamp de la dernière activité d'un utilisateur"""
        try:
            activity_key = f"user_activity:{user_id}"
            last_activity = self.redis.get(activity_key)
            return int(last_activity) if last_activity else None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'activité pour l'utilisateur {user_id}: {e}")
            return None
    
    def is_user_online(self, user_id: str) -> bool:
        """Détermine si un utilisateur est en ligne basé sur son activité récente"""
        try:
            last_activity = self.get_user_last_activity(user_id)
            if not last_activity:
                return False
            
            current_time = int(time.time())
            time_diff_minutes = (current_time - last_activity) / 60
            
            return time_diff_minutes <= self.activity_threshold_minutes
        except Exception as e:
            logger.error(f"Erreur lors de la vérification du statut en ligne pour l'utilisateur {user_id}: {e}")
            return False
