"""
Configuration des tests pour l'API Recyclic
"""

import os
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from recyclic_api.main import app
from recyclic_api.core.database import get_db, Base

# Import all models to ensure they are registered with Base
from recyclic_api.models.user import User
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.models.site import Site
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.sync_log import SyncLog
from recyclic_api.models.registration_request import RegistrationRequest
from recyclic_api.models.user_status_history import UserStatusHistory

# Configuration de la base de données de test
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://recyclic:recyclic_secure_password_2024@postgres:5432/recyclic_test")
os.environ["TESTING"] = "true"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fonction pour créer les tables
def create_tables_if_not_exist():
    """Créer les tables si elles n'existent pas"""
    try:
        print("🔧 Création des tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès")
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")

# Créer les tables immédiatement au chargement du module
print("🔧 Création des tables au chargement du module...")
Base.metadata.create_all(bind=engine)
print("✅ Tables créées avec succès")

@pytest.fixture(scope="session")
def db_engine():
    """Crée les tables une seule fois pour toute la session de test."""
    print("🔧 Création des tables dans la base de données de test...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables créées avec succès")
    return engine

@pytest.fixture(scope="function", autouse=True)
def _db_autouse(db_engine):
    """Fixture autouse qui isole chaque test avec sa propre session DB et override FastAPI."""
    connection = db_engine.connect()
    transaction = connection.begin()

    # Créer les tables sur cette connexion spécifique
    Base.metadata.create_all(bind=connection)

    session = TestingSessionLocal(bind=connection)

    def override_get_db():
        try:
            yield session
        finally:
            pass

    # Override ciblé (pas de clear global)
    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        # Pop ciblé (pas de clear global)
        app.dependency_overrides.pop(get_db, None)
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def db_session(_db_autouse):
    """Alias pour la session DB (back-compat)."""
    return _db_autouse

@pytest.fixture(scope="function")
def client(db_session):
    """Fixture pour le client de test FastAPI qui utilise la session de test."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db(_db_autouse):
    """Alias de compatibilité pour la session DB (équivalent à db_session)."""
    return _db_autouse

@pytest.fixture(scope="function")
def client_with_jwt_auth(db_session):
    """Alias de compatibilité pour un client de test (pas d'en-tête JWT par défaut)."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def async_client():
    """Fixture pour le client de test asynchrone FastAPI."""
    return AsyncClient(app=app, base_url="http://testserver")