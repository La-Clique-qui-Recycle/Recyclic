"""
Tests unitaires pour l'endpoint /auth/login
Story auth.B - Backend CLI adaptation - Tests d'intégration username/password
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password


class TestAuthLoginEndpoint:
    """Tests d'intégration pour l'endpoint POST /api/v1/auth/login avec username/password"""

    def test_login_success_valid_credentials(self, db_session: Session):
        """Test de connexion réussie avec des identifiants valides"""
        client = TestClient(app)
        
        # Créer un utilisateur de test avec mot de passe haché
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="testuser_endpoint",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Test de connexion
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser_endpoint",
                "password": "testpassword123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser_endpoint"
        assert data["user"]["role"] == "user"
        assert data["user"]["is_active"] is True

    def test_login_failure_invalid_username(self, db_session: Session):
        """Test d'échec de connexion avec un nom d'utilisateur invalide"""
        client = TestClient(app)
        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent_user",
                "password": "anypassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_failure_invalid_password(self, db_session: Session):
        """Test d'échec de connexion avec un mot de passe incorrect"""
        client = TestClient(app)
        
        # Créer un utilisateur de test
        hashed_password = hash_password("correctpassword")
        test_user = User(
            username="testuser_wrong_pass",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser_wrong_pass",
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_failure_inactive_user(self, db_session: Session):
        """Test d'échec de connexion avec un utilisateur inactif"""
        client = TestClient(app)
        
        # Créer un utilisateur inactif
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="inactive_user",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False
        )
        db_session.add(test_user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "inactive_user",
                "password": "testpassword123"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_validation_error_missing_username(self):
        """Test de validation avec username manquant"""
        client = TestClient(app)
        
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "testpassword123"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_validation_error_missing_password(self):
        """Test de validation avec password manquant"""
        client = TestClient(app)
        
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_validation_error_empty_credentials(self):
        """Test de validation avec des identifiants vides"""
        client = TestClient(app)
        
        response = client.post(
            "/api/v1/auth/login",
            json={}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_success_admin_user(self, db_session: Session):
        """Test de connexion réussie avec un utilisateur admin"""
        client = TestClient(app)
        
        hashed_password = hash_password("adminpass123")
        admin_user = User(
            username="admin_endpoint",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "admin_endpoint",
                "password": "adminpass123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert "access_token" in data

    def test_login_success_super_admin_user(self, db_session: Session):
        """Test de connexion réussie avec un super-admin"""
        client = TestClient(app)
        
        hashed_password = hash_password("superadminpass123")
        super_admin = User(
            username="superadmin_endpoint",
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "superadmin_endpoint",
                "password": "superadminpass123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "super-admin"
        assert "access_token" in data

    def test_jwt_token_structure(self, db_session: Session):
        """Test de la structure du token JWT généré"""
        client = TestClient(app)
        
        hashed_password = hash_password("tokentest123")
        test_user = User(
            username="jwt_test_endpoint",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "jwt_test_endpoint",
                "password": "tokentest123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        
        # Vérifier que le token est une chaîne non vide
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Le token devrait contenir des points (structure JWT)
        assert "." in data["access_token"]
        assert data["access_token"].count(".") == 2

    def test_password_case_sensitivity(self, db_session: Session):
        """Test que l'authentification par mot de passe est sensible à la casse"""
        client = TestClient(app)
        
        hashed_password = hash_password("CaseSensitive123")
        test_user = User(
            username="case_test_endpoint",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Test avec la bonne casse
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "case_test_endpoint",
                "password": "CaseSensitive123"
            }
        )
        assert response.status_code == 200

        # Test avec mauvaise casse
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "case_test_endpoint",
                "password": "casesensitive123"
            }
        )
        assert response.status_code == 401