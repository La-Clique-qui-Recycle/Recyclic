"""
Tests refactorisés pour les endpoints de validation des inscriptions (Story 3.3)
Refactorisé selon la Charte de Stratégie de Test (pattern Mocks & Overrides)
"""

import pytest
import uuid
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.schemas.admin import UserApprovalRequest, UserRejectionRequest
from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user
from recyclic_api.core.security import create_access_token
from tests.factories import UserFactory


class TestPendingUsersEndpoints:
    """Tests for pending users endpoints."""

    def test_get_pending_users_success_returns_list(self, admin_client: TestClient, db_session: Session):
        """Teste que la récupération des utilisateurs en attente réussit et retourne une liste."""
        UserFactory(status=UserStatus.PENDING)
        UserFactory(status=UserStatus.APPROVED)
        db_session.commit()

        response = admin_client.get("/api/v1/admin/users/pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['status'] == UserStatus.PENDING.value

    def test_get_pending_users_empty_list_returns_empty(self, admin_client: TestClient, db_session: Session):
        """Teste que la récupération des utilisateurs en attente retourne une liste vide s'il n'y en a pas."""
        UserFactory(status=UserStatus.APPROVED)
        db_session.commit()

        response = admin_client.get("/api/v1/admin/users/pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_pending_users_insufficient_role_returns_403(self, client: TestClient, db_session: Session):
        """Teste que les utilisateurs avec un rôle insuffisant reçoivent une erreur 403."""
        user = UserFactory(role=UserRole.USER)
        db_session.add(user)
        db_session.commit()

        access_token = create_access_token(data={"sub": str(user.id)})
        client.headers = {"Authorization": f"Bearer {access_token}"}

        response = client.get("/api/v1/admin/users/pending")
        assert response.status_code == 403

    def test_approve_user_success_updates_status(self, admin_client: TestClient, db_session: Session):
        """Teste que l'approbation d'un utilisateur met à jour son statut."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert response.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.APPROVED

    def test_approve_user_not_found_returns_404(self, admin_client: TestClient):
        """Teste que l'approbation d'un utilisateur inexistant retourne une erreur 404."""
        response = admin_client.post(f"/api/v1/admin/users/{uuid.uuid4()}/approve")
        assert response.status_code == 404

    def test_approve_user_invalid_uuid_returns_404(self, admin_client: TestClient):
        """Teste que l'approbation avec un UUID invalide retourne une erreur 404."""
        response = admin_client.post("/api/v1/admin/users/invalid-uuid/approve")
        assert response.status_code == 404

    def test_approve_user_not_pending_returns_400(self, admin_client: TestClient, db_session: Session):
        """Teste que l'approbation d'un utilisateur non en attente retourne une erreur 400."""
        user = UserFactory(status=UserStatus.APPROVED)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert response.status_code == 400

    def test_reject_user_success_updates_status(self, admin_client: TestClient, db_session: Session):
        """Teste que le rejet d'un utilisateur met à jour son statut."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert response.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.REJECTED

    def test_reject_user_not_found_returns_404(self, admin_client: TestClient):
        """Teste que le rejet d'un utilisateur inexistant retourne une erreur 404."""
        response = admin_client.post(f"/api/v1/admin/users/{uuid.uuid4()}/reject")
        assert response.status_code == 404
    
    def test_reject_user_not_pending_returns_400(self, admin_client: TestClient, db_session: Session):
        """Teste que le rejet d'un utilisateur non en attente retourne une erreur 400."""
        user = UserFactory(status=UserStatus.APPROVED)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert response.status_code == 400

    @patch('recyclic_api.services.telegram_service.telegram_service.send_user_approval_notification', side_effect=Exception("Telegram error"))
    def test_approve_user_telegram_error_continues_operation(self, mock_send_notification, admin_client: TestClient, db_session: Session):
        """Teste que l'approbation réussit même si la notification Telegram échoue."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert response.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.APPROVED

    @patch('recyclic_api.services.telegram_service.telegram_service.send_user_rejection_notification', side_effect=Exception("Telegram error"))
    def test_reject_user_telegram_error_continues_operation(self, mock_send_notification, admin_client: TestClient, db_session: Session):
        """Teste que le rejet réussit même si la notification Telegram échoue."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()

        response = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert response.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.REJECTED

    def test_approve_user_without_message_succeeds(self, admin_client: TestClient, db_session: Session):
        """Teste que l'approbation sans message personnalisé réussit."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()
        response = admin_client.post(f"/api/v1/admin/users/{user.id}/approve", json=None)
        assert response.status_code == 200

    def test_reject_user_without_reason_succeeds(self, admin_client: TestClient, db_session: Session):
        """Teste que le rejet sans raison personnalisée réussit."""
        user = UserFactory(status=UserStatus.PENDING)
        db_session.commit()
        response = admin_client.post(f"/api/v1/admin/users/{user.id}/reject", json=None)
        assert response.status_code == 200

    @patch('recyclic_api.api.api_v1.endpoints.admin.get_db')
    def test_database_error_handling_returns_500(self, mock_get_db, admin_client: TestClient):
        """Teste que les erreurs de base de données retournent une erreur 500."""
        mock_get_db.side_effect = Exception("Database connection error")
        response = admin_client.get("/api/v1/admin/users/pending")
        assert response.status_code == 500