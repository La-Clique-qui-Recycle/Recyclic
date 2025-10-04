"""Tests d'intégration pour les endpoints PIN."""
import pytest
from uuid import uuid4
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, create_access_token


class TestPinEndpoints:
    """Tests pour les endpoints de gestion du PIN."""

    def test_set_pin_success(self, client, db_session):
        """Test: Définir un PIN avec succès."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="user_with_pin@test.com",
            hashed_password=hash_password("Password123!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Générer un token d'authentification
        token = create_access_token(data={"sub": str(user.id)})

        # Définir le PIN
        response = client.put(
            "/api/v1/users/me/pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        assert response.json()["message"] == "PIN successfully set"

        # Vérifier que le PIN est bien haché dans la base
        db_session.refresh(user)
        assert user.hashed_pin is not None
        assert user.hashed_pin != "1234"  # Doit être haché

    def test_set_pin_invalid_format(self, client, db_session):
        """Test: Échec avec un PIN invalide (moins de 4 chiffres)."""
        user = User(
            id=uuid4(),
            username="user_invalid_pin@test.com",
            hashed_password=hash_password("Password123!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        token = create_access_token(data={"sub": str(user.id)})

        # Tenter de définir un PIN invalide (3 chiffres)
        response = client.put(
            "/api/v1/users/me/pin",
            json={"pin": "123"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 422

    def test_set_pin_non_numeric(self, client, db_session):
        """Test: Échec avec un PIN contenant des lettres."""
        user = User(
            id=uuid4(),
            username="user_alpha_pin@test.com",
            hashed_password=hash_password("Password123!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        token = create_access_token(data={"sub": str(user.id)})

        # Tenter de définir un PIN avec des lettres
        response = client.put(
            "/api/v1/users/me/pin",
            json={"pin": "abcd"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 422

    def test_set_pin_unauthorized(self, client):
        """Test: Échec sans authentification."""
        response = client.put(
            "/api/v1/users/me/pin",
            json={"pin": "1234"}
        )

        assert response.status_code == 401


class TestPinAuthentication:
    """Tests pour l'authentification par PIN."""

    def test_pin_auth_success(self, client, db_session):
        """Test: Authentification réussie avec un PIN valide."""
        # Créer un utilisateur avec un PIN
        user = User(
            id=uuid4(),
            username="user_pin_auth@test.com",
            hashed_password=hash_password("Password123!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # S'authentifier avec le PIN
        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": str(user.id), "pin": "1234"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == str(user.id)
        assert data["username"] == user.username
        assert data["role"] == user.role.value

    def test_pin_auth_invalid_pin(self, client, db_session):
        """Test: Échec avec un PIN incorrect."""
        user = User(
            id=uuid4(),
            username="user_wrong_pin@test.com",
            hashed_password=hash_password("Password123!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Tenter avec un PIN incorrect
        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": str(user.id), "pin": "9999"}
        )

        assert response.status_code == 401
        assert "PIN invalide" in response.json()["detail"]

    def test_pin_auth_no_pin_set(self, client, db_session):
        """Test: Échec quand l'utilisateur n'a pas de PIN défini."""
        user = User(
            id=uuid4(),
            username="user_no_pin@test.com",
            hashed_password=hash_password("Password123!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Tenter de s'authentifier sans PIN défini
        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": str(user.id), "pin": "1234"}
        )

        assert response.status_code == 401

    def test_pin_auth_inactive_user(self, client, db_session):
        """Test: Échec avec un utilisateur inactif."""
        user = User(
            id=uuid4(),
            username="inactive_user@test.com",
            hashed_password=hash_password("Password123!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=False  # Utilisateur inactif
        )
        db_session.add(user)
        db_session.commit()

        # Tenter de s'authentifier
        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": str(user.id), "pin": "1234"}
        )

        assert response.status_code == 401

    def test_pin_auth_invalid_user_id(self, client):
        """Test: Échec avec un ID utilisateur inexistant."""
        fake_user_id = str(uuid4())

        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": fake_user_id, "pin": "1234"}
        )

        assert response.status_code == 401

    def test_pin_auth_invalid_pin_format(self, client, db_session):
        """Test: Échec avec un format de PIN invalide."""
        user = User(
            id=uuid4(),
            username="user_format_pin@test.com",
            hashed_password=hash_password("Password123!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Tenter avec un PIN au format invalide
        response = client.post(
            "/api/v1/auth/pin",
            json={"user_id": str(user.id), "pin": "abc"}
        )

        assert response.status_code == 422
