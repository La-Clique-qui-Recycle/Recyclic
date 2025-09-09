import os, sys
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from recyclic_api.core.config import settings
from recyclic_api.core.database import Base, get_db
from main import app

# S'assurer que api/src est dans le PYTHONPATH si exécution hors pyproject
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic@localhost:5432/recyclic_test"

def ensure_test_database(url: str) -> None:
    u = make_url(url)
    admin_url = u.set(database="postgres")
    dbname = u.database

    # Création DB si absente
    admin_engine = create_engine(admin_url)
    with admin_engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": dbname}).scalar()
        if not exists:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(f'CREATE DATABASE "{dbname}"'))
    admin_engine.dispose()

def create_schema(url: str) -> None:
    test_engine = create_engine(url, pool_pre_ping=True)
    # Use Alembic migrations instead of metadata.create_all()
    from alembic.config import Config
    from alembic import command
    
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", url)
    command.upgrade(alembic_cfg, "head")
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
    c = TestClient(app)
    try:
        yield c
    finally:
        app.dependency_overrides.clear()
        drop_schema(TEST_DB_URL)