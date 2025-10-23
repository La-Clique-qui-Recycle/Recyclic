import jwt
"""
Tests pour l'endpoint des statuts des utilisateurs
"""
import time
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
from fastapi.testclient import TestClient
from recyclic_api.main import app
from recyclic_api.core.redis import get_redis

class TestUserStatuses:
    """Tests pour l'endpoint des statuts des utilisateurs"""
    
    def setup_method(self):
        """Setup pour chaque test"""
        self.client = TestClient(app)
        self.redis_client = get_redis()
        
        # Nettoyer Redis avant chaque test
        keys = self.redis_client.keys("last_activity:*")
        if keys:
            self.redis_client.delete(*keys)
        meta_keys = self.redis_client.keys("last_activity_meta:*")
        if meta_keys:
            self.redis_client.delete(*meta_keys)
    
    def test_get_user_statuses_requires_auth(self):
        """Test que l'endpoint nécessite une authentification"""
        response = self.client.get("/v1/admin/users/statuses")
        assert response.status_code == 401
    
    def test_get_user_statuses_with_valid_auth(self):
        """Test de récupération des statuts avec authentification valide"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Récupérer les statuts
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_statuses" in data
        assert "total_count" in data
        assert "online_count" in data
        assert "offline_count" in data
        assert "timestamp" in data
        
        # Vérifier que l'utilisateur actuel est en ligne
        user_statuses = data["user_statuses"]
        assert len(user_statuses) > 0
        
        # Trouver l'utilisateur actuel dans la liste
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        current_user_id = payload["sub"]
        
        current_user_status = next(
            (status for status in user_statuses if status["user_id"] == current_user_id),
            None
        )
        assert current_user_status is not None
        assert current_user_status["is_online"] is True
    
    def test_user_statuses_structure(self):
        """Test de la structure de la réponse des statuts"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Récupérer les statuts
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Vérifier la structure de chaque statut utilisateur
        for user_status in data["user_statuses"]:
            assert "user_id" in user_status
            assert "is_online" in user_status
            assert "last_login" in user_status
            assert "minutes_since_login" in user_status
            
            assert isinstance(user_status["user_id"], str)
            assert isinstance(user_status["is_online"], bool)
            assert user_status["last_login"] is None or isinstance(user_status["last_login"], str)
            assert user_status["minutes_since_login"] is None or isinstance(user_status["minutes_since_login"], int)
    
    def test_online_offline_counts(self):
        """Test que les compteurs en ligne/hors ligne sont corrects"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Récupérer les statuts
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Vérifier que les compteurs sont cohérents
        user_statuses = data["user_statuses"]
        online_count = sum(1 for status in user_statuses if status["is_online"])
        offline_count = sum(1 for status in user_statuses if not status["is_online"])
        
        assert data["online_count"] == online_count
        assert data["offline_count"] == offline_count
        assert data["total_count"] == len(user_statuses)
        assert data["total_count"] == online_count + offline_count
    
    def test_redis_activity_priority(self):
        """Test que l'activité Redis a la priorité sur login_history"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload["sub"]
        
        # Simuler une activité récente dans Redis
        activity_key = f"last_activity:{user_id}"
        current_time = int(time.time())
        self.redis_client.set(activity_key, current_time)
        self.redis_client.expire(activity_key, 1800)  # 30 minutes
        
        # Récupérer les statuts
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        user_statuses = data["user_statuses"]
        
        # Trouver l'utilisateur actuel
        current_user_status = next(
            (status for status in user_statuses if status["user_id"] == user_id),
            None
        )
        assert current_user_status is not None
        assert current_user_status["is_online"] is True

    def test_user_offline_after_logout(self):
        """Vérifie qu'un utilisateur est marqué hors ligne immédiatement après sa déconnexion."""
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload["sub"]

        # Enregistrer une activité manuelle
        ping_response = self.client.post("/v1/activity/ping", headers={"Authorization": f"Bearer {token}"})
        assert ping_response.status_code == 200

        # Déconnexion
        logout_response = self.client.post("/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_response.status_code == 200

        # Utiliser un autre compte admin pour consulter les statuts
        admin_login = self.client.post("/v1/auth/login", json={
            "username": "admintest1",
            "password": "Test1234!"
        })
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]

        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        data = response.json()
        status_entry = next(
            (status for status in data["user_statuses"] if status["user_id"] == user_id),
            None
        )
        assert status_entry is not None
        assert status_entry["is_online"] is False
    
    def test_rate_limiting(self):
        """Test que le rate limiting fonctionne"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Faire plusieurs requêtes rapidement
        for i in range(35):  # Plus que la limite de 30/minute
            response = self.client.get(
                "/v1/admin/users/statuses",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if i < 30:
                assert response.status_code == 200
            else:
                # Après la limite, on devrait avoir une erreur de rate limiting
                assert response.status_code == 429

