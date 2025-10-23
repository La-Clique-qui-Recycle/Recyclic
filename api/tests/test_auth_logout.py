"""
Tests pour l'endpoint de déconnexion audité (Story b34-p7)
Vérifie que l'endpoint POST /v1/auth/logout enregistre correctement l'événement d'audit.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.audit_log import AuditLog, AuditActionType
from recyclic_api.core.security import hash_password
from uuid import uuid4


class TestAuthLogout:
    """Tests pour l'endpoint de déconnexion audité."""

    def test_logout_success_authenticated_user(self, client: TestClient, db_session: Session):
        """Test que la déconnexion d'un utilisateur authentifié fonctionne et enregistre l'audit."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Se connecter pour obtenir un token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "testuser@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Compter les entrées d'audit avant la déconnexion
        audit_count_before = db_session.query(AuditLog).count()

        # Se déconnecter
        headers = {"Authorization": f"Bearer {token}"}
        logout_response = client.post("/api/v1/auth/logout", headers=headers)

        # Vérifier la réponse
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert data["message"] == "Déconnexion réussie"

        # Vérifier qu'une entrée d'audit a été créée
        audit_count_after = db_session.query(AuditLog).count()
        assert audit_count_after == audit_count_before + 1

        # Vérifier les détails de l'entrée d'audit
        audit_entry = db_session.query(AuditLog).filter(
            AuditLog.action_type == AuditActionType.LOGOUT.value
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.actor_id == user.id
        assert audit_entry.actor_username == user.username
        assert audit_entry.action_type == AuditActionType.LOGOUT.value
        assert "Déconnexion de l'utilisateur" in audit_entry.description
        assert audit_entry.details_json["username"] == user.username
        assert audit_entry.details_json["user_id"] == str(user.id)
        assert audit_entry.details_json["user_role"] == user.role.value

    def test_logout_requires_authentication(self, client: TestClient, db_session: Session):
        """Test que la déconnexion sans authentification retourne 401."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 401

    def test_logout_with_invalid_token_returns_401(self, client: TestClient, db_session: Session):
        """Test que la déconnexion avec un token invalide retourne 401."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 401

    def test_logout_with_admin_user(self, client: TestClient, db_session: Session):
        """Test que la déconnexion d'un administrateur fonctionne correctement."""
        # Créer un utilisateur admin
        admin_user = User(
            id=uuid4(),
            username="admin@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        # Se connecter
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Se déconnecter
        headers = {"Authorization": f"Bearer {token}"}
        logout_response = client.post("/api/v1/auth/logout", headers=headers)

        # Vérifier la réponse
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert data["message"] == "Déconnexion réussie"

        # Vérifier l'entrée d'audit
        audit_entry = db_session.query(AuditLog).filter(
            AuditLog.action_type == AuditActionType.LOGOUT.value,
            AuditLog.actor_id == admin_user.id
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.actor_username == admin_user.username
        assert audit_entry.details_json["user_role"] == UserRole.ADMIN.value

    def test_logout_audit_contains_ip_and_user_agent(self, client: TestClient, db_session: Session):
        """Test que l'entrée d'audit contient l'IP et le User-Agent."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Se connecter
        login_response = client.post("/api/v1/auth/login", json={
            "username": "testuser@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Se déconnecter avec des headers spécifiques
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "TestBrowser/1.0"
        }
        logout_response = client.post("/api/v1/auth/logout", headers=headers)

        assert logout_response.status_code == 200

        # Vérifier l'entrée d'audit
        audit_entry = db_session.query(AuditLog).filter(
            AuditLog.action_type == AuditActionType.LOGOUT.value,
            AuditLog.actor_id == user.id
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.user_agent == "TestBrowser/1.0"
        # L'IP sera "testclient" dans l'environnement de test
        assert audit_entry.ip_address is not None

