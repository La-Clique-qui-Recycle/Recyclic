"""
Tests d'intégration complets pour le workflow de validation des inscriptions
Story 3.3 - API et Interface pour la Validation des Inscriptions
"""

import pytest
import uuid
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user


class TestPendingUsersIntegration:
    """Tests d'intégration pour le workflow complet de validation des inscriptions"""

    @pytest.fixture
    def client(self):
        """Client de test FastAPI"""
        # Override des dépendances d'auth pour tous les tests de cette classe
        from recyclic_api.core.auth import get_current_user
        app.dependency_overrides[get_current_user] = lambda: self.admin_user

        c = TestClient(app)
        # Fournir un header Authorization par défaut (même si get_current_user est overridé)
        c.headers.update({"Authorization": "Bearer test-token"})
        try:
            yield c
        finally:
            # Nettoyer l'override d'auth pour éviter les fuites entre tests
            app.dependency_overrides.pop(get_current_user, None)

    @pytest.fixture(autouse=True)
    def _override_db(self, mock_db):
        """Override FastAPI get_db dependency to use mock_db for all tests."""
        from recyclic_api.core.database import get_db as _get_db
        app.dependency_overrides[_get_db] = lambda: mock_db
        try:
            yield
        finally:
            app.dependency_overrides.pop(_get_db, None)

    @pytest.fixture
    def mock_db(self):
        """Mock de la base de données avec données réalistes"""
        db = Mock(spec=Session)
        
        # Créer des utilisateurs de test
        self.admin_user = Mock(spec=User)
        self.admin_user.id = uuid.uuid4()
        self.admin_user.username = "admin_test"
        self.admin_user.telegram_id = 111111111
        self.admin_user.role = UserRole.ADMIN
        self.admin_user.status = UserStatus.APPROVED
        self.admin_user.first_name = "Admin"
        self.admin_user.last_name = "Test"
        
        self.pending_users = []
        for i in range(5):
            user = Mock(spec=User)
            user.id = uuid.uuid4()
            user.telegram_id = 200000000 + i
            user.username = f"pending_user_{i}"
            user.first_name = f"Pending{i}"
            user.last_name = f"User{i}"
            user.role = UserRole.USER
            user.status = UserStatus.PENDING
            user.is_active = True
            user.created_at = datetime.now() - timedelta(days=i)
            user.updated_at = datetime.now() - timedelta(days=i)
            self.pending_users.append(user)
        
        # Chaînage par défaut pour query → filter → all/first
        query_mock = Mock()
        filter_mock = Mock()
        query_mock.filter.return_value = filter_mock
        filter_mock.all.return_value = self.pending_users
        filter_mock.first.return_value = self.pending_users[0] if self.pending_users else None
        db.query.return_value = query_mock

        return db

    @pytest.fixture
    def mock_telegram_service(self):
        """Mock du service Telegram"""
        with patch('recyclic_api.api.api_v1.endpoints.admin.telegram_service') as mock_service:
            mock_service.send_user_approval_notification = AsyncMock()
            mock_service.send_user_rejection_notification = AsyncMock()
            mock_service.notify_admins_user_processed = AsyncMock()
            yield mock_service

    def test_complete_workflow_pending_to_approved(self, client, mock_db, mock_telegram_service):
        """Test du workflow complet : récupération -> approbation -> vérification"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access'), \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = self.pending_users
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
                
                # 1. Récupérer la liste des utilisateurs en attente
                response = client.get("/api/v1/admin/users/pending")
                assert response.status_code == 200
                pending_data = response.json()
                assert len(pending_data) == 5
                assert all(user["status"] == "pending" for user in pending_data)
                
                # 2. Approuver le premier utilisateur
                target_user = self.pending_users[0]
                mock_query.filter.return_value.first.return_value = target_user
                approval_data = {"message": "Bienvenue dans l'équipe !"}
                response = client.post(
                    f"/api/v1/admin/users/{target_user.id}/approve",
                    json=approval_data
                )
            assert response.status_code == 200
            approval_result = response.json()
            assert approval_result["success"] is True
            assert approval_result["data"]["status"] == "approved"
            
            # 3. Vérifier que le statut a été mis à jour
            assert target_user.status == UserStatus.APPROVED
            
            # 4. Vérifier que les notifications ont été envoyées
            mock_telegram_service.send_user_approval_notification.assert_called_once()
            mock_telegram_service.notify_admins_user_processed.assert_called_once()
            
            # 5. Récupérer à nouveau la liste (l'utilisateur approuvé ne devrait plus être en attente)
            mock_query.filter.return_value.all.return_value = self.pending_users[1:]  # Exclure le premier
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 200
            updated_pending_data = response.json()
            assert len(updated_pending_data) == 4  # Un utilisateur de moins

    def test_complete_workflow_pending_to_rejected(self, client, mock_db, mock_telegram_service):
        """Test du workflow complet : récupération -> rejet -> vérification"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access'), \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = self.pending_users
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
                
                # 1. Récupérer la liste des utilisateurs en attente
                response = client.get("/api/v1/admin/users/pending")
                assert response.status_code == 200
                pending_data = response.json()
                assert len(pending_data) == 5
                
                # 2. Rejeter le premier utilisateur
                target_user = self.pending_users[0]
                mock_query.filter.return_value.first.return_value = target_user
                rejection_data = {"reason": "Profil incomplet"}
                response = client.post(
                    f"/api/v1/admin/users/{target_user.id}/reject",
                    json=rejection_data
                )
            assert response.status_code == 200
            rejection_result = response.json()
            assert rejection_result["success"] is True
            assert rejection_result["data"]["status"] == "rejected"
            assert rejection_result["data"]["reason"] == "Profil incomplet"
            
            # 3. Vérifier que le statut a été mis à jour
            assert target_user.status == UserStatus.REJECTED
            
            # 4. Vérifier que les notifications ont été envoyées
            mock_telegram_service.send_user_rejection_notification.assert_called_once()
            mock_telegram_service.notify_admins_user_processed.assert_called_once()

    def test_batch_operations(self, client, mock_db, mock_telegram_service):
        """Test d'opérations en lot sur plusieurs utilisateurs"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access'), \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = self.pending_users
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
            
            # Approuver plusieurs utilisateurs
            for i in range(3):
                target_user = self.pending_users[i]
                # S'assurer que l'utilisateur est en PENDING avant chaque approbation
                target_user.status = UserStatus.PENDING
                mock_db.query.return_value.filter.return_value.first.return_value = target_user
                response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
                assert response.status_code == 200
                assert target_user.status == UserStatus.APPROVED
            
            # Rejeter les autres
            for i in range(3, 5):
                target_user = self.pending_users[i]
                # S'assurer que l'utilisateur est en PENDING avant le rejet
                target_user.status = UserStatus.PENDING
                mock_db.query.return_value.filter.return_value.first.return_value = target_user
                response = client.post(
                    f"/api/v1/admin/users/{target_user.id}/reject",
                    json={"reason": f"Raison {i}"}
                )
                assert response.status_code == 200
                assert target_user.status == UserStatus.REJECTED
            
            # Vérifier que toutes les notifications ont été envoyées
            assert mock_telegram_service.send_user_approval_notification.call_count == 3
            assert mock_telegram_service.send_user_rejection_notification.call_count == 2
            assert mock_telegram_service.notify_admins_user_processed.call_count == 5

    def test_error_handling_integration(self, client, mock_db, mock_telegram_service):
        """Test de gestion d'erreurs dans le workflow complet"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access'), \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                # Mock d'une erreur de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.side_effect = Exception("Database error")
                mock_db.query.return_value = mock_query
            
            # Test de récupération avec erreur
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 500
            assert "Erreur lors de la récupération" in response.json()["detail"]
            
            # Test d'approbation avec utilisateur inexistant
            mock_query.filter.return_value.first.return_value = None
            mock_query.filter.return_value.all.side_effect = None
            mock_query.filter.return_value.all.return_value = []
            
            fake_user_id = str(uuid.uuid4())
            response = client.post(f"/api/v1/admin/users/{fake_user_id}/approve")
            assert response.status_code == 404

    def test_telegram_service_failure_handling(self, client, mock_db):
        """Test de gestion des échecs du service Telegram"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.services.telegram_service.telegram_service') as mock_telegram, \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                
                # Mock des services Telegram avec erreurs
                mock_telegram.send_user_approval_notification = AsyncMock(side_effect=Exception("Telegram error"))
                mock_telegram.send_user_rejection_notification = AsyncMock(side_effect=Exception("Telegram error"))
                mock_telegram.notify_admins_user_processed = AsyncMock(side_effect=Exception("Telegram error"))
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
                
                # L'approbation doit quand même réussir malgré les erreurs Telegram
                target_user = self.pending_users[0]
                response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
                assert response.status_code == 200
            assert target_user.status == UserStatus.APPROVED
            
            # Le rejet doit aussi réussir malgré les erreurs Telegram
            target_user.status = UserStatus.PENDING  # Reset pour le test
            response = client.post(f"/api/v1/admin/users/{target_user.id}/reject")
            assert response.status_code == 200
            assert target_user.status == UserStatus.REJECTED

    def test_audit_logging_integration(self, client, mock_db, mock_telegram_service):
        """Test de l'intégration du logging d'audit"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin, \
             patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access') as mock_log_access, \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change') as mock_log_role, \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = self.pending_users
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
                
                # Test de récupération des utilisateurs en attente (pendant que le patch est actif)
                response = client.get("/api/v1/admin/users/pending")
                assert response.status_code == 200
                # La fonction de log peut être appelée avec des arguments, vérifier au moins un appel
                assert mock_log_access.call_count >= 1

                # Test d'approbation (rester dans le scope du patch pour capter l'appel)
                target_user = self.pending_users[0]
                mock_db.query.return_value.filter.return_value.first.return_value = target_user
                target_user.status = UserStatus.PENDING
                response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
                assert response.status_code == 200
                assert mock_log_role.call_count >= 1

    def test_concurrent_operations(self, client, mock_db, mock_telegram_service):
        """Test d'opérations concurrentes sur le même utilisateur"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin:
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
            
            target_user = self.pending_users[0]
            
            # Simuler des opérations concurrentes
            # Dans un vrai test, on utiliserait des threads ou asyncio
            response1 = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
            response2 = client.post(f"/api/v1/admin/users/{target_user.id}/reject")
            
            # Au moins une des opérations devrait réussir
            assert response1.status_code == 200 or response2.status_code == 200

    def test_data_consistency(self, client, mock_db, mock_telegram_service):
        """Test de cohérence des données après les opérations"""
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin:
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.core.audit.log_admin_access'), \
                 patch('recyclic_api.core.audit.log_role_change'), \
                 patch('recyclic_api.core.auth.get_current_user', return_value=self.admin_user):
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = self.pending_users
                mock_query.filter.return_value.first.return_value = self.pending_users[0]
                mock_db.query.return_value = mock_query
            
            # Récupérer la liste initiale
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 200
            initial_count = len(response.json())
            
            # Approuver un utilisateur
            target_user = self.pending_users[0]
            response = client.post(f"/api/v1/admin/users/{target_user.id}/approve")
            assert response.status_code == 200
            
            # Vérifier que le statut est cohérent
            assert target_user.status == UserStatus.APPROVED
            
            # Récupérer la liste mise à jour
            mock_query.filter.return_value.all.return_value = self.pending_users[1:]
            response = client.get("/api/v1/admin/users/pending")
            assert response.status_code == 200
            updated_count = len(response.json())
            
            # Le nombre d'utilisateurs en attente devrait avoir diminué
            assert updated_count == initial_count - 1

    def test_performance_with_large_dataset(self, client, mock_db, mock_telegram_service):
        """Test de performance avec un grand nombre d'utilisateurs"""
        
        # Créer un grand nombre d'utilisateurs en attente
        large_pending_users = []
        for i in range(1000):
            user = Mock(spec=User)
            user.id = uuid.uuid4()
            user.telegram_id = 300000000 + i
            user.username = f"user_{i}"
            user.first_name = f"User{i}"
            user.last_name = f"Test{i}"
            user.role = UserRole.USER
            user.status = UserStatus.PENDING
            user.is_active = True
            user.created_at = datetime.now() - timedelta(days=i % 30)
            user.updated_at = datetime.now() - timedelta(days=i % 30)
            large_pending_users.append(user)
        
        with patch('recyclic_api.core.database.get_db', return_value=mock_db), \
             patch('recyclic_api.api.api_v1.endpoints.admin.require_admin_role') as mock_require_admin:
            # Mock require_admin_role pour retourner une fonction qui retourne notre admin_user
            mock_require_admin.return_value = lambda: self.admin_user
            with patch('recyclic_api.api.api_v1.endpoints.admin.log_admin_access'), \
                 patch('recyclic_api.api.api_v1.endpoints.admin.log_role_change'):
                
                # Mock de la requête de base de données
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = large_pending_users
                mock_db.query.return_value = mock_query
            
            # Test de récupération avec un grand nombre d'utilisateurs
            import time
            start_time = time.time()
            response = client.get("/api/v1/admin/users/pending")
            end_time = time.time()
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1000
            
            # Vérifier que la requête est rapide (moins de 1 seconde)
            assert end_time - start_time < 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
