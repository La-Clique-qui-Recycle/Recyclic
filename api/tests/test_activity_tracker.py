"""
Tests pour le middleware de suivi d'activité
"""
import pytest
import time
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from recyclic_api.main import app
from recyclic_api.core.redis import get_redis

class TestActivityTracker:
    """Tests pour le middleware de suivi d'activité"""
    
    def setup_method(self):
        """Setup pour chaque test"""
        self.client = TestClient(app)
        self.redis_client = get_redis()
        
        # Nettoyer Redis avant chaque test
        keys = self.redis_client.keys("user_activity:*")
        if keys:
            self.redis_client.delete(*keys)
    
    def test_activity_tracking_with_valid_token(self):
        """Test que l'activité est enregistrée avec un token valide"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Faire une requête authentifiée
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Vérifier que l'activité a été enregistrée dans Redis
        # Le token contient l'user_id, on peut l'extraire
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload["sub"]
        
        activity_key = f"user_activity:{user_id}"
        last_activity = self.redis_client.get(activity_key)
        
        assert last_activity is not None
        assert int(last_activity) > 0
        
        # Vérifier que l'activité est récente (moins de 1 minute)
        current_time = int(time.time())
        activity_time = int(last_activity)
        time_diff = current_time - activity_time
        
        assert time_diff < 60  # Moins d'une minute
    
    def test_activity_tracking_without_token(self):
        """Test qu'aucune activité n'est enregistrée sans token"""
        # Faire une requête sans authentification
        response = self.client.get("/v1/admin/users/statuses")
        assert response.status_code == 401  # Non autorisé
        
        # Vérifier qu'aucune activité n'a été enregistrée
        keys = self.redis_client.keys("user_activity:*")
        assert len(keys) == 0
    
    def test_activity_tracking_with_invalid_token(self):
        """Test qu'aucune activité n'est enregistrée avec un token invalide"""
        # Faire une requête avec un token invalide
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401  # Non autorisé
        
        # Vérifier qu'aucune activité n'a été enregistrée
        keys = self.redis_client.keys("user_activity:*")
        assert len(keys) == 0
    
    def test_activity_expiration(self):
        """Test que l'activité expire correctement"""
        # Obtenir un token valide
        login_response = self.client.post("/v1/auth/login", json={
            "username": "superadmintest1",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Faire une requête authentifiée
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Vérifier que l'activité a été enregistrée
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload["sub"]
        
        activity_key = f"user_activity:{user_id}"
        last_activity = self.redis_client.get(activity_key)
        assert last_activity is not None
        
        # Vérifier que la clé a une expiration
        ttl = self.redis_client.ttl(activity_key)
        assert ttl > 0  # La clé a une expiration
        assert ttl <= 1800  # Maximum 30 minutes (2x le seuil de 15 minutes)
    
    def test_multiple_requests_update_activity(self):
        """Test que plusieurs requêtes mettent à jour l'activité"""
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
        activity_key = f"user_activity:{user_id}"
        
        # Première requête
        response1 = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response1.status_code == 200
        
        first_activity = self.redis_client.get(activity_key)
        assert first_activity is not None
        
        # Attendre un peu
        time.sleep(1)
        
        # Deuxième requête
        response2 = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response2.status_code == 200
        
        second_activity = self.redis_client.get(activity_key)
        assert second_activity is not None
        
        # Vérifier que l'activité a été mise à jour
        assert int(second_activity) > int(first_activity)
    
    def test_activity_metadata_storage(self):
        """Test que les métadonnées d'activité sont stockées"""
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
        
        # Faire une requête authentifiée
        response = self.client.get(
            "/v1/admin/users/statuses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Vérifier que les métadonnées ont été stockées
        meta_key = f"user_activity_meta:{user_id}"
        metadata = self.redis_client.hgetall(meta_key)
        
        assert "last_endpoint" in metadata
        assert "last_method" in metadata
        assert "last_ip" in metadata
        assert "last_user_agent" in metadata
        
        assert metadata["last_endpoint"] == "/v1/admin/users/statuses"
        assert metadata["last_method"] == "GET"

