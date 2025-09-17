"""
Configuration des tests pour l'API Recyclic
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from recyclic_api.main import app
from recyclic_api.core.database import get_db, Base

# Base de données de test PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Créer les tables
Base.metadata.create_all(bind=engine)


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
    """Fixture pour la session de base de données"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Override get_db to use the same session
    def override_get_db_same_session():
        yield session
    
    app.dependency_overrides[get_db] = override_get_db_same_session
    
    yield session
    
    # Restore original dependency
    app.dependency_overrides[get_db] = _original_override_get_db
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    """Fixture pour le client de test FastAPI"""
    return TestClient(app)