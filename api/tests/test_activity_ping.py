"""
Tests pour l'endpoint de ping d'activité utilisateur.
"""
import time
import jwt
from fastapi.testclient import TestClient

import sys
import types

if "reportlab" not in sys.modules:
    reportlab = types.ModuleType("reportlab")
    lib = types.ModuleType("reportlab.lib")
    colors = types.ModuleType("reportlab.lib.colors")
    colors.HexColor = lambda value: value
    pagesizes = types.ModuleType("reportlab.lib.pagesizes")
    pagesizes.A4 = (0, 0)
    styles = types.ModuleType("reportlab.lib.styles")
    class _Dummy:
        def __init__(self, *args, **kwargs):
            pass

    styles.getSampleStyleSheet = lambda: {}
    styles.ParagraphStyle = _Dummy
    units = types.ModuleType("reportlab.lib.units")
    units.cm = 1
    enums = types.ModuleType("reportlab.lib.enums")
    enums.TA_CENTER = 1
    enums.TA_LEFT = 0
    platypus = types.ModuleType("reportlab.platypus")
    platypus.SimpleDocTemplate = _Dummy
    platypus.Table = _Dummy
    platypus.TableStyle = _Dummy
    platypus.Paragraph = _Dummy
    platypus.Spacer = _Dummy
    platypus.PageBreak = _Dummy
    platypus.KeepTogether = _Dummy
    sys.modules["reportlab"] = reportlab
    sys.modules["reportlab.lib"] = lib
    sys.modules["reportlab.lib.colors"] = colors
    sys.modules["reportlab.lib.pagesizes"] = pagesizes
    sys.modules["reportlab.lib.styles"] = styles
    sys.modules["reportlab.lib.units"] = units
    sys.modules["reportlab.lib.enums"] = enums
    sys.modules["reportlab.platypus"] = platypus
from recyclic_api.main import app
from recyclic_api.core.redis import get_redis


class TestActivityPing:
    """Vérifie l'enregistrement d'activité en temps réel via l'endpoint /v1/activity/ping."""

    def setup_method(self):
        self.client = TestClient(app)
        self.redis_client = get_redis()

        # Nettoyer les clés Redis d'activité avant chaque test
        activity_keys = self.redis_client.keys("last_activity:*")
        if activity_keys:
            self.redis_client.delete(*activity_keys)

        meta_keys = self.redis_client.keys("last_activity_meta:*")
        if meta_keys:
            self.redis_client.delete(*meta_keys)

    def _login(self) -> str:
        """Retourne un access_token valide pour le super admin de test."""
        response = self.client.post(
            "/v1/auth/login",
            json={"username": "superadmintest1", "password": "Test1234!"},
        )
        assert response.status_code == 200, response.text
        return response.json()["access_token"]

    @staticmethod
    def _user_id_from_token(token: str) -> str:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload["sub"]

    def test_ping_records_activity(self):
        token = self._login()

        response = self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json().get("status") == "ok"

        user_id = self._user_id_from_token(token)
        activity_key = f"last_activity:{user_id}"
        last_activity = self.redis_client.get(activity_key)

        assert last_activity is not None
        delta = int(time.time()) - int(last_activity)
        assert delta < 60  # L'activité doit être récente

    def test_ping_requires_authentication(self):
        response = self.client.post("/v1/activity/ping")
        assert response.status_code == 401

        # Vérifier qu'aucune clé n'a été créée
        keys = self.redis_client.keys("last_activity:*")
        assert not keys

    def test_ping_with_invalid_token(self):
        response = self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": "Bearer invalid"},
        )
        assert response.status_code == 401

        keys = self.redis_client.keys("last_activity:*")
        assert not keys

    def test_activity_expiration_ttl(self):
        token = self._login()
        user_id = self._user_id_from_token(token)
        activity_key = f"last_activity:{user_id}"

        self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": f"Bearer {token}"},
        )

        ttl = self.redis_client.ttl(activity_key)
        assert ttl > 0
        assert ttl <= 1800  # 15 minutes * 2 = 30 minutes max

    def test_multiple_pings_update_timestamp(self):
        token = self._login()
        user_id = self._user_id_from_token(token)
        activity_key = f"last_activity:{user_id}"

        self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": f"Bearer {token}"},
        )
        first_value = int(self.redis_client.get(activity_key))

        time.sleep(1)

        self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": f"Bearer {token}"},
        )
        second_value = int(self.redis_client.get(activity_key))

        assert second_value > first_value

    def test_metadata_storage(self):
        token = self._login()
        user_id = self._user_id_from_token(token)
        meta_key = f"last_activity_meta:{user_id}"

        response = self.client.post(
            "/v1/activity/ping",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        metadata = self.redis_client.hgetall(meta_key)
        assert metadata
        assert metadata["last_endpoint"] == "/v1/activity/ping"
        assert metadata["last_method"] == "POST"
        assert "last_ip" in metadata
        assert "last_user_agent" in metadata
