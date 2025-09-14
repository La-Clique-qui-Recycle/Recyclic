import os, sys
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from recyclic_api.core.config import settings
from recyclic_api.core.database import Base, get_db
from recyclic_api.core.auth import require_admin_role, get_current_user
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.main import app
import uuid

# S'assurer que api/src est dans le PYTHONPATH si exécution hors pyproject
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test"

def ensure_test_database(url: str) -> None:
    u = make_url(url)
    admin_url = u.set(database="postgres")
    dbname = u.database

    # Création DB si absente
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": dbname}).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{dbname}"'))
    admin_engine.dispose()

def create_schema(url: str) -> None:
    """Create schema using SQLAlchemy directly"""
    test_engine = create_engine(url, pool_pre_ping=True)
    Base.metadata.create_all(bind=test_engine)
    test_engine.dispose()

def drop_schema(url: str) -> None:
    test_engine = create_engine(url, pool_pre_ping=True)
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()

def get_test_session_factory(url: str):
    engine = create_engine(url, pool_pre_ping=True)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Client + DB override (module scope)
import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import AsyncMock, Mock, patch

@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    # Charger .env test postgres en externe (ou exporter les vars)
    # os.environ[...] déjà préparé avant pytest
    ensure_test_database(TEST_DB_URL)
    create_schema(TEST_DB_URL)

    TestingSessionLocal = get_test_session_factory(TEST_DB_URL)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Create mock admin user for auth override
    mock_admin = User(
        id=uuid.uuid4(),
        telegram_id="test_admin_sync_123",
        first_name="Test",
        last_name="AdminSync",
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )

    def mock_get_current_user() -> User:
        return mock_admin

    # Override get_current_user for all authentication-dependent endpoints
    app.dependency_overrides[get_current_user] = mock_get_current_user

    c = TestClient(app)
    try:
        yield c
    finally:
        app.dependency_overrides.clear()
        drop_schema(TEST_DB_URL)


@pytest_asyncio.fixture(scope="module")
async def async_client() -> Generator[AsyncClient, None, None]:
    """AsyncClient fixture for async tests using FastAPI TestClient equivalent"""
    # Use same database setup as sync client
    ensure_test_database(TEST_DB_URL)
    create_schema(TEST_DB_URL)

    TestingSessionLocal = get_test_session_factory(TEST_DB_URL)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Create mock admin user for auth override
    mock_admin = User(
        id=uuid.uuid4(),
        telegram_id="test_admin_123",
        first_name="Test",
        last_name="Admin",
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )

    def mock_get_current_user() -> User:
        return mock_admin

    # Override get_current_user for all authentication-dependent endpoints
    app.dependency_overrides[get_current_user] = mock_get_current_user

    # For async tests, use FastAPI's AsyncClient equivalent through TestClient
    from httpx import ASGITransport
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        headers={"host": "testserver"}
    ) as ac:
        try:
            yield ac
        finally:
            app.dependency_overrides.clear()
            drop_schema(TEST_DB_URL)


@pytest.fixture
def mock_redis():
    """Mock Redis fixture for infrastructure tests"""
    mock = Mock()
    mock.ping.return_value = True
    mock.info.return_value = {"redis_version": "7.0.0"}

    with patch("recyclic_api.core.redis.redis_client", mock):
        yield mock