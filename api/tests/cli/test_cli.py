"""
Tests for CLI commands
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from recyclic_api.cli import create_super_admin
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.config import settings

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
    """Test successful super admin creation"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Mock database operations
    mock_user = MagicMock()
    mock_user.id = "test-uuid"
    mock_user.telegram_id = "123456789"
    mock_user.first_name = "Test"
    mock_user.last_name = "Admin"
    mock_user.role = UserRole.SUPER_ADMIN
    mock_user.status = UserStatus.APPROVED
    
    mock_db_session.add.return_value = None
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.return_value = None
    
    # Test the function directly
    try:
        create_super_admin("123456789", "Test Admin")
        # If we get here, the function succeeded
        assert True
    except SystemExit as e:
        if e.code != 0:
            raise

def test_create_super_admin_user_exists(mock_db_session):
    """Test super admin creation when user already exists"""
    # Mock existing user
    existing_user = MagicMock()
    existing_user.role = UserRole.USER
    existing_user.status = UserStatus.PENDING
    mock_db_session.query.return_value.filter.return_value.first.return_value = existing_user
    
    # Test the function directly
    try:
        create_super_admin("123456789", "Test Admin")
        assert False, "Should have exited with error"
    except SystemExit as e:
        assert e.code == 1

def test_create_super_admin_database_error(mock_db_session):
    """Test super admin creation with database error"""
    # Mock database query to return no existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Mock database error
    mock_db_session.add.side_effect = Exception("Database connection failed")
    
    # Test the function directly
    try:
        create_super_admin("123456789", "Test Admin")
        assert False, "Should have exited with error"
    except SystemExit as e:
        assert e.code == 1

def test_create_super_admin_name_parsing():
    """Test that full name is correctly parsed into first and last name"""
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])
        
        # Mock database query to return no existing user
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        # Mock database operations
        mock_user = MagicMock()
        mock_user.id = "test-uuid"
        mock_user.telegram_id = "123456789"
        mock_user.first_name = "John"
        mock_user.last_name = "Doe Smith"
        mock_user.role = UserRole.SUPER_ADMIN
        mock_user.status = UserStatus.APPROVED
        
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        # Test the function directly
        try:
            create_super_admin("123456789", "John Doe Smith")
            # Verify that User was created with correct name parts
            mock_session.add.assert_called_once()
            created_user = mock_session.add.call_args[0][0]
            assert created_user.first_name == "John"
            assert created_user.last_name == "Doe Smith"
        except SystemExit as e:
            if e.code != 0:
                raise

def test_create_super_admin_single_name():
    """Test super admin creation with single name (no last name)"""
    with patch('recyclic_api.cli.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = iter([mock_session])
        
        # Mock database query to return no existing user
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        # Mock database operations
        mock_user = MagicMock()
        mock_user.id = "test-uuid"
        mock_user.telegram_id = "123456789"
        mock_user.first_name = "Admin"
        mock_user.last_name = ""
        mock_user.role = UserRole.SUPER_ADMIN
        mock_user.status = UserStatus.APPROVED
        
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        # Test the function directly
        try:
            create_super_admin("123456789", "Admin")
            # Verify that User was created with correct name parts
            mock_session.add.assert_called_once()
            created_user = mock_session.add.call_args[0][0]
            assert created_user.first_name == "Admin"
            assert created_user.last_name == ""
        except SystemExit as e:
            if e.code != 0:
                raise

