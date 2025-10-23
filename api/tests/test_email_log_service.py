"""
Tests for EmailLogService.
"""
import pytest
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, timezone

from recyclic_api.models.email_log import EmailLog, EmailStatus, EmailType
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.services.email_log_service import EmailLogService
from recyclic_api.core.security import hash_password


class TestEmailLogService:
    """Test the EmailLogService functionality."""

    def test_create_email_log(self, db_session: Session):
        """Test creating an email log entry."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            body_text="Plain text content",
            body_html="<p>HTML content</p>",
            email_type=EmailType.PASSWORD_RESET,
            user_id=str(uuid4()),
            recipient_name="Test User",
            external_id="ext-123",
            metadata={"key": "value"}
        )
        
        assert email_log.id is not None
        assert email_log.recipient_email == "test@example.com"
        assert email_log.subject == "Test Email"
        assert email_log.body_text == "Plain text content"
        assert email_log.body_html == "<p>HTML content</p>"
        assert email_log.email_type == EmailType.PASSWORD_RESET
        assert email_log.status == EmailStatus.PENDING
        assert email_log.recipient_name == "Test User"
        assert email_log.external_id == "ext-123"
        assert email_log.metadata == '{"key": "value"}'
        assert email_log.created_at is not None
        assert email_log.updated_at is not None

    def test_update_email_status(self, db_session: Session):
        """Test updating email status."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to SENT
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.SENT,
            external_id="ext-123",
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log is not None
        assert updated_log.status == EmailStatus.SENT
        assert updated_log.external_id == "ext-123"
        assert updated_log.sent_at is not None

    def test_update_email_status_delivered(self, db_session: Session):
        """Test updating email status to DELIVERED."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to DELIVERED
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.DELIVERED,
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log.status == EmailStatus.DELIVERED
        assert updated_log.delivered_at is not None

    def test_update_email_status_opened(self, db_session: Session):
        """Test updating email status to OPENED."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to OPENED
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.OPENED,
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log.status == EmailStatus.OPENED
        assert updated_log.opened_at is not None

    def test_update_email_status_clicked(self, db_session: Session):
        """Test updating email status to CLICKED."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to CLICKED
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.CLICKED,
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log.status == EmailStatus.CLICKED
        assert updated_log.clicked_at is not None

    def test_update_email_status_bounced(self, db_session: Session):
        """Test updating email status to BOUNCED."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to BOUNCED
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.BOUNCED,
            error_message="Invalid email address",
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log.status == EmailStatus.BOUNCED
        assert updated_log.bounced_at is not None
        assert updated_log.error_message == "Invalid email address"

    def test_update_email_status_failed(self, db_session: Session):
        """Test updating email status to FAILED."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Update status to FAILED
        updated_log = service.update_email_status(
            email_log_id=str(email_log.id),
            status=EmailStatus.FAILED,
            error_message="SMTP error",
            timestamp=datetime.now(timezone.utc)
        )
        
        assert updated_log.status == EmailStatus.FAILED
        assert updated_log.error_message == "SMTP error"

    def test_get_email_logs_no_filters(self, db_session: Session):
        """Test getting email logs without filters."""
        service = EmailLogService(db_session)
        
        # Create multiple email logs
        for i in range(5):
            service.create_email_log(
                recipient_email=f"test{i}@example.com",
                subject=f"Test Email {i}",
                email_type=EmailType.OTHER
            )
        
        # Get all email logs
        logs = service.get_email_logs()
        
        assert len(logs) == 5
        # Should be ordered by creation date (newest first)
        assert logs[0].created_at >= logs[1].created_at

    def test_get_email_logs_with_filters(self, db_session: Session):
        """Test getting email logs with filters."""
        service = EmailLogService(db_session)
        
        user_id = str(uuid4())
        
        # Create email logs with different attributes
        log1 = service.create_email_log(
            recipient_email="test1@example.com",
            subject="Password Reset",
            email_type=EmailType.PASSWORD_RESET,
            user_id=user_id
        )
        
        log2 = service.create_email_log(
            recipient_email="test2@example.com",
            subject="Welcome Email",
            email_type=EmailType.WELCOME,
            user_id=user_id
        )
        
        # Update statuses
        service.update_email_status(str(log1.id), EmailStatus.SENT)
        service.update_email_status(str(log2.id), EmailStatus.DELIVERED)
        
        # Test filter by status
        logs = service.get_email_logs(status=EmailStatus.SENT)
        assert len(logs) == 1
        assert logs[0].id == log1.id
        
        # Test filter by email type
        logs = service.get_email_logs(email_type=EmailType.WELCOME)
        assert len(logs) == 1
        assert logs[0].id == log2.id
        
        # Test filter by recipient email
        logs = service.get_email_logs(recipient_email="test1")
        assert len(logs) == 1
        assert logs[0].id == log1.id
        
        # Test filter by user_id
        logs = service.get_email_logs(user_id=user_id)
        assert len(logs) == 2

    def test_get_email_logs_pagination(self, db_session: Session):
        """Test email logs pagination."""
        service = EmailLogService(db_session)
        
        # Create multiple email logs
        for i in range(25):
            service.create_email_log(
                recipient_email=f"test{i}@example.com",
                subject=f"Test Email {i}",
                email_type=EmailType.OTHER
            )
        
        # Test pagination
        logs_page1 = service.get_email_logs(skip=0, limit=10)
        assert len(logs_page1) == 10
        
        logs_page2 = service.get_email_logs(skip=10, limit=10)
        assert len(logs_page2) == 10
        
        logs_page3 = service.get_email_logs(skip=20, limit=10)
        assert len(logs_page3) == 5
        
        # Test that pages don't overlap
        page1_ids = {log.id for log in logs_page1}
        page2_ids = {log.id for log in logs_page2}
        assert len(page1_ids.intersection(page2_ids)) == 0

    def test_get_email_logs_count(self, db_session: Session):
        """Test email logs count functionality."""
        service = EmailLogService(db_session)
        
        # Create email logs with different attributes
        user_id = str(uuid4())
        
        for i in range(3):
            service.create_email_log(
                recipient_email=f"test{i}@example.com",
                subject=f"Test Email {i}",
                email_type=EmailType.PASSWORD_RESET,
                user_id=user_id
            )
        
        for i in range(2):
            service.create_email_log(
                recipient_email=f"welcome{i}@example.com",
                subject=f"Welcome Email {i}",
                email_type=EmailType.WELCOME
            )
        
        # Test total count
        total_count = service.get_email_logs_count()
        assert total_count == 5
        
        # Test count with filters
        password_reset_count = service.get_email_logs_count(email_type=EmailType.PASSWORD_RESET)
        assert password_reset_count == 3
        
        welcome_count = service.get_email_logs_count(email_type=EmailType.WELCOME)
        assert welcome_count == 2
        
        user_count = service.get_email_logs_count(user_id=user_id)
        assert user_count == 3

    def test_get_email_log_by_id(self, db_session: Session):
        """Test getting email log by ID."""
        service = EmailLogService(db_session)
        
        # Create email log
        email_log = service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET
        )
        
        # Get by ID
        retrieved_log = service.get_email_log_by_id(str(email_log.id))
        assert retrieved_log is not None
        assert retrieved_log.id == email_log.id
        assert retrieved_log.recipient_email == "test@example.com"
        
        # Test with non-existent ID
        non_existent_log = service.get_email_log_by_id(str(uuid4()))
        assert non_existent_log is None

    def test_get_email_logs_by_user(self, db_session: Session):
        """Test getting email logs by user."""
        service = EmailLogService(db_session)
        
        user_id = str(uuid4())
        
        # Create email logs for the user
        for i in range(3):
            service.create_email_log(
                recipient_email=f"test{i}@example.com",
                subject=f"Test Email {i}",
                email_type=EmailType.OTHER,
                user_id=user_id
            )
        
        # Create email log for different user
        service.create_email_log(
            recipient_email="other@example.com",
            subject="Other Email",
            email_type=EmailType.OTHER,
            user_id=str(uuid4())
        )
        
        # Get logs for specific user
        user_logs = service.get_email_logs_by_user(user_id)
        assert len(user_logs) == 3
        
        # All logs should belong to the user
        for log in user_logs:
            assert log.user_id == user_id

    def test_update_email_status_nonexistent_log(self, db_session: Session):
        """Test updating status for non-existent email log."""
        service = EmailLogService(db_session)
        
        # Try to update non-existent log
        result = service.update_email_status(
            email_log_id=str(uuid4()),
            status=EmailStatus.SENT
        )
        
        assert result is None


