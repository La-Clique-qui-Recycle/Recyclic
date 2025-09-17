"""
Unit tests for the email service.
"""
import pytest
from unittest.mock import patch, MagicMock
from sib_api_v3_sdk.rest import ApiException

from recyclic_api.core.email_service import EmailService, send_email


class TestEmailService:
    """Test cases for EmailService class."""

    @patch('recyclic_api.core.email_service.settings')
    def test_email_service_init_without_api_key(self, mock_settings):
        """Test EmailService initialization without API key raises ValueError."""
        mock_settings.BREVO_API_KEY = None

        with pytest.raises(ValueError, match="BREVO_API_KEY is required"):
            EmailService()

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_email_service_init_with_api_key(self, mock_config, mock_client, mock_api, mock_settings):
        """Test EmailService initialization with valid API key."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        service = EmailService()

        # Verify configuration was set up correctly
        mock_config.assert_called_once()
        mock_client.assert_called_once()
        mock_api.assert_called_once()
        assert service.api_instance is not None

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_send_email_success(self, mock_config, mock_client, mock_api, mock_settings):
        """Test successful email sending."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        # Mock API response
        mock_response = MagicMock()
        mock_response.message_id = "test-message-id"
        mock_api_instance = MagicMock()
        mock_api_instance.send_transac_email.return_value = mock_response
        mock_api.return_value = mock_api_instance

        service = EmailService()
        service.api_instance = mock_api_instance

        # Test email sending
        result = service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )

        assert result is True
        mock_api_instance.send_transac_email.assert_called_once()

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_send_email_with_custom_sender(self, mock_config, mock_client, mock_api, mock_settings):
        """Test email sending with custom sender information."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        mock_response = MagicMock()
        mock_response.message_id = "test-message-id"
        mock_api_instance = MagicMock()
        mock_api_instance.send_transac_email.return_value = mock_response
        mock_api.return_value = mock_api_instance

        service = EmailService()
        service.api_instance = mock_api_instance

        result = service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>",
            from_email="custom@example.com",
            from_name="Custom Sender"
        )

        assert result is True
        # Verify the email was sent with custom sender info
        call_args = mock_api_instance.send_transac_email.call_args
        email_object = call_args[0][0]
        assert email_object.sender["email"] == "custom@example.com"
        assert email_object.sender["name"] == "Custom Sender"

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_send_email_api_exception(self, mock_config, mock_client, mock_api, mock_settings):
        """Test email sending when API raises an exception."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        mock_api_instance = MagicMock()
        mock_api_instance.send_transac_email.side_effect = ApiException("API Error")
        mock_api.return_value = mock_api_instance

        service = EmailService()
        service.api_instance = mock_api_instance

        result = service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )

        assert result is False

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_send_email_generic_exception(self, mock_config, mock_client, mock_api, mock_settings):
        """Test email sending when a generic exception occurs."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        mock_api_instance = MagicMock()
        mock_api_instance.send_transac_email.side_effect = Exception("Generic Error")
        mock_api.return_value = mock_api_instance

        service = EmailService()
        service.api_instance = mock_api_instance

        result = service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )

        assert result is False

    @patch('recyclic_api.core.email_service.email_service')
    def test_send_email_convenience_function(self, mock_email_service):
        """Test the convenience send_email function."""
        mock_email_service.send_email.return_value = True

        result = send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )

        assert result is True
        mock_email_service.send_email.assert_called_once_with(
            "test@example.com",
            "Test Subject",
            "<p>Test content</p>"
        )

    @patch('recyclic_api.core.email_service.settings')
    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    @patch('sib_api_v3_sdk.ApiClient')
    @patch('sib_api_v3_sdk.Configuration')
    def test_send_email_default_sender(self, mock_config, mock_client, mock_api, mock_settings):
        """Test that default sender information is used when not provided."""
        mock_settings.BREVO_API_KEY = "test-api-key"

        mock_response = MagicMock()
        mock_response.message_id = "test-message-id"
        mock_api_instance = MagicMock()
        mock_api_instance.send_transac_email.return_value = mock_response
        mock_api.return_value = mock_api_instance

        service = EmailService()
        service.api_instance = mock_api_instance

        result = service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )

        assert result is True
        # Verify default sender info was used
        call_args = mock_api_instance.send_transac_email.call_args
        email_object = call_args[0][0]
        assert email_object.sender["email"] == "noreply@recyclic.fr"
        assert email_object.sender["name"] == "Recyclic"