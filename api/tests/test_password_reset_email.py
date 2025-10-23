"""
Tests d'intégration pour la fonctionnalité de réinitialisation de mot de passe par email.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password
from recyclic_api.utils.password_reset_email import send_password_reset_email, send_password_reset_email_safe
from recyclic_api.core.email_service import EmailConfigurationError


class TestPasswordResetEmail:
    """Tests pour la fonctionnalité d'envoi d'email de réinitialisation de mot de passe."""

    def test_send_password_reset_email_success(self):
        """Test l'envoi réussi d'un email de réinitialisation."""
        with patch('recyclic_api.utils.password_reset_email.EmailService') as mock_email_service:
            # Configuration du mock
            mock_service_instance = MagicMock()
            mock_service_instance.send_email.return_value = True
            mock_email_service.return_value = mock_service_instance
            
            # Test
            result = send_password_reset_email(
                to_email="test@example.com",
                reset_link="http://localhost:4444/reset-password?token=abc123",
                user_name="Test User"
            )
            
            # Vérifications
            assert result is True
            mock_service_instance.send_email.assert_called_once()
            
            # Vérifier les paramètres de l'appel
            call_args = mock_service_instance.send_email.call_args
            assert call_args[1]['to_email'] == "test@example.com"
            assert "Réinitialisation de votre mot de passe" in call_args[1]['subject']
            assert "http://localhost:4444/reset-password?token=abc123" in call_args[1]['html_content']

    def test_send_password_reset_email_configuration_error(self):
        """Test la gestion d'erreur de configuration du service email."""
        with patch('recyclic_api.utils.password_reset_email.EmailService') as mock_email_service:
            # Configuration du mock pour lever une exception
            mock_email_service.side_effect = EmailConfigurationError("API key not configured")
            
            # Test
            with pytest.raises(EmailConfigurationError):
                send_password_reset_email(
                    to_email="test@example.com",
                    reset_link="http://localhost:4444/reset-password?token=abc123"
                )

    def test_send_password_reset_email_safe_handles_exceptions(self):
        """Test que la version 'safe' gère les exceptions sans les lever."""
        with patch('recyclic_api.utils.password_reset_email.EmailService') as mock_email_service:
            # Configuration du mock pour lever une exception
            mock_email_service.side_effect = Exception("Service unavailable")
            
            # Test - ne doit pas lever d'exception
            result = send_password_reset_email_safe(
                to_email="test@example.com",
                reset_link="http://localhost:4444/reset-password?token=abc123"
            )
            
            # Vérifications
            assert result is False

    def test_send_password_reset_email_template_not_found(self):
        """Test la gestion d'erreur quand le template n'est pas trouvé."""
        with patch('recyclic_api.utils.password_reset_email.load_email_template') as mock_load_template:
            # Configuration du mock pour lever une exception
            mock_load_template.side_effect = FileNotFoundError("Template not found")
            
            # Test
            with pytest.raises(FileNotFoundError):
                send_password_reset_email(
                    to_email="test@example.com",
                    reset_link="http://localhost:4444/reset-password?token=abc123"
                )

    def test_send_password_reset_email_safe_template_not_found(self):
        """Test que la version 'safe' gère l'erreur de template."""
        with patch('recyclic_api.utils.password_reset_email.load_email_template') as mock_load_template:
            # Configuration du mock pour lever une exception
            mock_load_template.side_effect = FileNotFoundError("Template not found")
            
            # Test - ne doit pas lever d'exception
            result = send_password_reset_email_safe(
                to_email="test@example.com",
                reset_link="http://localhost:4444/reset-password?token=abc123"
            )
            
            # Vérifications
            assert result is False


class TestForgotPasswordEndpoint:
    """Tests pour l'endpoint de réinitialisation de mot de passe."""

    @pytest.fixture
    def test_user(self, db_session: Session):
        """Créer un utilisateur de test avec email."""
        user = User(
            username="testuser@example.com",
            email="testuser@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_forgot_password_success(self, client: TestClient, test_user: User):
        """Test la réinitialisation de mot de passe avec envoi d'email réussi."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            # Configuration du mock
            mock_send_email.return_value = True
            
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "testuser@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            data = response.json()
            assert "lien de réinitialisation a été envoyé" in data["message"]
            
            # Vérifier que l'email a été envoyé
            mock_send_email.assert_called_once()
            call_args = mock_send_email.call_args
            assert call_args[1]['to_email'] == "testuser@example.com"
            assert "reset-password?token=" in call_args[1]['reset_link']

    def test_forgot_password_user_not_found(self, client: TestClient):
        """Test la réinitialisation avec un email qui n'existe pas."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "nonexistent@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            data = response.json()
            assert "lien de réinitialisation a été envoyé" in data["message"]
            
            # Vérifier que l'email n'a PAS été envoyé
            mock_send_email.assert_not_called()

    def test_forgot_password_user_inactive(self, client: TestClient, db_session: Session):
        """Test la réinitialisation avec un utilisateur inactif."""
        # Créer un utilisateur inactif
        user = User(
            username="inactive@example.com",
            email="inactive@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.INACTIVE,
            is_active=False
        )
        db_session.add(user)
        db_session.commit()
        
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "inactive@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            data = response.json()
            assert "lien de réinitialisation a été envoyé" in data["message"]
            
            # Vérifier que l'email n'a PAS été envoyé
            mock_send_email.assert_not_called()

    def test_forgot_password_email_send_failure(self, client: TestClient, test_user: User):
        """Test la gestion d'échec d'envoi d'email."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            # Configuration du mock pour simuler un échec
            mock_send_email.return_value = False
            
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "testuser@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            data = response.json()
            assert "lien de réinitialisation a été envoyé" in data["message"]
            
            # Vérifier que l'email a été tenté d'être envoyé
            mock_send_email.assert_called_once()

    def test_forgot_password_email_send_exception(self, client: TestClient, test_user: User):
        """Test la gestion d'exception lors de l'envoi d'email."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            # Configuration du mock pour lever une exception
            mock_send_email.side_effect = Exception("Email service unavailable")
            
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "testuser@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            data = response.json()
            assert "lien de réinitialisation a été envoyé" in data["message"]
            
            # Vérifier que l'email a été tenté d'être envoyé
            mock_send_email.assert_called_once()

    def test_forgot_password_rate_limiting(self, client: TestClient, test_user: User):
        """Test le rate limiting sur l'endpoint forgot-password."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            mock_send_email.return_value = True
            
            # Faire plusieurs requêtes rapidement
            for i in range(6):  # Plus que la limite de 5/minute
                response = client.post(
                    "/api/v1/auth/forgot-password",
                    json={"email": "testuser@example.com"}
                )
                
                if i < 5:
                    assert response.status_code == 200
                else:
                    # La 6ème requête devrait être limitée
                    assert response.status_code == 429

    def test_forgot_password_audit_logging(self, client: TestClient, test_user: User, db_session: Session):
        """Test que l'audit logging fonctionne pour les demandes de réinitialisation."""
        with patch('recyclic_api.api.api_v1.endpoints.auth.send_password_reset_email_safe') as mock_send_email:
            mock_send_email.return_value = True
            
            # Test
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "testuser@example.com"}
            )
            
            # Vérifications
            assert response.status_code == 200
            
            # Vérifier qu'un log d'audit a été créé
            from recyclic_api.models.audit_log import AuditLog
            audit_logs = db_session.query(AuditLog).filter(
                AuditLog.action_type == "password_reset"
            ).all()
            
            assert len(audit_logs) == 1
            audit_log = audit_logs[0]
            assert audit_log.actor_id == test_user.id
            assert "testuser@example.com" in audit_log.description
            assert audit_log.details_json["email"] == "testuser@example.com"
            assert audit_log.details_json["reset_link_generated"] is True
