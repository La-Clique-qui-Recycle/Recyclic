"""
Tests unitaires pour l'endpoint /auth/signup
Story auth.D - Signup workflow - Tests d'intégration signup
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, verify_password


class TestAuthSignupEndpoint:
    """Tests d'intégration pour l'endpoint POST /api/v1/auth/signup"""

    def test_signup_success_valid_data(self, db_session: Session):
        """Test d'inscription réussie avec des données valides"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "newuser_signup",
                "password": "validpassword123",
                "email": "test@example.com"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "user_id" in data
        assert "status" in data
        assert data["status"] == "pending"
        assert "Compte créé avec succès" in data["message"]
        assert "en attente de validation" in data["message"]

        # Vérifier que l'utilisateur a été créé en base
        result = db_session.execute(select(User).where(User.username == "newuser_signup"))
        created_user = result.scalar_one_or_none()
        assert created_user is not None
        assert created_user.username == "newuser_signup"
        assert created_user.email == "test@example.com"
        assert created_user.role == UserRole.USER
        assert created_user.status == UserStatus.PENDING
        assert created_user.is_active is True

        # Vérifier que le mot de passe est bien haché
        assert verify_password("validpassword123", created_user.hashed_password)

    def test_signup_success_without_email(self, db_session: Session):
        """Test d'inscription réussie sans email (optionnel)"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "user_no_email",
                "password": "validpassword123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"

        # Vérifier que l'utilisateur a été créé sans email
        result = db_session.execute(select(User).where(User.username == "user_no_email"))
        created_user = result.scalar_one_or_none()
        assert created_user is not None
        assert created_user.email is None

    def test_signup_failure_username_already_exists(self, db_session: Session):
        """Test d'échec d'inscription avec un nom d'utilisateur déjà existant"""
        client = TestClient(app)

        # Créer un utilisateur existant
        existing_user = User(
            username="existing_user",
            hashed_password=hash_password("somepassword"),
            role=UserRole.USER,
            status=UserStatus.PENDING
        )
        db_session.add(existing_user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "existing_user",
                "password": "anotherpassword123"
            }
        )

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "nom d'utilisateur est déjà pris" in data["detail"]

    def test_signup_validation_error_missing_username(self):
        """Test de validation avec username manquant"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={"password": "validpassword123"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_validation_error_missing_password(self):
        """Test de validation avec password manquant"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "testuser"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_validation_error_short_username(self):
        """Test de validation avec username trop court"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "ab",  # Moins de 3 caractères
                "password": "validpassword123"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_validation_error_long_username(self):
        """Test de validation avec username trop long"""
        client = TestClient(app)

        long_username = "a" * 51  # Plus de 50 caractères
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": long_username,
                "password": "validpassword123"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_validation_error_short_password(self):
        """Test de validation avec password trop court"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "validuser",
                "password": "short"  # Moins de 8 caractères
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_validation_error_invalid_email(self):
        """Test de validation avec email invalide"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "validuser",
                "password": "validpassword123",
                "email": "invalid-email"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_signup_creates_user_with_correct_defaults(self, db_session: Session):
        """Test que l'inscription crée un utilisateur avec les bonnes valeurs par défaut"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "defaults_test",
                "password": "validpassword123"
            }
        )

        assert response.status_code == 200

        # Vérifier les valeurs par défaut
        result = db_session.execute(select(User).where(User.username == "defaults_test"))
        created_user = result.scalar_one_or_none()
        assert created_user is not None
        assert created_user.role == UserRole.USER
        assert created_user.status == UserStatus.PENDING
        assert created_user.is_active is True
        assert created_user.telegram_id is None
        assert created_user.first_name is None
        assert created_user.last_name is None

    def test_signup_password_hashing(self, db_session: Session):
        """Test que le mot de passe est bien haché et non stocké en clair"""
        client = TestClient(app)

        plain_password = "testhashpassword123"
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "hash_test",
                "password": plain_password
            }
        )

        assert response.status_code == 200

        # Vérifier que le mot de passe n'est pas stocké en clair
        result = db_session.execute(select(User).where(User.username == "hash_test"))
        created_user = result.scalar_one_or_none()
        assert created_user is not None
        assert created_user.hashed_password != plain_password
        assert len(created_user.hashed_password) > 20  # Les hash bcrypt sont longs
        assert created_user.hashed_password.startswith("$2b$")  # Format bcrypt

        # Vérifier que le hash peut être vérifié
        assert verify_password(plain_password, created_user.hashed_password)
        assert not verify_password("wrongpassword", created_user.hashed_password)

    def test_signup_response_structure(self, db_session: Session):
        """Test de la structure de réponse de l'endpoint signup"""
        client = TestClient(app)

        response = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "structure_test",
                "password": "validpassword123",
                "email": "structure@test.com"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Vérifier la structure de la réponse
        required_fields = ["message", "user_id", "status"]
        for field in required_fields:
            assert field in data
            assert data[field] is not None

        # Vérifier les types
        assert isinstance(data["message"], str)
        assert isinstance(data["user_id"], str)
        assert isinstance(data["status"], str)

        # Vérifier que l'user_id est un UUID valide
        import uuid
        try:
            uuid.UUID(data["user_id"])
        except ValueError:
            pytest.fail("user_id should be a valid UUID")

    def test_signup_case_sensitive_username(self, db_session: Session):
        """Test que les noms d'utilisateur sont sensibles à la casse"""
        client = TestClient(app)

        # Créer un utilisateur avec un username en minuscules
        response1 = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "testuser",
                "password": "validpassword123"
            }
        )
        assert response1.status_code == 200

        # Essayer de créer un autre utilisateur avec le même username en majuscules
        response2 = client.post(
            "/api/v1/auth/signup",
            json={
                "username": "TestUser",  # Casse différente
                "password": "validpassword123"
            }
        )

        # Devrait réussir car les usernames sont différents (sensibles à la casse)
        assert response2.status_code == 200

        # Vérifier que les deux utilisateurs existent
        result = db_session.execute(select(User).where(User.username.in_(["testuser", "TestUser"])))
        users = result.scalars().all()
        assert len(users) == 2