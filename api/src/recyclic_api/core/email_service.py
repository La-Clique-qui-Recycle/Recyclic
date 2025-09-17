"""
Email service for sending transactional emails via Brevo (SendInBlue).
"""
import logging
from typing import Optional

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from recyclic_api.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails through Brevo API."""

    def __init__(self):
        """Initialize the email service with Brevo API configuration."""
        if not settings.BREVO_API_KEY:
            raise ValueError("BREVO_API_KEY is required but not set in environment")

        # Configure API key authorization
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = settings.BREVO_API_KEY

        # Create API instance
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """
        Send an email via Brevo API.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            from_email: Sender email (optional, uses default if not provided)
            from_name: Sender name (optional)

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Default sender info
            if not from_email:
                from_email = "noreply@recyclic.fr"
            if not from_name:
                from_name = "Recyclic"

            # Create email object
            sender = {"name": from_name, "email": from_email}
            to = [{"email": to_email}]

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=to,
                sender=sender,
                subject=subject,
                html_content=html_content
            )

            # Send the email
            api_response = self.api_instance.send_transac_email(send_smtp_email)

            logger.info(f"Email sent successfully to {to_email}. Message ID: {api_response.message_id}")
            return True

        except ApiException as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {e}")
            return False


# Global email service instance
email_service = EmailService()


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Convenience function to send an email.

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    return email_service.send_email(to_email, subject, html_content)