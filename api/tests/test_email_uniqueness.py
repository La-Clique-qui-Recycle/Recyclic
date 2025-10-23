"""
Tests pour la sécurisation de l'email utilisateur (Story b34-p3)
Vérifie que l'unicité de l'email est bien appliquée sur tous les endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password


class TestEmailUniqueness:
    """Tests pour vérifier l'unicité de l'email utilisateur."""

    def test_signup_with_duplicate_email_returns_409(self, client: TestClient, db_session: Session):
        """Test que l'inscription avec un email déjà utilisé retourne 409."""
        # Créer un utilisateur existant avec un email
        existing_user = User(
            username="existing_user",
            email="test@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(existing_user)
        db_session.commit()

        # Tenter de créer un nouvel utilisateur avec le même email
        response = client.post("/api/v1/auth/signup", json={
            "username": "new_user",
            "email": "test@example.com",
            "password": "Test1234!"
        })

        assert response.status_code == 409
        assert "Un compte avec cet email existe déjà" in response.json()["detail"]

    def test_signup_with_unique_email_succeeds(self, client: TestClient, db_session: Session):
        """Test que l'inscription avec un email unique fonctionne."""
        response = client.post("/api/v1/auth/signup", json={
            "username": "new_user",
            "email": "unique@example.com",
            "password": "Test1234!"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Compte créé avec succès. Votre compte est en attente de validation par un administrateur."

    def test_create_user_with_duplicate_email_returns_409(self, client: TestClient, db_session: Session):
        """Test que la création d'utilisateur avec un email déjà utilisé retourne 409."""
        # Créer un utilisateur existant avec un email
        existing_user = User(
            username="existing_user",
            email="test@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(existing_user)
        db_session.commit()

        # Tenter de créer un nouvel utilisateur avec le même email
        response = client.post("/api/v1/users/", json={
            "username": "new_user",
            "email": "test@example.com",
            "password": "Test1234!",
            "role": "user",
            "status": "active"
        })

        assert response.status_code == 409
        assert "Un compte avec cet email existe déjà" in response.json()["detail"]

    def test_update_user_email_to_existing_returns_409(self, client: TestClient, db_session: Session):
        """Test que la mise à jour d'un utilisateur avec un email déjà utilisé retourne 409."""
        # Créer deux utilisateurs
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Tenter de mettre à jour user2 avec l'email de user1
        response = client.put(f"/api/v1/users/{user2.id}", json={
            "email": "user1@example.com"
        })

        assert response.status_code == 409
        assert "Un compte avec cet email existe déjà" in response.json()["detail"]

    def test_update_user_email_to_unique_succeeds(self, client: TestClient, db_session: Session):
        """Test que la mise à jour d'un utilisateur avec un email unique fonctionne."""
        # Créer un utilisateur
        user = User(
            username="test_user",
            email="old@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Mettre à jour avec un nouvel email
        response = client.put(f"/api/v1/users/{user.id}", json={
            "email": "new@example.com"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new@example.com"

    def test_update_me_with_duplicate_email_returns_409(self, client: TestClient, db_session: Session):
        """Test que la mise à jour de profil avec un email déjà utilisé retourne 409."""
        # Créer deux utilisateurs
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Authentifier user2
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(user2.id)})
        client.headers["Authorization"] = f"Bearer {token}"

        # Tenter de mettre à jour user2 avec l'email de user1
        response = client.put("/api/v1/users/me", json={
            "email": "user1@example.com"
        })

        assert response.status_code == 409
        assert "Un compte avec cet email existe déjà" in response.json()["detail"]

    def test_admin_update_user_with_duplicate_email_returns_409(self, admin_client: TestClient, db_session: Session):
        """Test que la mise à jour admin avec un email déjà utilisé retourne 409."""
        # Créer deux utilisateurs
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Tenter de mettre à jour user2 avec l'email de user1 via l'admin
        response = admin_client.put(f"/api/v1/admin/users/{user2.id}", json={
            "email": "user1@example.com"
        })

        assert response.status_code == 409
        assert "Un compte avec cet email existe déjà" in response.json()["detail"]
