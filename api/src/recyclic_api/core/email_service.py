"""
Email service for sending transactional emails via Brevo (SendInBlue).
"""
import logging
import time
from datetime import datetime
from typing import Optional, List
import types
from dataclasses import dataclass
import base64

try:
    import sib_api_v3_sdk  # type: ignore
    from sib_api_v3_sdk.rest import ApiException  # type: ignore
except Exception:  # pragma: no cover - fallback for test environments without SDK
    # Provide a lightweight shim so tests can patch attributes under this namespace
    class ApiException(Exception):
        pass

    class _SendSmtpEmail:
        def __init__(self, to=None, sender=None, subject=None, html_content=None):
            self.to = to
            self.sender = sender
            self.subject = subject
            self.html_content = html_content

    class _ApiClient:
        def __init__(self, configuration=None):
            self.configuration = configuration

    class _TransactionalEmailsApi:
        def __init__(self, api_client=None):
            self._api_client = api_client

        def send_transac_email(self, email):  # pragma: no cover - replaced by mocks in tests
            class _Resp:
                message_id = "mock-message-id"
            return _Resp()

    sib_api_v3_sdk = types.SimpleNamespace(  # type: ignore
        Configuration=type("_Cfg", (), {"api_key": {}}),
        ApiClient=_ApiClient,
        TransactionalEmailsApi=_TransactionalEmailsApi,
        SendSmtpEmail=_SendSmtpEmail,
        rest=types.SimpleNamespace(ApiException=ApiException),
    )

from recyclic_api.core.config import settings
from recyclic_api.utils.email_metrics import email_metrics
from recyclic_api.core.database import get_db
from recyclic_api.models.email_event import EmailStatusModel

logger = logging.getLogger(__name__)


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    mime_type: str = 'application/octet-stream'


class EmailService:
    """Service for sending emails through Brevo API."""

    def __init__(self):
        """Initialize the email service with Brevo API configuration."""
        # Validate configuration first
        if not settings.BREVO_API_KEY:
            raise ValueError("BREVO_API_KEY is required but not set in environment")

        # Configure API client (real or patched in tests)
        configuration = sib_api_v3_sdk.Configuration()
        try:
            # Some shims may not support dict-style api_key
            if hasattr(configuration, 'api_key'):
                configuration.api_key['api-key'] = settings.BREVO_API_KEY
        except Exception:
            pass

        # Create API instance (will be patched to MagicMock in tests)
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        db_session=None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> bool:
        """
        Send an email via Brevo API.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            from_email: Sender email (optional, uses default if not provided)
            from_name: Sender name (optional)
            db_session: Optional database session for status tracking

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        start_time = time.time()

        try:
            # Default sender info from configuration
            if not from_email:
                from_email = settings.EMAIL_FROM_ADDRESS
            if not from_name:
                from_name = settings.EMAIL_FROM_NAME

            # Create email object
            sender = {"name": from_name, "email": from_email}
            to = [{"email": to_email}]

            attachments_payload = None
            if attachments:
                attachments_payload = []
                for attachment in attachments:
                    try:
                        encoded = base64.b64encode(attachment.content).decode('utf-8')
                    except Exception as exc:
                        logger.error("Failed to encode attachment %s: %s", attachment.filename, exc)
                        continue
                    payload = {"name": attachment.filename, "content": encoded}
                    if attachment.mime_type:
                        payload["type"] = attachment.mime_type
                    attachments_payload.append(payload)
                if not attachments_payload:
                    attachments_payload = None

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=to,
                sender=sender,
                subject=subject,
                html_content=html_content,
                attachment=attachments_payload
            )

            # Send the email
            api_response = self.api_instance.send_transac_email(send_smtp_email)

            elapsed_ms = (time.time() - start_time) * 1000

            # Record success metrics
            email_metrics.record_email_send(
                to_email=to_email,
                success=True,
                elapsed_ms=elapsed_ms,
                provider="brevo",
                message_id=api_response.message_id
            )

            # Create email status record if database session provided
            if db_session:
                try:
                    email_status = EmailStatusModel(
                        email_address=to_email,
                        message_id=api_response.message_id,
                        current_status="sent",
                        sent_timestamp=datetime.fromtimestamp(start_time),
                        subject=subject,
                        provider="brevo"
                    )
                    db_session.add(email_status)
                    db_session.commit()
                except Exception as e:
                    logger.warning(f"Failed to create email status record: {e}")
                    # Don't fail the email send if status tracking fails
                    db_session.rollback()

            return True

        except ApiException as e:
            elapsed_ms = (time.time() - start_time) * 1000
            error_type = "api_exception"
            error_detail = str(e)

            # Record failure metrics
            email_metrics.record_email_send(
                to_email=to_email,
                success=False,
                elapsed_ms=elapsed_ms,
                provider="brevo",
                error_type=error_type,
                error_detail=error_detail
            )

            return False

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            error_type = "unexpected_error"
            error_detail = str(e)

            # Record failure metrics
            email_metrics.record_email_send(
                to_email=to_email,
                success=False,
                elapsed_ms=elapsed_ms,
                provider="brevo",
                error_type=error_type,
                error_detail=error_detail
            )

            return False


# Global email service instance (lazy initialization)
_email_service = None


def get_email_service() -> EmailService:
    """Get the global email service instance (lazy initialization)."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


def send_email(to_email: str, subject: str, html_content: str, attachments: Optional[List[EmailAttachment]] = None) -> bool:
    """
    Convenience function to send an email.

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    service = get_email_service()
    if attachments is None:
        return service.send_email(to_email, subject, html_content)
    return service.send_email(to_email, subject, html_content, attachments=attachments)


