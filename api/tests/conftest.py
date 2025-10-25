"""
Configuration des tests pour l'API Recyclic
"""

import sys
from pathlib import Path

# Ajouter la racine du projet au PYTHONPATH pour résoudre les imports
# /app/tests/conftest.py -> /app
sys.path.insert(0, str(Path(__file__).parent.parent))

import types

if "reportlab" not in sys.modules:
    reportlab = types.ModuleType("reportlab")
    lib = types.ModuleType("reportlab.lib")
    colors = types.ModuleType("reportlab.lib.colors")
    colors.HexColor = lambda value: value
    pagesizes = types.ModuleType("reportlab.lib.pagesizes")
    pagesizes.A4 = (0, 0)
    styles = types.ModuleType("reportlab.lib.styles")
    class _Dummy:
        def __init__(self, *args, **kwargs):
            pass

    styles.getSampleStyleSheet = lambda: {}
    styles.ParagraphStyle = _Dummy
    units = types.ModuleType("reportlab.lib.units")
    units.cm = 1
    enums = types.ModuleType("reportlab.lib.enums")
    enums.TA_CENTER = 1
    enums.TA_LEFT = 0
    platypus = types.ModuleType("reportlab.platypus")
    platypus.SimpleDocTemplate = _Dummy
    platypus.Table = _Dummy
    platypus.TableStyle = _Dummy
    platypus.Paragraph = _Dummy
    platypus.Spacer = _Dummy
    platypus.PageBreak = _Dummy
    platypus.KeepTogether = _Dummy
    sys.modules["reportlab"] = reportlab
    sys.modules["reportlab.lib"] = lib
    sys.modules["reportlab.lib.colors"] = colors
    sys.modules["reportlab.lib.pagesizes"] = pagesizes
    sys.modules["reportlab.lib.styles"] = styles
    sys.modules["reportlab.lib.units"] = units
    sys.modules["reportlab.lib.enums"] = enums
    sys.modules["reportlab.platypus"] = platypus

if "openpyxl" not in sys.modules:
    class _DummyCell:
        def __init__(self):
            self.font = None
            self.fill = None
            self.alignment = None

    class _DummyColumn:
        def __init__(self):
            self.width = None

    class _DummyWorksheet:
        def __init__(self):
            self.title = ""
            self._rows = []
            self.column_dimensions = {chr(ord('A') + i): _DummyColumn() for i in range(26)}

        def append(self, row):
            self._rows.append(row)

        def __getitem__(self, key):
            index = int(key) - 1 if not isinstance(key, int) else key - 1
            row = self._rows[index] if 0 <= index < len(self._rows) else []
            return [_DummyCell() for _ in row]

        @property
        def max_row(self):
            return len(self._rows)

        def iter_rows(self, min_row=1, max_row=None):
            max_row = max_row or self.max_row
            for idx in range(min_row - 1, max_row):
                row = self._rows[idx] if 0 <= idx < len(self._rows) else []
                yield [_DummyCell() for _ in row]

    class _DummyWorkbook:
        def __init__(self):
            self.active = _DummyWorksheet()

        def save(self, _buffer):
            pass

    class _DummyFont:
        def __init__(self, *args, **kwargs):
            pass

    class _DummyAlignment:
        def __init__(self, *args, **kwargs):
            pass

    class _DummyPatternFill:
        def __init__(self, *args, **kwargs):
            pass

    openpyxl = types.ModuleType("openpyxl")
    styles_module = types.ModuleType("openpyxl.styles")
    styles_module.Font = _DummyFont
    styles_module.Alignment = _DummyAlignment
    styles_module.PatternFill = _DummyPatternFill

    sys.modules["openpyxl"] = openpyxl
    sys.modules["openpyxl.styles"] = styles_module
    openpyxl.styles = styles_module

    def _workbook_factory():
        return _DummyWorkbook()

    openpyxl.Workbook = _DummyWorkbook

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
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://recyclic:your_postgres_password@localhost:5432/recyclic_test")
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
def super_admin_client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture pour un client de test avec les droits de super-administrateur.
    Crée un utilisateur super-admin, génère un token JWT et configure le client.
    """
    # Création de l'utilisateur super-admin
    super_admin_username = f"superadmin_{uuid.uuid4().hex}@test.com"
    super_admin_password = "superadmin_password"
    hashed_password = hash_password(super_admin_password)

    super_admin_user = User(
        username=super_admin_username,
        hashed_password=hashed_password,
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        telegram_id=888888888  # integer comme attendu par les tests
    )
    db_session.add(super_admin_user)
    db_session.commit()
    db_session.refresh(super_admin_user)

    # Génération du token
    access_token = create_access_token(data={"sub": str(super_admin_user.id)})

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

