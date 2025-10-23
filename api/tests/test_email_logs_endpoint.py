"""
Tests for email logs endpoint.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, timezone

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.email_log import EmailLog, EmailStatus, EmailType
from recyclic_api.services.email_log_service import EmailLogService
from recyclic_api.core.security import hash_password


class TestEmailLogsEndpoint:
    """Test the email logs endpoint functionality."""

    def test_get_email_logs_requires_admin_role(self, client: TestClient, db_session: Session):
        """Test that email logs endpoint requires admin role."""
        # Create a regular user (not admin)
        user = User(
            id=uuid4(),
            username="user@test.com",
            hashed_password=hash_password("password123"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Create access token for regular user
        from recyclic_api.core.security import create_access_token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Try to access email logs with regular user
        response = client.get(
            "/api/v1/admin/email-logs",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 403

    def test_get_email_logs_success_admin(self, admin_client: TestClient, db_session: Session):
        """Test successful retrieval of email logs with admin user."""
        # Create some test email logs
        email_log_service = EmailLogService(db_session)
        
        # Create test email logs
        log1 = email_log_service.create_email_log(
            recipient_email="test1@example.com",
            subject="Test Email 1",
            email_type=EmailType.PASSWORD_RESET,
            user_id=str(uuid4())
        )
        
        log2 = email_log_service.create_email_log(
            recipient_email="test2@example.com",
            subject="Test Email 2",
            email_type=EmailType.WELCOME,
            user_id=str(uuid4())
        )
        
        # Update statuses
        email_log_service.update_email_status(
            email_log_id=str(log1.id),
            status=EmailStatus.SENT
        )
        
        email_log_service.update_email_status(
            email_log_id=str(log2.id),
            status=EmailStatus.DELIVERED
        )
        
        # Get email logs
        response = admin_client.get("/api/v1/admin/email-logs")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "email_logs" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "total_pages" in data
        
        assert len(data["email_logs"]) == 2
        assert data["total"] == 2
        
        # Check that logs are ordered by creation date (newest first)
        assert data["email_logs"][0]["id"] == str(log2.id)
        assert data["email_logs"][1]["id"] == str(log1.id)

    def test_get_email_logs_with_filters(self, admin_client: TestClient, db_session: Session):
        """Test email logs filtering functionality."""
        # Create test email logs
        email_log_service = EmailLogService(db_session)
        
        user_id = str(uuid4())
        
        # Create logs with different statuses and types
        log1 = email_log_service.create_email_log(
            recipient_email="test1@example.com",
            subject="Password Reset",
            email_type=EmailType.PASSWORD_RESET,
            user_id=user_id
        )
        
        log2 = email_log_service.create_email_log(
            recipient_email="test2@example.com",
            subject="Welcome Email",
            email_type=EmailType.WELCOME,
            user_id=user_id
        )
        
        # Update statuses
        email_log_service.update_email_status(
            email_log_id=str(log1.id),
            status=EmailStatus.SENT
        )
        
        email_log_service.update_email_status(
            email_log_id=str(log2.id),
            status=EmailStatus.DELIVERED
        )
        
        # Test filter by status
        response = admin_client.get("/api/v1/admin/email-logs?status=sent")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 1
        assert data["email_logs"][0]["status"] == EmailStatus.SENT
        
        # Test filter by email type
        response = admin_client.get("/api/v1/admin/email-logs?email_type=password_reset")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 1
        assert data["email_logs"][0]["email_type"] == EmailType.PASSWORD_RESET
        
        # Test filter by recipient email
        response = admin_client.get("/api/v1/admin/email-logs?recipient_email=test1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 1
        assert "test1@example.com" in data["email_logs"][0]["recipient_email"]

    def test_get_email_logs_pagination(self, admin_client: TestClient, db_session: Session):
        """Test email logs pagination."""
        # Create multiple email logs
        email_log_service = EmailLogService(db_session)
        
        for i in range(25):
            email_log_service.create_email_log(
                recipient_email=f"test{i}@example.com",
                subject=f"Test Email {i}",
                email_type=EmailType.OTHER
            )
        
        # Test first page
        response = admin_client.get("/api/v1/admin/email-logs?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 10
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["total"] == 25
        assert data["total_pages"] == 3
        
        # Test second page
        response = admin_client.get("/api/v1/admin/email-logs?page=2&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 10
        assert data["page"] == 2
        
        # Test last page
        response = admin_client.get("/api/v1/admin/email-logs?page=3&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 5
        assert data["page"] == 3

    def test_get_email_logs_invalid_filters(self, admin_client: TestClient):
        """Test email logs with invalid filter values."""
        # Test invalid status
        response = admin_client.get("/api/v1/admin/email-logs?status=invalid_status")
        assert response.status_code == 400
        assert "Statut invalide" in response.json()["detail"]
        
        # Test invalid email type
        response = admin_client.get("/api/v1/admin/email-logs?email_type=invalid_type")
        assert response.status_code == 400
        assert "Type d'email invalide" in response.json()["detail"]

    def test_get_email_logs_empty_result(self, admin_client: TestClient):
        """Test email logs endpoint with no results."""
        response = admin_client.get("/api/v1/admin/email-logs")
        assert response.status_code == 200
        data = response.json()
        assert len(data["email_logs"]) == 0
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["total_pages"] == 0

    def test_get_email_logs_rate_limiting(self, admin_client: TestClient):
        """Test that email logs endpoint respects rate limiting."""
        # Make multiple requests quickly
        responses = []
        for i in range(35):  # More than the 30/minute limit
            response = admin_client.get("/api/v1/admin/email-logs")
            responses.append(response)
        
        # Check that some requests are rate limited
        rate_limited_responses = [r for r in responses if r.status_code == 429]
        assert len(rate_limited_responses) > 0

    def test_email_log_response_schema(self, admin_client: TestClient, db_session: Session):
        """Test that email log response matches expected schema."""
        # Create a test email log
        email_log_service = EmailLogService(db_session)
        
        log = email_log_service.create_email_log(
            recipient_email="test@example.com",
            subject="Test Email",
            email_type=EmailType.PASSWORD_RESET,
            user_id=str(uuid4())
        )
        
        email_log_service.update_email_status(
            email_log_id=str(log.id),
            status=EmailStatus.SENT
        )
        
        # Get email logs
        response = admin_client.get("/api/v1/admin/email-logs")
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "email_logs" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "total_pages" in data
        
        # Check email log structure
        email_log = data["email_logs"][0]
        required_fields = [
            "id", "recipient_email", "subject", "email_type", "status",
            "created_at", "updated_at"
        ]
        
        for field in required_fields:
            assert field in email_log
        
        # Check enum values
        assert email_log["email_type"] in [e.value for e in EmailType]
        assert email_log["status"] in [e.value for e in EmailStatus]


