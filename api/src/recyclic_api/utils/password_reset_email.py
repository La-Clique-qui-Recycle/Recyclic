"""
Utility functions for password reset email functionality.
"""

import os
from pathlib import Path
from typing import Optional
import logging

from recyclic_api.core.email_service import EmailService, EmailConfigurationError
from recyclic_api.core.config import settings

logger = logging.getLogger(__name__)


def load_email_template(template_name: str) -> str:
    """
    Load an email template from the templates directory.
    
    Args:
        template_name: Name of the template file (e.g., 'password_reset.html')
        
    Returns:
        str: Template content as string
        
    Raises:
        FileNotFoundError: If template file doesn't exist
    """
    # Get the directory where this file is located
    current_dir = Path(__file__).parent
    # Navigate to the templates directory
    templates_dir = current_dir.parent / "templates" / "emails"
    template_path = templates_dir / template_name
    
    if not template_path.exists():
        raise FileNotFoundError(f"Email template not found: {template_path}")
    
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()


def send_password_reset_email(
    to_email: str, 
    reset_link: str, 
    user_name: Optional[str] = None
) -> bool:
    """
    Send a password reset email to the user.
    
    Args:
        to_email: Recipient email address
        reset_link: The password reset link with token
        user_name: Optional user name for personalization
        
    Returns:
        bool: True if email was sent successfully, False otherwise
        
    Raises:
        EmailConfigurationError: If email service is not configured
        FileNotFoundError: If email template is not found
    """
    try:
        # Load the email template
        template_content = load_email_template("password_reset.html")
        
        # Replace template variables
        html_content = template_content.replace("{{ reset_link }}", reset_link)
        if user_name:
            html_content = html_content.replace("{{ user_name }}", user_name)
        else:
            html_content = html_content.replace("{{ user_name }}", "")
        
        # Initialize email service
        email_service = EmailService(require_api_key=True)
        
        # Prepare email content
        subject = "🔄 Réinitialisation de votre mot de passe - RecyClique"
        
        # Send the email
        success = email_service.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_email=settings.EMAIL_FROM_ADDRESS,
            from_name=settings.EMAIL_FROM_NAME
        )
        
        if success:
            logger.info(f"Password reset email sent successfully to {to_email}")
        else:
            logger.error(f"Failed to send password reset email to {to_email}")
            
        return success
        
    except EmailConfigurationError as e:
        logger.error(f"Email service not configured: {e}")
        raise
    except FileNotFoundError as e:
        logger.error(f"Email template not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending password reset email: {e}")
        return False


def send_password_reset_email_safe(
    to_email: str, 
    reset_link: str, 
    user_name: Optional[str] = None
) -> bool:
    """
    Safe version of send_password_reset_email that doesn't raise exceptions.
    
    Args:
        to_email: Recipient email address
        reset_link: The password reset link with token
        user_name: Optional user name for personalization
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        return send_password_reset_email(to_email, reset_link, user_name)
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        return False
