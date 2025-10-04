"""
Configuration des tests pour l'API Recyclic
"""

import sys
from pathlib import Path

# Ajouter la racine du projet au PYTHONPATH pour résoudre les imports
# /app/tests/conftest.py -> /app
sys.path.insert(0, str(Path(__file__).parent.parent))

import os
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json
from typing import Generator
import uuid

from recyclic_api.main import app
from recyclic_api.core.database import get_db, Base
from sqlalchemy import text
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.models.site import Site
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.cash_register import CashRegister
from recyclic_api.models.sync_log import SyncLog
from recyclic_api.models.registration_request import RegistrationRequest
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.models.category import Category
from recyclic_api.core.security import create_access_token, hash_password

# Configuration de la base de données de test
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://recyclic:recyclic_secure_password_2024@postgres:5432/recyclic_test")
os.environ["TESTING"] = "true"

engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
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

@pytest.fixture(scope="session")
def db_engine():
    """Crée les tables une seule fois pour toute la session de test."""
    print("🔧 (tests) Moteur de base de données de test prêt.")
    create_tables_if_not_exist()
    return engine

@pytest.fixture(scope="function", autouse=True)
def _db_autouse(db_engine):
    """Fixture autouse qui isole chaque test avec sa propre session DB et override FastAPI."""
    connection = db_engine.connect()
    transaction = connection.begin()

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
        # Ne PAS rollback la transaction - on veut que les données persistent pendant le test
        connection.close()

@pytest.fixture(scope="function")
def db_session(_db_autouse):
    """Alias pour la session DB (back-compat)."""
    return _db_autouse

@pytest.fixture(scope="function")
def client(db_session):
    """Fixture pour le client de test FastAPI qui utilise la session de test."""
    return TestClient(app)


@pytest.fixture(scope="function")
def client_with_jwt_auth(db_session):
    """Fixture pour un client de test avec utilisateur authentifié (compatible avec les tests existants)."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def admin_client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture pour un client de test avec les droits d'administrateur.
    Crée un utilisateur admin, génère un token JWT et configure le client.
    """
    # Vérifier si un admin existe déjà
    admin_user = db_session.query(User).filter(User.role == UserRole.ADMIN).first()

    if admin_user is None:
        # Création de l'utilisateur admin
        admin_username = f"admin_{uuid.uuid4().hex}@test.com"
        admin_password = "admin_password"
        hashed_password = hash_password(admin_password)

        admin_user = User(
            username=admin_username,
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            telegram_id=999999999  # integer comme attendu par les tests
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

    # Génération du token
    access_token = create_access_token(data={"sub": str(admin_user.id)})

    # Configuration du client de test
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {access_token}"

    yield client

@pytest.fixture(scope="function")
def async_client():
    """Fixture pour le client de test asynchrone FastAPI."""
    return AsyncClient(app=app, base_url="http://testserver")


@pytest.fixture(scope="session")
def openapi_schema():
    """Fixture pour le schéma OpenAPI (généré dynamiquement, pas depuis fichier)."""
    return app.openapi()

