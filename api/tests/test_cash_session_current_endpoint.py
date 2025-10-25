"""
Tests pour l'endpoint GET /v1/cash-sessions/current
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.core.security import hash_password


class TestCashSessionCurrentEndpoint:
    """Tests pour l'endpoint GET /v1/cash-sessions/current"""

    def test_get_current_cash_session_with_open_session(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne la session ouverte avec un statut 200."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer une session de caisse ouverte
        cash_session = CashSession(
            id=uuid4(),
            operator_id=user.id,
            initial_amount=50.0,
            current_amount=50.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(cash_session)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint
        response = client.get("/api/v1/cash-sessions/current")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier que les données de la session sont présentes
        assert data is not None
        assert data["id"] == str(cash_session.id)
        assert data["operator_id"] == str(user.id)
        assert data["initial_amount"] == 50.0
        assert data["current_amount"] == 50.0
        assert data["status"] == "open"
        assert data["opened_at"] is not None
        assert data["closed_at"] is None

    def test_get_current_cash_session_without_open_session(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne null avec un statut 200 quand aucune session n'est ouverte."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint
        response = client.get("/api/v1/cash-sessions/current")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        assert data is None

    def test_get_current_cash_session_with_closed_session(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne null quand la session est fermée."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer une session de caisse fermée
        cash_session = CashSession(
            id=uuid4(),
            operator_id=user.id,
            initial_amount=50.0,
            current_amount=100.0,
            status=CashSessionStatus.CLOSED
        )
        db_session.add(cash_session)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint
        response = client.get("/api/v1/cash-sessions/current")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        assert data is None

    def test_get_current_cash_session_requires_authentication(self, client: TestClient):
        """Test que l'endpoint nécessite une authentification."""
        response = client.get("/api/v1/cash-sessions/current")
        assert response.status_code == 401

    def test_get_current_cash_session_with_admin_role(self, client: TestClient, db_session: Session):
        """Test que l'endpoint fonctionne avec un rôle admin."""
        # Créer un utilisateur admin
        admin_user = User(
            id=uuid4(),
            username="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        db_session.add(admin_user)
        db_session.commit()

        # Créer une session de caisse ouverte
        cash_session = CashSession(
            id=uuid4(),
            operator_id=admin_user.id,
            initial_amount=100.0,
            current_amount=100.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(cash_session)
        db_session.commit()

        # Authentifier l'admin
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin@example.com",
            "password": "adminpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint
        response = client.get("/api/v1/cash-sessions/current")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert data["operator_id"] == str(admin_user.id)
        assert data["status"] == "open"

