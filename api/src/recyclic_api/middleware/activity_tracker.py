"""
Middleware pour enregistrer l'activité utilisateur via Redis.
"""
import base64
import json
import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from recyclic_api.services.activity_service import ActivityService

logger = logging.getLogger(__name__)


class ActivityTrackerMiddleware(BaseHTTPMiddleware):
    """Middleware qui enregistre l'activité des utilisateurs authentifiés."""

    def __init__(self, app, activity_threshold_minutes: int = 15):
        super().__init__(app)
        self.activity_threshold_minutes = activity_threshold_minutes
        self.activity_service = ActivityService()

    async def dispatch(self, request: Request, call_next):
        """Traite la requête et enregistre l'activité si l'utilisateur est authentifié."""
        response = await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return response

        token = auth_header.replace("Bearer ", "")
        user_id = self._extract_user_id_from_token(token)

        if user_id:
            metadata = {
                "last_endpoint": str(request.url.path),
                "last_method": request.method,
                "last_ip": request.client.host if request.client else "unknown",
                "last_user_agent": request.headers.get("user-agent", "unknown"),
            }
            try:
                self.activity_service.record_user_activity(
                    user_id,
                    metadata=metadata,
                    threshold_override=self.activity_threshold_minutes,
                )
            except Exception as exc:
                logger.debug(
                    "Impossible d'enregistrer l'activité via le middleware: %s", exc
                )

        return response

    @staticmethod
    def _extract_user_id_from_token(token: str) -> str | None:
        """Extrait l'identifiant utilisateur depuis un JWT (sans vérifier la signature)."""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            payload_encoded = parts[1]
            missing_padding = len(payload_encoded) % 4
            if missing_padding:
                payload_encoded += "=" * (4 - missing_padding)

            payload_bytes = base64.urlsafe_b64decode(payload_encoded)
            payload = json.loads(payload_bytes.decode("utf-8"))
            return payload.get("sub")
        except Exception:
            return None

    def get_user_last_activity(self, user_id: str) -> int | None:
        """Expose le timestamp de la dernière activité (utilisé par les tests)."""
        return self.activity_service.get_last_activity_timestamp(user_id)

    def is_user_online(self, user_id: str) -> bool:
        """Détermine si un utilisateur est en ligne en se basant sur son activité."""
        minutes = self.activity_service.get_minutes_since_activity(user_id)
        if minutes is None:
            return False
        return minutes <= self.activity_threshold_minutes
