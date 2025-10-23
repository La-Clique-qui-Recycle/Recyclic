import logging
import time
from typing import Dict, Optional

from sqlalchemy.orm import Session

from recyclic_api.core.redis import get_redis
from recyclic_api.models.setting import Setting

logger = logging.getLogger(__name__)

DEFAULT_ACTIVITY_THRESHOLD_MINUTES = 15
_SETTINGS_CACHE_TTL_SECONDS = 60


class ActivityService:
    """Service utilitaire pour la gestion de l'activité utilisateur en temps réel."""

    KEY_PREFIX = "last_activity"
    META_PREFIX = "last_activity_meta"
    LOGOUT_PREFIX = "last_logout"

    _cached_threshold_minutes = DEFAULT_ACTIVITY_THRESHOLD_MINUTES
    _cache_expiration_timestamp = 0.0

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.redis = get_redis()

    @classmethod
    def _cache_is_valid(cls) -> bool:
        return cls._cache_expiration_timestamp > time.time()

    @classmethod
    def _update_cache(cls, value: int) -> None:
        cls._cached_threshold_minutes = value
        cls._cache_expiration_timestamp = time.time() + _SETTINGS_CACHE_TTL_SECONDS

    @classmethod
    def refresh_cache(cls, value: int) -> None:
        """Met à jour explicitement le cache du seuil d'activité."""
        cls._update_cache(value)

    def get_activity_threshold_minutes(self) -> int:
        """Récupère le seuil d'activité (en minutes), avec un cache léger."""
        cls = type(self)
        if cls._cache_is_valid():
            return cls._cached_threshold_minutes

        threshold_minutes = DEFAULT_ACTIVITY_THRESHOLD_MINUTES
        if self.db is not None:
            try:
                setting = (
                    self.db.query(Setting)
                    .filter(Setting.key == "activity_threshold_minutes")
                    .first()
                )
                if setting is not None:
                    candidate = int(str(setting.value))
                    if candidate > 0:
                        threshold_minutes = candidate
            except (ValueError, TypeError):
                logger.warning(
                    "Valeur invalide pour activity_threshold_minutes, utilisation de la valeur par défaut."
                )
            except Exception as exc:
                logger.error(
                    "Erreur lors de la récupération du seuil d'activité : %s", exc
                )

        cls._update_cache(threshold_minutes)
        return threshold_minutes

    def _activity_key(self, user_id: str) -> str:
        return f"{self.KEY_PREFIX}:{user_id}"

    def _meta_key(self, user_id: str) -> str:
        return f"{self.META_PREFIX}:{user_id}"

    def _logout_key(self, user_id: str) -> str:
        return f"{self.LOGOUT_PREFIX}:{user_id}"

    def record_user_activity(
        self,
        user_id: str,
        metadata: Optional[Dict[str, str]] = None,
        threshold_override: Optional[int] = None,
    ) -> Optional[int]:
        """Enregistre la dernière activité de l'utilisateur dans Redis."""
        if not user_id:
            return None

        timestamp = int(time.time())
        threshold_minutes = threshold_override or self.get_activity_threshold_minutes()
        expiration_seconds = max(int(threshold_minutes * 60 * 2), threshold_minutes * 60)

        try:
            activity_key = self._activity_key(user_id)
            self.redis.set(activity_key, timestamp, ex=expiration_seconds)

            # Une nouvelle activité rend obsolète un éventuel marqueur de déconnexion
            self.redis.delete(self._logout_key(user_id))

            if metadata:
                meta_key = self._meta_key(user_id)
                self.redis.hset(meta_key, mapping=metadata)
                self.redis.expire(meta_key, expiration_seconds)

            return timestamp
        except Exception as exc:
            logger.warning(
                "Impossible d'enregistrer l'activité pour l'utilisateur %s : %s",
                user_id,
                exc,
            )
            return None

    def record_logout(self, user_id: str) -> Optional[int]:
        """Enregistre la dernière déconnexion de l'utilisateur."""
        if not user_id:
            return None

        try:
            timestamp = int(time.time())
            threshold_minutes = self.get_activity_threshold_minutes()
            expiration_seconds = max(int(threshold_minutes * 60 * 2), threshold_minutes * 60)
            logout_key = self._logout_key(user_id)
            self.redis.set(logout_key, timestamp, ex=expiration_seconds)
            return timestamp
        except Exception as exc:
            logger.warning(
                "Impossible d'enregistrer la déconnexion pour l'utilisateur %s : %s",
                user_id,
                exc,
            )
            return None

    def clear_user_activity(self, user_id: str) -> None:
        """Supprime l'activité et les métadonnées dans Redis puis enregistre la déconnexion."""
        if not user_id:
            return

        try:
            activity_key = self._activity_key(user_id)
            meta_key = self._meta_key(user_id)
            self.redis.delete(activity_key, meta_key)
            self.record_logout(user_id)
        except Exception as exc:
            logger.warning(
                "Impossible de supprimer l'activité pour l'utilisateur %s : %s",
                user_id,
                exc,
            )

    def get_last_activity_timestamp(self, user_id: str) -> Optional[int]:
        """Retourne le timestamp de la dernière activité enregistrée."""
        if not user_id:
            return None

        try:
            value = self.redis.get(self._activity_key(user_id))
            if value is None:
                return None
            return int(value)
        except (TypeError, ValueError):
            logger.debug(
                "Valeur d'activité invalide détectée pour l'utilisateur %s, suppression de la clé.",
                user_id,
            )
            self.clear_user_activity(user_id)
            return None
        except Exception as exc:
            logger.warning(
                "Impossible de récupérer l'activité pour l'utilisateur %s : %s",
                user_id,
                exc,
            )
            return None

    def get_minutes_since_activity(self, user_id: str) -> Optional[float]:
        """Calcule le nombre de minutes écoulées depuis la dernière activité."""
        last_activity = self.get_last_activity_timestamp(user_id)
        if last_activity is None:
            return None

        return (time.time() - last_activity) / 60

    def get_last_logout_timestamp(self, user_id: str) -> Optional[int]:
        """Retourne le timestamp de la dernière déconnexion enregistrée."""
        if not user_id:
            return None

        try:
            value = self.redis.get(self._logout_key(user_id))
            if value is None:
                return None
            return int(value)
        except (TypeError, ValueError):
            logger.debug(
                "Valeur de déconnexion invalide détectée pour l'utilisateur %s, suppression de la clé.",
                user_id,
            )
            self.redis.delete(self._logout_key(user_id))
            return None
        except Exception as exc:
            logger.warning(
                "Impossible de récupérer la déconnexion pour l'utilisateur %s : %s",
                user_id,
                exc,
            )
            return None
