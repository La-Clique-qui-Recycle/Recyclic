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
from recyclic_api.core.config import settings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
import uuid
import os
from typing import Generator

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

# E2E Test Database URL
TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_e2e_test"

def ensure_test_database(url: str) -> None:
    u = make_url(url)
    admin_url = u.set(database="postgres")
    dbname = u.database
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": dbname}).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{dbname}"'))
    admin_engine.dispose()

def create_schema(url: str) -> None:
    """Create schema using SQLAlchemy directly"""
    from recyclic_api.core.database import Base
    test_engine = create_engine(url, pool_pre_ping=True)
    Base.metadata.create_all(bind=test_engine)
    test_engine.dispose()

def drop_schema(url: str) -> None:
    test_engine = create_engine(url, pool_pre_ping=True)
    from recyclic_api.core.database import Base
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()

def get_test_session_factory(url: str):
    engine = create_engine(url, pool_pre_ping=True)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def e2e_client() -> Generator[TestClient, None, None]:
    """Client for E2E tests with real authentication (no mocks)"""
    ensure_test_database(TEST_DB_URL)
    create_schema(TEST_DB_URL)

    TestingSessionLocal = get_test_session_factory(TEST_DB_URL)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Create test users in database
    db = TestingSessionLocal()
    try:
        # Create admin test user (generate UUID from string ID for consistency)
        admin_user = User(
            id=uuid.UUID(get_admin_uuid()),
            telegram_id=TEST_ADMIN_USER["telegram_id"],
            username=TEST_ADMIN_USER["username"],
            first_name=TEST_ADMIN_USER["first_name"],
            last_name=TEST_ADMIN_USER["last_name"],
            role=TEST_ADMIN_USER["role"],
            status=TEST_ADMIN_USER["status"],
            is_active=TEST_ADMIN_USER["is_active"]
        )

        # Create regular test user (generate UUID from string ID for consistency)
        regular_user = User(
            id=uuid.UUID(get_user_uuid()),
            telegram_id=TEST_USER["telegram_id"],
            username=TEST_USER["username"],
            first_name=TEST_USER["first_name"],
            last_name=TEST_USER["last_name"],
            role=TEST_USER["role"],
            status=TEST_USER["status"],
            is_active=TEST_USER["is_active"]
        )

        db.add(admin_user)
        db.add(regular_user)
        db.commit()
    finally:
        db.close()

    c = TestClient(app)
    try:
        yield c
    finally:
        app.dependency_overrides.clear()
        drop_schema(TEST_DB_URL)

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
def test_db():
    """Base de données de test avec des utilisateurs"""
    # Cette fixture sera configurée par pytest avec la base de test
    pass

class TestAdminE2E:
    """Tests d'intégration E2E pour l'administration"""
    
    def test_admin_can_list_users(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Un admin peut lister les utilisateurs"""
        response = e2e_client.get("/api/v1/admin/users", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 0  # Au moins 0 utilisateurs (peut être vide)
        
        # Vérifier la structure des données
        if data:
            user = data[0]
            assert "id" in user
            assert "telegram_id" in user
            assert "role" in user
            assert "status" in user
            assert "is_active" in user
    
    def test_admin_can_filter_users_by_role(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Un admin peut filtrer les utilisateurs par rôle"""
        response = e2e_client.get(
            "/api/v1/admin/users?role=user", 
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Vérifier que tous les utilisateurs retournés ont le rôle "user"
        for user in data:
            assert user["role"] == "user"
    
    def test_admin_can_filter_users_by_status(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Un admin peut filtrer les utilisateurs par statut"""
        response = e2e_client.get(
            "/api/v1/admin/users?status=approved", 
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Vérifier que tous les utilisateurs retournés ont le statut "approved"
        for user in data:
            assert user["status"] == "approved"
    
    def test_admin_can_update_user_role(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Un admin peut modifier le rôle d'un utilisateur"""
        # Utilise l'ID UUID généré pour l'utilisateur de test
        user_id = get_user_uuid()
        new_role = "cashier"
        
        response = e2e_client.put(
            f"/api/v1/admin/users/{user_id}/role",
            json={"role": new_role},
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["role"] == new_role
        assert "previous_role" in data["data"]
    
    def test_admin_cannot_downgrade_own_role(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Un admin ne peut pas se déclasser lui-même"""
        admin_id = get_admin_uuid()
        new_role = "user"
        
        response = e2e_client.put(
            f"/api/v1/admin/users/{admin_id}/role",
            json={"role": new_role},
            headers=admin_headers
        )
        
        # Devrait échouer avec une erreur 403 ou 400
        assert response.status_code in [400, 403]
        data = response.json()
        assert "detail" in data
        assert "dégrader" in data["detail"]
    
    def test_regular_user_cannot_access_admin_endpoints(self, e2e_client: TestClient, user_headers, test_db):
        """Test : Un utilisateur normal ne peut pas accéder aux endpoints admin"""
        # Test de l'endpoint de liste des utilisateurs
        response = e2e_client.get("/api/v1/admin/users", headers=user_headers)
        assert response.status_code == 403
        
        # Test de l'endpoint de modification de rôle
        response = e2e_client.put(
            "/api/v1/admin/users/some-id/role",
            json={"role": "admin"},
            headers=user_headers
        )
        assert response.status_code == 403
    
    def test_unauthenticated_user_cannot_access_admin_endpoints(self, e2e_client: TestClient, test_db):
        """Test : Un utilisateur non authentifié ne peut pas accéder aux endpoints admin"""
        # Test de l'endpoint de liste des utilisateurs
        response = e2e_client.get("/api/v1/admin/users")
        assert response.status_code == 403  # HTTPBearer returns 403 when no auth header

        # Test de l'endpoint de modification de rôle
        response = e2e_client.put(
            "/api/v1/admin/users/some-id/role",
            json={"role": "admin"}
        )
        assert response.status_code == 403  # HTTPBearer returns 403 when no auth header
    
    def test_admin_pagination_works(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : La pagination fonctionne correctement"""
        response = e2e_client.get(
            "/api/v1/admin/users?skip=0&limit=5",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5  # Ne devrait pas dépasser la limite
    
    def test_invalid_role_update_fails(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Mise à jour avec un rôle invalide échoue"""
        user_id = get_user_uuid()
        
        response = e2e_client.put(
            f"/api/v1/admin/users/{user_id}/role",
            json={"role": "invalid_role"},
            headers=admin_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_nonexistent_user_update_fails(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Mise à jour d'un utilisateur inexistant échoue"""
        nonexistent_id = "nonexistent-user-123"
        
        response = e2e_client.put(
            f"/api/v1/admin/users/{nonexistent_id}/role",
            json={"role": "cashier"},
            headers=admin_headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "non trouvé" in data["detail"].lower()

class TestAdminSecurity:
    """Tests de sécurité pour l'administration"""
    
    def test_token_expiration_handling(self, e2e_client: TestClient, test_db):
        """Test : Gestion de l'expiration des tokens"""
        # Créer un token expiré (simulation)
        expired_token = create_access_token(
            {"sub": "admin-test-123"}, 
            expires_delta=timedelta(seconds=-1)  # Token expiré
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        
        response = e2e_client.get("/api/v1/admin/users", headers=headers)
        assert response.status_code == 401
    
    def test_invalid_token_handling(self, e2e_client: TestClient, test_db):
        """Test : Gestion des tokens invalides"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = e2e_client.get("/api/v1/admin/users", headers=headers)
        assert response.status_code == 401
    
    def test_missing_token_handling(self, e2e_client: TestClient, test_db):
        """Test : Gestion des requêtes sans token"""
        response = e2e_client.get("/api/v1/admin/users")
        assert response.status_code == 403  # HTTPBearer returns 403 when no auth header

# Tests de performance
class TestAdminPerformance:
    """Tests de performance pour l'administration"""
    
    def test_admin_endpoints_response_time(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Les endpoints admin répondent dans un temps raisonnable"""
        import time
        
        start_time = time.time()
        response = e2e_client.get("/api/v1/admin/users", headers=admin_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 2.0  # Moins de 2 secondes
    
    def test_large_user_list_handling(self, e2e_client: TestClient, admin_headers, test_db):
        """Test : Gestion d'une grande liste d'utilisateurs"""
        # Test avec une limite élevée
        response = e2e_client.get(
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
