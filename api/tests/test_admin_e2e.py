"""
Tests d'intégration E2E pour l'interface d'administration
Valide le workflow complet de gestion des utilisateurs
"""

import pytest
import asyncio
from datetime import timedelta
from httpx import AsyncClient
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from recyclic_api.main import app
from recyclic_api.core.database import get_db
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.security import hash_password
from recyclic_api.core.config import settings
from recyclic_api.schemas.admin import AdminResponse, AdminUser
import uuid

# Configuration de test
TEST_ADMIN_USER = {
    "id": "admin-test-123",
    "telegram_id": "123456789",
    "username": "admin_test",
    "first_name": "Admin",
    "last_name": "Test",
    "role": UserRole.ADMIN,
    "status": UserStatus.APPROVED,
    "is_active": True
}

TEST_USER = {
    "id": "user-test-456",
    "telegram_id": "987654321",
    "username": "user_test",
    "first_name": "User",
    "last_name": "Test",
    "role": UserRole.USER,
    "status": UserStatus.APPROVED,
    "is_active": True
}

# Helper functions to get consistent UUIDs
def get_admin_uuid():
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, TEST_ADMIN_USER["id"]))

def get_user_uuid():
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, TEST_USER["id"]))


@pytest.fixture
def admin_token():
    """Token JWT pour un utilisateur admin"""
    return create_access_token({"sub": get_admin_uuid()})

@pytest.fixture
def user_token():
    """Token JWT pour un utilisateur normal"""
    return create_access_token({"sub": get_user_uuid()})

@pytest.fixture
def admin_headers(admin_token):
    """Headers d'authentification pour admin"""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def user_headers(user_token):
    """Headers d'authentification pour utilisateur normal"""
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def test_db(db_session):
    """Base de données de test avec des utilisateurs"""
    admin_uuid = uuid.UUID(get_admin_uuid())
    user_uuid = uuid.UUID(get_user_uuid())
    
    # Vérifier si l'utilisateur admin existe déjà
    existing_admin = db_session.query(User).filter(User.id == admin_uuid).first()
    if not existing_admin:
        admin_user = User(
            id=admin_uuid,
            telegram_id=TEST_ADMIN_USER["telegram_id"],
            username=TEST_ADMIN_USER["username"],
            first_name=TEST_ADMIN_USER["first_name"],
            last_name=TEST_ADMIN_USER["last_name"],
            role=TEST_ADMIN_USER["role"],
            status=TEST_ADMIN_USER["status"],
            is_active=TEST_ADMIN_USER["is_active"],
            hashed_password=hash_password("admin_password")
        )
        db_session.add(admin_user)
    
    # Vérifier si l'utilisateur normal existe déjà
    existing_user = db_session.query(User).filter(User.id == user_uuid).first()
    if not existing_user:
        normal_user = User(
            id=user_uuid,
            telegram_id=TEST_USER["telegram_id"],
            username=TEST_USER["username"],
            first_name=TEST_USER["first_name"],
            last_name=TEST_USER["last_name"],
            role=TEST_USER["role"],
            status=TEST_USER["status"],
            is_active=TEST_USER["is_active"],
            hashed_password=hash_password("user_password")
        )
        db_session.add(normal_user)
    
    db_session.commit()
    return db_session

class TestAdminE2E:
    """Tests d'intégration E2E pour l'administration"""
    
    def test_admin_can_list_users(self, client: TestClient, admin_headers, test_db):
        """Test : Un admin peut lister les utilisateurs"""
        response = client.get("/api/v1/admin/users", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 0  # Au moins 0 utilisateurs (peut être vide)
        
        # Validation du schéma Pydantic pour chaque utilisateur
        for user_data in data:
            try:
                validated_user = AdminUser(**user_data)
                # Vérifications supplémentaires sur le contenu
                assert validated_user.id is not None
                assert validated_user.telegram_id is not None
                assert validated_user.role in [role.value for role in UserRole]
                assert validated_user.status in [status.value for status in UserStatus]
                assert isinstance(validated_user.is_active, bool)
                assert validated_user.created_at is not None
                assert validated_user.updated_at is not None
            except Exception as e:
                pytest.fail(f"Validation Pydantic échouée pour l'utilisateur {user_data}: {e}")
    
    def test_admin_can_filter_users_by_role(self, client: TestClient, admin_headers, test_db):
        """Test : Un admin peut filtrer les utilisateurs par rôle"""
        response = client.get(
            "/api/v1/admin/users?role=user", 
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Validation du schéma Pydantic et vérification du contenu
        for user_data in data:
            try:
                validated_user = AdminUser(**user_data)
                # Vérifier que tous les utilisateurs retournés ont le rôle "user"
                assert validated_user.role == UserRole.USER
                # Vérifications supplémentaires
                assert validated_user.id is not None
                assert validated_user.telegram_id is not None
                assert validated_user.status in [status.value for status in UserStatus]
                assert isinstance(validated_user.is_active, bool)
            except Exception as e:
                pytest.fail(f"Validation Pydantic échouée pour l'utilisateur {user_data}: {e}")
    
    def test_admin_can_filter_users_by_status(self, client: TestClient, admin_headers, test_db):
        """Test : Un admin peut filtrer les utilisateurs par statut"""
        response = client.get(
            "/api/v1/admin/users?status=approved", 
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Validation du schéma Pydantic et vérification du contenu
        for user_data in data:
            try:
                validated_user = AdminUser(**user_data)
                # Vérifier que tous les utilisateurs retournés ont le statut "approved"
                assert validated_user.status == UserStatus.APPROVED
                # Vérifications supplémentaires
                assert validated_user.id is not None
                assert validated_user.telegram_id is not None
                assert validated_user.role in [role.value for role in UserRole]
                assert isinstance(validated_user.is_active, bool)
            except Exception as e:
                pytest.fail(f"Validation Pydantic échouée pour l'utilisateur {user_data}: {e}")
    
    def test_admin_can_update_user_role(self, client: TestClient, admin_headers, test_db):
        """Test : Un admin peut modifier le rôle d'un utilisateur"""
        # Utilise l'ID UUID généré pour l'utilisateur de test
        user_id = uuid.UUID(get_user_uuid())
        new_role = "cashier"
        
        response = client.put(
            f"/api/v1/admin/users/{user_id}/role",
            json={"role": new_role},
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validation du schéma Pydantic de la réponse
        try:
            validated_response = AdminResponse(**data)
            assert validated_response.success is True
            assert validated_response.message is not None
            assert validated_response.data is not None
            
            # Vérifications sur le contenu des données
            response_data = validated_response.data
            assert response_data["role"] == new_role
            assert "previous_role" in response_data
            assert response_data["previous_role"] in [role.value for role in UserRole]
            assert response_data["role"] in [role.value for role in UserRole]
        except Exception as e:
            pytest.fail(f"Validation Pydantic échouée pour la réponse de mise à jour: {e}")
    
    def test_admin_cannot_downgrade_own_role(self, client: TestClient, admin_headers, test_db):
        """Test : Un admin ne peut pas se déclasser lui-même"""
        admin_id = uuid.UUID(get_admin_uuid())
        new_role = "user"
        
        response = client.put(
            f"/api/v1/admin/users/{admin_id}/role",
            json={"role": new_role},
            headers=admin_headers
        )
        
        # Devrait échouer avec une erreur 403 ou 400
        assert response.status_code in [400, 403]
        data = response.json()
        assert "detail" in data
        assert "dégrader" in data["detail"]
    
    def test_regular_user_cannot_access_admin_endpoints(self, client: TestClient, user_headers, test_db):
        """Test : Un utilisateur normal ne peut pas accéder aux endpoints admin"""
        # Test de l'endpoint de liste des utilisateurs
        response = client.get("/api/v1/admin/users", headers=user_headers)
        assert response.status_code == 403
        
        # Test de l'endpoint de modification de rôle
        response = client.put(
            "/api/v1/admin/users/some-id/role",
            json={"role": "admin"},
            headers=user_headers
        )
        assert response.status_code == 403
    
    def test_unauthenticated_user_cannot_access_admin_endpoints(self, client: TestClient):
        """Les utilisateurs non authentifiés reçoivent une erreur 401."""
        endpoints = [
            "/api/v1/admin/users",
            "/api/v1/admin/users/pending",
            # Ajoutez d'autres endpoints admin ici
        ]
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401, f"Failed on endpoint {endpoint}"
    
    def test_admin_pagination_works(self, client: TestClient, admin_headers, test_db):
        """Test : La pagination fonctionne correctement"""
        response = client.get(
            "/api/v1/admin/users?skip=0&limit=5",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5  # Ne devrait pas dépasser la limite
    
    def test_invalid_role_update_fails(self, client: TestClient, admin_headers, test_db):
        """Test : Mise à jour avec un rôle invalide échoue"""
        user_id = uuid.UUID(get_user_uuid())
        
        response = client.put(
            f"/api/v1/admin/users/{user_id}/role",
            json={"role": "invalid_role"},
            headers=admin_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_nonexistent_user_update_fails(self, client: TestClient, admin_headers, test_db):
        """Test : Mise à jour d'un utilisateur inexistant échoue"""
        nonexistent_id = "nonexistent-user-123"
        
        response = client.put(
            f"/api/v1/admin/users/{nonexistent_id}/role",
            json={"role": "cashier"},
            headers=admin_headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "non trouvé" in data["detail"].lower()

class TestAdminSecurity:
    """Tests de sécurité pour l'administration"""
    
    def test_token_expiration_handling(self, client: TestClient, test_db):
        """Test : Gestion de l'expiration des tokens"""
        # Créer un token expiré (simulation)
        expired_token = create_access_token(
            {"sub": "admin-test-123"}, 
            expires_delta=timedelta(seconds=-1)  # Token expiré
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        
        response = client.get("/api/v1/admin/users", headers=headers)
        assert response.status_code == 401
    
    def test_invalid_token_handling(self, client: TestClient, test_db):
        """Test : Gestion des tokens invalides"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = client.get("/api/v1/admin/users", headers=headers)
        assert response.status_code == 401
    
    def test_missing_token_handling(self, client: TestClient):
        """Vérifie que les endpoints admin renvoient 401 si le token est manquant."""
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401

# Tests de performance
class TestAdminPerformance:
    """Tests de performance pour l'administration"""
    
    def test_admin_endpoints_response_time(self, client: TestClient, admin_headers, test_db):
        """Test : Les endpoints admin répondent dans un temps raisonnable"""
        import time
        
        start_time = time.time()
        response = client.get("/api/v1/admin/users", headers=admin_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 2.0  # Moins de 2 secondes
    
    def test_large_user_list_handling(self, client: TestClient, admin_headers, test_db):
        """Test : Gestion d'une grande liste d'utilisateurs"""
        # Test avec une limite élevée
        response = client.get(
            "/api/v1/admin/users?limit=100",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 100

if __name__ == "__main__":
    # Exécution des tests en mode standalone
    pytest.main([__file__, "-v"])
