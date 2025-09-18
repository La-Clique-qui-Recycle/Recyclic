"""
Configuration des tests pour l'API Recyclic
"""

import os
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url

from recyclic_api.main import app
from recyclic_api.core.database import get_db, Base

# Base de données de test PostgreSQL
# Use dedicated test DB URL when available
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test")

# Ensure test environment
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("ENVIRONMENT", "test")

# Ensure the test database exists
def _ensure_test_database(url: str) -> None:
    try:
        u = make_url(url)
        admin_url = u.set(database="postgres")
        dbname = u.database
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with admin_engine.connect() as conn:
            exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": dbname}).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{dbname}"'))
        admin_engine.dispose()
    except Exception:
        # If unable to ensure DB (e.g., no server running), leave as-is; tests that require DB will fail explicitly
        pass

_ensure_test_database(SQLALCHEMY_DATABASE_URL)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure tables exist for tests - use SQLAlchemy directly for reliability
def _ensure_tables_exist():
    """Ensure all required tables exist for testing"""
    try:
        # Import models to register metadata before create_all
        import recyclic_api.models  # noqa: F401
        from recyclic_api.core.database import Base
        Base.metadata.create_all(bind=engine)
        # Ensure new columns exist in legacy tables when using Postgres
        try:
            if engine.dialect.name == 'postgresql':
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE sites ADD COLUMN IF NOT EXISTS city VARCHAR"))
                    conn.execute(text("ALTER TABLE sites ADD COLUMN IF NOT EXISTS postal_code VARCHAR"))
                    conn.execute(text("ALTER TABLE sites ADD COLUMN IF NOT EXISTS country VARCHAR"))
                    # Ensure enum userstatus contains 'active' (for load tests)
                    try:
                        conn.execute(text("ALTER TYPE userstatus ADD VALUE IF NOT EXISTS 'active'"))
                    except Exception:
                        pass
                    conn.commit()
        except Exception as _e:
            # Non-fatal in case of permissions or other issues
            print(f"Warning ensuring sites columns: {_e}")
        print("Tables created successfully for testing")
    except Exception as e:
        print(f"Error creating tables: {e}")

_ensure_tables_exist()


def override_get_db():
    """Override de la dépendance get_db pour les tests"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Store the original override for restoration
_original_override_get_db = override_get_db


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def db_session():
    """Fixture pour la session de base de données avec isolation complète"""
    connection = engine.connect()
    # Assure les tables pour cette connexion spécifique
    try:
        import recyclic_api.models  # noqa: F401
        from recyclic_api.core.database import Base as _Base
        _Base.metadata.create_all(bind=connection)
        # Termine toute transaction ouverte par create_all
        try:
            connection.commit()
        except Exception:
            pass
    except Exception:
        pass
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Override get_db to use the same session
    def override_get_db_same_session():
        yield session
    
    app.dependency_overrides[get_db] = override_get_db_same_session
    
    yield session
    
    # Cleanup: rollback transaction and close connections
    try:
        session.close()
        transaction.rollback()
    except Exception:
        # If rollback fails, try to close anyway
        pass
    finally:
        connection.close()
        # Restore original dependency
        app.dependency_overrides[get_db] = _original_override_get_db


@pytest.fixture
def client():
    """Fixture pour le client de test FastAPI"""
    return TestClient(app)


@pytest.fixture
def client_with_jwt_auth():
    """Fixture pour le client de test FastAPI avec authentification JWT"""
    return TestClient(app)


# Nouveau: client asynchrone avec token admin par défaut
@pytest_asyncio.fixture
async def async_client():
    import uuid
    from httpx import AsyncClient
    from recyclic_api.models.user import User, UserRole, UserStatus
    from recyclic_api.core.security import hash_password
    from recyclic_api.core.auth import create_access_token

    session = TestingSessionLocal()
    try:
        admin_user = User(
            id=uuid.uuid4(),
            username="admin_async",
            hashed_password=hash_password("admin"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)

        token = create_access_token({"sub": str(admin_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver", headers=headers) as ac:
            yield ac
    finally:
        session.close()


@pytest.fixture
def db(db_session):
    """Alias pour db_session pour compatibilité"""
    return db_session


@pytest.fixture(autouse=True)
def cleanup_database():
    """Fixture automatique pour nettoyer la base de données entre les tests"""
    yield  # Run the test
    
    # Skip cleanup for E2E and Integration tests that manage their own data
    import os
    if os.getenv('SKIP_DB_CLEANUP', '').lower() == 'true':
        return
    
    # Cleanup after each test - only clean data, not tables
    try:
        with engine.connect() as conn:
            # Only clean data if tables exist
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            existing_tables = [row[0] for row in result]
            
            if existing_tables:
                # Disable foreign key checks temporarily
                conn.execute(text("SET session_replication_role = replica"))
                
                # Clean up tables in reverse dependency order
                tables_to_clean = [
                    'cash_sessions', 'deposits', 'sales', 'users', 'sites'
                ]
                
                for table in tables_to_clean:
                    if table in existing_tables:
                        try:
                            conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                        except Exception:
                            # If truncate fails, try delete
                            try:
                                conn.execute(text(f"DELETE FROM {table}"))
                            except Exception:
                                pass
                
                # Re-enable foreign key checks
                conn.execute(text("SET session_replication_role = DEFAULT"))
                conn.commit()
    except Exception:
        # If cleanup fails, continue - individual tests should handle their own cleanup
        pass


@pytest.fixture
def mock_redis():
    """Fixture factice pour satisfaire les tests qui attendent mock_redis."""
    class DummyRedis:
        def ping(self):
            return True
    return DummyRedis()
