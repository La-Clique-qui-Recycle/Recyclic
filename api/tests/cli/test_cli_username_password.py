"""
Tests for updated CLI commands with username/password authentication
Story auth.B - Backend CLI adaptation
"""

import pytest
import os
from unittest.mock import patch, MagicMock
from recyclic_api.cli import create_super_admin
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.config import settings
from recyclic_api.core.security import verify_password

# Use Postgres test database
TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or settings.DATABASE_URL


@pytest.fixture
def mock_db_session():
    """Mock database session for CLI tests"""
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])
        yield mock_session


def test_create_super_admin_success(mock_db_session):
    """Test successful super admin creation with username and password"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    # Mock database operations
    mock_user = MagicMock()
    mock_user.id = "test-uuid"
    mock_user.username = "superadmin"
    mock_user.role = UserRole.SUPER_ADMIN
    mock_user.status = UserStatus.APPROVED

    mock_db_session.add.return_value = None
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.return_value = None

    # Test the function
    try:
        create_super_admin("superadmin", "securepassword123")
        # If we get here, the function succeeded
        assert True
    except SystemExit as e:
        if e.code != 0:
            raise


def test_create_super_admin_user_exists(mock_db_session):
    """Test super admin creation when username already exists"""
    # Mock existing user
    existing_user = MagicMock()
    existing_user.username = "superadmin"
    existing_user.role = UserRole.USER
    existing_user.status = UserStatus.PENDING
    mock_db_session.query.return_value.filter.return_value.first.return_value = existing_user

    # Test the function
    try:
        create_super_admin("superadmin", "password123")
        assert False, "Should have exited with error"
    except SystemExit as e:
        assert e.code == 1


def test_create_super_admin_database_error(mock_db_session):
    """Test super admin creation with database error"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    # Mock database error
    mock_db_session.add.side_effect = Exception("Database connection failed")

    # Test the function
    try:
        create_super_admin("superadmin", "password123")
        assert False, "Should have exited with error"
    except SystemExit as e:
        assert e.code == 1


def test_create_super_admin_password_hashing(mock_db_session):
    """Test that password is properly hashed when creating super admin"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    # Mock database operations
    created_user = None

    def capture_user(user):
        nonlocal created_user
        created_user = user

    mock_db_session.add.side_effect = capture_user
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.return_value = None

    password = "testpassword123"

    # Test the function
    try:
        create_super_admin("testadmin", password)

        # Verify that User was created with hashed password
        assert created_user is not None
        assert created_user.username == "testadmin"
        assert created_user.hashed_password != password  # Should be hashed, not plain
        assert len(created_user.hashed_password) > 0

        # Verify password can be verified with the hash
        assert verify_password(password, created_user.hashed_password)
        assert not verify_password("wrongpassword", created_user.hashed_password)

    except SystemExit as e:
        if e.code != 0:
            raise


def test_create_super_admin_user_fields(mock_db_session):
    """Test that user is created with correct role and status"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    # Mock database operations
    created_user = None

    def capture_user(user):
        nonlocal created_user
        created_user = user

    mock_db_session.add.side_effect = capture_user
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.return_value = None

    # Test the function
    try:
        create_super_admin("newadmin", "adminpass123")

        # Verify that User was created with correct attributes
        assert created_user is not None
        assert created_user.username == "newadmin"
        assert created_user.role == UserRole.SUPER_ADMIN.value
        assert created_user.status == UserStatus.APPROVED.value
        assert created_user.is_active is True

    except SystemExit as e:
        if e.code != 0:
            raise


def test_create_super_admin_empty_username():
    """Test create super admin with empty username"""
    # This would be caught by argparse validation, but let's test the function directly
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])

        # Mock database query to return no existing user for empty string
        mock_session.query.return_value.filter.return_value.first.return_value = None

        # Mock database operations that would fail
        mock_session.add.side_effect = Exception("Database constraint violation")

        # Test the function
        try:
            create_super_admin("", "password123")
            assert False, "Should have failed"
        except SystemExit as e:
            assert e.code == 1


def test_create_super_admin_empty_password():
    """Test create super admin with empty password"""
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])

        # Mock database query to return no existing user
        mock_session.query.return_value.filter.return_value.first.return_value = None

        # Test the function with empty password
        try:
            create_super_admin("testuser", "")
            # This should succeed as the function doesn't validate password strength
            assert True
        except SystemExit as e:
            if e.code != 0:
                raise


def test_create_super_admin_username_uniqueness(mock_db_session):
    """Test that username uniqueness is properly checked"""
    # Mock existing user with same username
    existing_user = MagicMock()
    existing_user.username = "admin"
    existing_user.role = UserRole.ADMIN
    existing_user.status = UserStatus.APPROVED
    mock_db_session.query.return_value.filter.return_value.first.return_value = existing_user

    # Test the function should fail
    try:
        create_super_admin("admin", "newpassword123")
        assert False, "Should have exited with error due to duplicate username"
    except SystemExit as e:
        assert e.code == 1


def test_create_super_admin_special_characters_password():
    """Test create super admin with special characters in password"""
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])

        # Mock database query to return no existing user
        mock_session.query.return_value.filter.return_value.first.return_value = None

        # Mock database operations
        created_user = None

        def capture_user(user):
            nonlocal created_user
            created_user = user

        mock_session.add.side_effect = capture_user
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None

        complex_password = "P@ssw0rd!#$%^&*()_+"

        # Test the function
        try:
            create_super_admin("complexuser", complex_password)

            # Verify password is properly hashed and can be verified
            assert created_user is not None
            assert verify_password(complex_password, created_user.hashed_password)

        except SystemExit as e:
            if e.code != 0:
                raise