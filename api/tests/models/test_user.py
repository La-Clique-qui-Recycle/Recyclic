"""
Tests for User model
"""
import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import IntegrityError
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.database import Base
from recyclic_api.core.config import settings

# Use Postgres test database
TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test"

def ensure_test_database(url: str) -> None:
    u = make_url(url)
    admin_url = u.set(database="postgres")
    dbname = u.database
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": dbname}).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{dbname}"'))
    admin_engine.dispose()

def create_schema(url: str) -> None:
    """Create schema using SQLAlchemy directly"""
    engine = create_engine(url)
    Base.metadata.create_all(bind=engine)
    engine.dispose()

def drop_schema(url: str) -> None:
    """Drop schema using SQLAlchemy directly"""
    engine = create_engine(url)
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture(scope="module")
def db_setup():
    """Set up database schema for all tests in module"""
    ensure_test_database(TEST_DB_URL)
    create_schema(TEST_DB_URL)
    yield
    # Cleanup by dropping the test database completely
    u = make_url(TEST_DB_URL)
    admin_url = u.set(database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        conn.execute(text(f'DROP DATABASE IF EXISTS "{u.database}"'))
    admin_engine.dispose()

@pytest.fixture(scope="function")
def db_session(db_setup):
    """Create a test database session"""
    engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        # Clean up any existing data before each test
        db.execute(text("TRUNCATE users RESTART IDENTITY CASCADE"))
        db.commit()
        yield db
    finally:
        db.rollback()  # Rollback any uncommitted transactions
        db.close()
        engine.dispose()

def test_user_role_enum_values():
    """Test that UserRole enum has all expected values"""
    assert UserRole.SUPER_ADMIN == "super-admin"
    assert UserRole.ADMIN == "admin"
    assert UserRole.MANAGER == "manager"
    assert UserRole.CASHIER == "cashier"
    assert UserRole.USER == "user"

def test_user_status_enum_values():
    """Test that UserStatus enum has all expected values"""
    assert UserStatus.PENDING == "pending"
    assert UserStatus.APPROVED == "approved"
    assert UserStatus.REJECTED == "rejected"

def test_user_creation_with_defaults(db_session):
    """Test user creation with default values"""
    user = User(
        username="test_user",
        email="test@example.com",
        hashed_password="hashed_password_123",
        first_name="Test",
        last_name="User"
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Check defaults
    assert user.role == UserRole.USER
    assert user.status == UserStatus.PENDING
    assert user.is_active == True
    assert user.email == "test@example.com"
    assert user.hashed_password == "hashed_password_123"
    assert user.telegram_id is None  # telegram_id is now nullable
    assert user.first_name == "Test"
    assert user.last_name == "User"

def test_user_creation_with_custom_values(db_session):
    """Test user creation with custom role and status"""
    user = User(
        username="admin_user",
        email="admin@example.com",
        hashed_password="admin_hashed_password",
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.APPROVED
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.role == UserRole.SUPER_ADMIN
    assert user.status == UserStatus.APPROVED
    assert user.email == "admin@example.com"
    assert user.hashed_password == "admin_hashed_password"
    assert user.telegram_id == "987654321"

def test_user_repr():
    """Test user string representation"""
    user = User(
        email="admin@example.com",
        hashed_password="hashed_password",
        telegram_id="123456789",
        first_name="Test",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED
    )

    repr_str = repr(user)
    assert "telegram_id=123456789" in repr_str
    assert "role=UserRole.ADMIN" in repr_str
    assert "status=UserStatus.APPROVED" in repr_str

def test_user_creation_with_email_and_password(db_session):
    """Test user creation with new email and hashed_password fields"""
    user = User(
        username="email_user",
        email="user@test.com",
        hashed_password="secure_hashed_password",
        first_name="Email",
        last_name="User"
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.email == "user@test.com"
    assert user.hashed_password == "secure_hashed_password"
    assert user.telegram_id is None  # telegram_id can be None now

def test_user_unique_username(db_session):
    """Test that username must be unique"""
    user1 = User(username="duplicate_user", email="user1@example.com", hashed_password="password1", first_name="User1")
    user2 = User(username="duplicate_user", email="user2@example.com", hashed_password="password2", first_name="User2")

    db_session.add(user1)
    db_session.commit()

    db_session.add(user2)
    with pytest.raises(IntegrityError):  # Should raise integrity error
        db_session.commit()

def test_user_non_unique_email(db_session):
    """Test that email can be duplicated (non-unique)"""
    user1 = User(username="user1", email="duplicate@example.com", hashed_password="password1", first_name="User1")
    user2 = User(username="user2", email="duplicate@example.com", hashed_password="password2", first_name="User2")

    db_session.add(user1)
    db_session.add(user2)
    db_session.commit()  # Should succeed - email is no longer unique

    db_session.refresh(user1)
    db_session.refresh(user2)
    assert user1.email == "duplicate@example.com"
    assert user2.email == "duplicate@example.com"

def test_user_nullable_telegram_id(db_session):
    """Test that telegram_id can be None and multiple users can have None telegram_id"""
    user1 = User(username="user1", email="user1@example.com", hashed_password="password1", first_name="User1")
    user2 = User(username="user2", email="user2@example.com", hashed_password="password2", first_name="User2")

    # Both users should be able to have None telegram_id
    db_session.add(user1)
    db_session.add(user2)
    db_session.commit()

    db_session.refresh(user1)
    db_session.refresh(user2)

    assert user1.telegram_id is None
    assert user2.telegram_id is None

def test_user_username_required(db_session):
    """Test that username is required (not nullable)"""
    user = User(
        email="test@example.com",
        hashed_password="password123",
        first_name="Test",
        last_name="User"
    )
    
    db_session.add(user)
    with pytest.raises(IntegrityError):  # Should raise integrity error due to null username
        db_session.commit()

