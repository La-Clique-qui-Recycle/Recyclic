"""
Tests corrigés pour les endpoints de validation des inscriptions (Story 3.3)
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


class TestPendingUsersEndpoints:
    """Tests pour les endpoints de gestion des utilisateurs en attente"""

    @pytest.fixture
    def client(self):
        """Client de test FastAPI"""
        return TestClient(app)
    
    def _setup_dependency_overrides(self, mock_db, mock_admin_user):
        """Helper pour configurer les overrides de dépendances FastAPI"""
        from recyclic_api.main import app
        from recyclic_api.core.database import get_db
        from recyclic_api.core.auth import get_current_user
        
        def override_get_db():
            return mock_db
            
        def override_get_current_user():
            return mock_admin_user
            
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        return app

    @pytest.fixture
    def mock_db(self):
        """Mock de la base de données"""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_admin_user(self):
        """Utilisateur admin pour les tests"""
        admin_user = Mock(spec=User)
        admin_user.id = uuid.uuid4()
        admin_user.username = "admin_test"
        admin_user.telegram_id = 123456789
        admin_user.role = UserRole.ADMIN
        admin_user.status = UserStatus.APPROVED
        admin_user.first_name = "Admin"
        admin_user.last_name = "Test"
        return admin_user

    @pytest.fixture
    def mock_pending_users(self):
        """Utilisateurs en attente pour les tests"""
        users = []
        for i in range(3):
            user = Mock(spec=User)
            user.id = uuid.uuid4()
            user.telegram_id = 200000000 + i
            user.username = f"pending_user_{i}"
            user.first_name = f"Pending{i}"
            user.last_name = f"User{i}"
            user.role = UserRole.USER
            user.status = UserStatus.PENDING
            user.is_active = True
            user.created_at = datetime.now()
            user.updated_at = datetime.now()
            users.append(user)
        return users

    @pytest.fixture
    def mock_approved_user(self):
        """Utilisateur approuvé pour les tests"""
        user = Mock(spec=User)
        user.id = uuid.uuid4()
        user.telegram_id = 999999999
        user.username = "approved_user"
        user.first_name = "Approved"
        user.last_name = "User"
        user.role = UserRole.USER
        user.status = UserStatus.APPROVED
        user.is_active = True
        user.created_at = datetime.now()
        user.updated_at = datetime.now()
        return user

    def test_get_pending_users_success(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test de récupération réussie des utilisateurs en attente"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = mock_pending_users
                mock_db.query.return_value = mock_query
                
                # Appel de l'endpoint
                response = client.get("/api/v1/admin/users/pending")
                
                # Vérifications
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 3
                assert all(user["status"] == "pending" for user in data)
                assert data[0]["username"] == "pending_user_0"
                assert data[1]["username"] == "pending_user_1"
                assert data[2]["username"] == "pending_user_2"
        finally:
            # Nettoyer les overrides
            app.dependency_overrides.clear()

    def test_get_pending_users_empty_list(self, client, mock_db, mock_admin_user):
        """Test avec une liste vide d'utilisateurs en attente"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données - liste vide
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = []
                mock_db.query.return_value = mock_query
                
                response = client.get("/api/v1/admin/users/pending")
                
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 0
        finally:
            # Nettoyer les overrides
            app.dependency_overrides.clear()

    def test_get_pending_users_unauthorized(self, client, mock_db):
        """Test d'accès non autorisé (sans authentification)"""
        from recyclic_api.main import app
        from recyclic_api.core.database import get_db
        from recyclic_api.core.auth import get_current_user
        from fastapi import HTTPException, status
        
        # Override get_db et get_current_user pour simuler l'absence d'auth
        def override_get_db():
            return mock_db
            
        def override_get_current_user():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
            
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 401
        finally:
            app.dependency_overrides.clear()

    def test_get_pending_users_insufficient_role(self, client, mock_db):
        """Test avec un utilisateur non-admin"""
        from recyclic_api.main import app
        from recyclic_api.core.database import get_db
        from recyclic_api.core.auth import get_current_user
        
        # Créer un utilisateur non-admin
        non_admin_user = Mock(spec=User)
        non_admin_user.id = uuid.uuid4()
        non_admin_user.role = UserRole.USER
        non_admin_user.status = UserStatus.APPROVED
        
        def override_get_db():
            return mock_db
            
        def override_get_current_user():
            return non_admin_user
            
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_success(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test d'approbation réussie d'un utilisateur"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram
                mock_telegram.send_user_approval_notification = AsyncMock()
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # Appel de l'endpoint
                approval_data = {"message": "Bienvenue dans l'équipe !"}
                response = client.post(
                    f"/api/v1/admin/users/{target_user.id}/approve",
                    json=approval_data
                )
                
                # Vérifications
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "approuvé avec succès" in data["message"]
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_not_found(self, client, mock_db, mock_admin_user):
        """Test d'approbation d'un utilisateur inexistant"""
        fake_user_id = str(uuid.uuid4())
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données - utilisateur non trouvé
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = None
                mock_db.query.return_value = mock_query
                
                response = client.post(f"/api/v1/admin/users/{fake_user_id}/approve")
                
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_invalid_uuid(self, client, mock_db, mock_admin_user):
        """Test d'approbation avec un UUID invalide"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                response = client.post("/api/v1/admin/users/invalid-uuid/approve")
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_not_pending(self, client, mock_db, mock_admin_user, mock_approved_user):
        """Test d'approbation d'un utilisateur qui n'est pas en attente"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = mock_approved_user
                mock_db.query.return_value = mock_query
                
                response = client.post(f"/api/v1/admin/users/{mock_approved_user.id}/approve")
                assert response.status_code == 400
        finally:
            app.dependency_overrides.clear()

    def test_reject_user_success(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test de rejet réussi d'un utilisateur"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram
                mock_telegram.send_user_rejection_notification = AsyncMock()
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # Appel de l'endpoint
                rejection_data = {"reason": "Profil incomplet"}
                response = client.post(
                    f"/api/v1/admin/users/{target_user.id}/reject",
                    json=rejection_data
                )
                
                # Vérifications
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "rejeté avec succès" in data["message"]
        finally:
            app.dependency_overrides.clear()

    def test_reject_user_not_found(self, client, mock_db, mock_admin_user):
        """Test de rejet d'un utilisateur inexistant"""
        fake_user_id = str(uuid.uuid4())
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données - utilisateur non trouvé
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = None
                mock_db.query.return_value = mock_query
                
                response = client.post(f"/api/v1/admin/users/{fake_user_id}/reject")
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_reject_user_not_pending(self, client, mock_db, mock_admin_user, mock_approved_user):
        """Test de rejet d'un utilisateur qui n'est pas en attente"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = mock_approved_user
                mock_db.query.return_value = mock_query
                
                response = client.post(f"/api/v1/admin/users/{mock_approved_user.id}/reject")
                assert response.status_code == 400
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_telegram_error(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test d'approbation avec erreur de notification Telegram"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram avec erreur
                mock_telegram.send_user_approval_notification = AsyncMock(side_effect=Exception("Telegram error"))
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # L'approbation doit quand même réussir malgré l'erreur Telegram
                response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_reject_user_telegram_error(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test de rejet avec erreur de notification Telegram"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram avec erreur
                mock_telegram.send_user_rejection_notification = AsyncMock(side_effect=Exception("Telegram error"))
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # Le rejet doit quand même réussir malgré l'erreur Telegram
                response = client.post(f"/api/v1/admin/users/{target_user.id}/reject")
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_approve_user_without_message(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test d'approbation sans message personnalisé"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram
                mock_telegram.send_user_approval_notification = AsyncMock()
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # Appel de l'endpoint sans données
                response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_reject_user_without_reason(self, client, mock_db, mock_admin_user, mock_pending_users):
        """Test de rejet sans raison spécifiée"""
        target_user = mock_pending_users[0]
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram:
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = target_user
                mock_db.query.return_value = mock_query
                
                # Mock des services Telegram
                mock_telegram.send_user_rejection_notification = AsyncMock()
                mock_telegram.notify_admins_user_processed = AsyncMock()
                
                # Appel de l'endpoint sans données
                response = client.post(f"/api/v1/admin/users/{target_user.id}/reject")
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_database_error_handling(self, client, mock_db, mock_admin_user):
        """Test de gestion d'erreur de base de données"""
        app = self._setup_dependency_overrides(mock_db, mock_admin_user)
        
        try:
            with patch('recyclic_api.core.audit.log_admin_access'):
                # Mock d'une erreur de base de données
                mock_db.query.side_effect = Exception("Database connection error")
                
                response = client.get("/api/v1/admin/users/pending")
                assert response.status_code == 500
        finally:
            app.dependency_overrides.clear()
