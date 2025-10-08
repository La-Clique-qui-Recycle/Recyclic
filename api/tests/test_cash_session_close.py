import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from unittest.mock import patch, MagicMock

from recyclic_api.main import app
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.config import settings
from recyclic_api.utils.report_tokens import verify_download_token

@pytest.fixture
def test_user(client, db_session: Session):
    """Créer un utilisateur de test."""
    from recyclic_api.core.security import hash_password
    hashed_password = hash_password("testpassword123")

    user = User(
        telegram_id="test_user_123",
        username="test_cashier",
        email="test@example.com",
        hashed_password=hashed_password,
        first_name="Test",
        last_name="Cashier",
    role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_site(client, db_session: Session):
    """Créer un site de test."""
    site = Site(
        name="Test Site",
        address="123 Test Street",
        city="Test City",
        postal_code="12345",
        country="Test Country",
        is_active=True
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site




@pytest.fixture
def report_environment(monkeypatch, tmp_path):
    """Configure report directory and mock email service."""
    report_dir = tmp_path / 'reports'
    monkeypatch.setattr(settings, 'CASH_SESSION_REPORT_DIR', str(report_dir))
    monkeypatch.setattr(settings, 'CASH_SESSION_REPORT_RECIPIENT', 'reports@example.com')

    report_dir.mkdir(parents=True, exist_ok=True)

    def _fake_generate(db_session, cash_session, reports_dir=None):
        target_dir = Path(reports_dir) if reports_dir else report_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / f"{cash_session.id}.csv"
        file_path.write_text("session_id\n", encoding='utf-8')
        return file_path

    fake_email_service = MagicMock()
    fake_email_service.send_email.return_value = True
    fake_email_service.report_dir = report_dir

    monkeypatch.setattr(
        'recyclic_api.api.api_v1.endpoints.cash_sessions.generate_cash_session_report',
        _fake_generate,
    )
    monkeypatch.setattr(
        'recyclic_api.api.api_v1.endpoints.cash_sessions.get_email_service',
        lambda: fake_email_service,
    )

    return fake_email_service

@pytest.fixture
def test_cash_session(client, db_session: Session, test_user: User, test_site: Site):
    """Créer une session de caisse de test."""
    session = CashSession(
        operator_id=test_user.id,
        site_id=test_site.id,
        initial_amount=50.0,
        current_amount=50.0,
        status=CashSessionStatus.OPEN,
        total_sales=25.0,
        total_items=3
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


class TestCashSessionClose:
    """Tests pour l'endpoint de fermeture de session de caisse."""

    def test_close_session_without_variance(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User, report_environment):
        """Test de fermeture de session sans écart."""
        # Données de fermeture
        close_data = {
            "actual_amount": 75.0,  # 50 (initial) + 25 (ventes) = 75
            "variance_comment": None
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier les données de la session fermée (CashSessionResponse direct)
        assert data["status"] == "closed"
        assert data["closing_amount"] == 75.0
        assert data["actual_amount"] == 75.0
        assert data["variance"] == 0.0
        assert data["variance_comment"] is None

        download_url = data["report_download_url"]
        parsed = urlparse(download_url)
        token = parse_qs(parsed.query).get('token', [None])[0]
        assert token
        filename = Path(parsed.path).name
        assert verify_download_token(token, filename)
        assert (Path(settings.CASH_SESSION_REPORT_DIR) / filename).exists()

        assert data["report_email_sent"] is True
        assert report_environment.send_email.called

    def test_close_session_with_variance_and_comment(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User, report_environment):
        """Test de fermeture de session avec écart et commentaire."""
        # Données de fermeture avec écart
        close_data = {
            "actual_amount": 80.0,  # 5€ d'écart en plus
            "variance_comment": "Petite monnaie supplémentaire trouvée"
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier les données de la session fermée (CashSessionResponse direct)
        assert data["status"] == "closed"
        assert data["closing_amount"] == 75.0
        assert data["actual_amount"] == 80.0
        assert data["variance"] == 5.0
        assert data["variance_comment"] == "Petite monnaie supplémentaire trouvée"

        download_url = data["report_download_url"]
        parsed = urlparse(download_url)
        token = parse_qs(parsed.query).get('token', [None])[0]
        assert token
        filename = Path(parsed.path).name
        assert verify_download_token(token, filename)
        assert (Path(settings.CASH_SESSION_REPORT_DIR) / filename).exists()

        assert data["report_email_sent"] is True
        assert report_environment.send_email.called

    def test_close_session_with_variance_without_comment_fails(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User):
        """Test de fermeture de session avec écart mais sans commentaire (doit échouer)."""
        # Données de fermeture avec écart mais sans commentaire
        close_data = {
            "actual_amount": 80.0,  # 5€ d'écart en plus
            "variance_comment": None
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications - doit échouer
        assert response.status_code == 400
        data = response.json()
        assert "commentaire est obligatoire" in data["detail"]

    def test_close_session_negative_amount_fails(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User):
        """Test de fermeture de session avec montant négatif (doit échouer)."""
        # Données de fermeture avec montant négatif
        close_data = {
            "actual_amount": -10.0,
            "variance_comment": None
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications - doit échouer
        assert response.status_code == 422  # Validation error

    def test_close_session_already_closed_fails(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User):
        """Test de fermeture d'une session déjà fermée (doit échouer)."""
        # Fermer la session d'abord
        test_cash_session.status = CashSessionStatus.CLOSED
        db_session.commit()
        
        # Données de fermeture
        close_data = {
            "actual_amount": 75.0,
            "variance_comment": None
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications - doit échouer
        assert response.status_code == 400
        data = response.json()
        assert "déjà fermée" in data["detail"]

    def test_close_session_not_found_fails(self, client: TestClient, db_session: Session, test_user: User):
        """Test de fermeture d'une session inexistante (doit échouer)."""
        # Données de fermeture
        close_data = {
            "actual_amount": 75.0,
            "variance_comment": None
        }
        
        # Appel de l'endpoint avec un ID inexistant
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.post(
            f"/api/v1/cash-sessions/{fake_id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications - doit échouer
        assert response.status_code == 404

    def test_close_session_unauthorized_fails(self, client: TestClient, db_session: Session, test_cash_session: CashSession):
        """Test de fermeture de session sans autorisation (doit échouer)."""
        # Données de fermeture
        close_data = {
            "actual_amount": 75.0,
            "variance_comment": None
        }
        
        # Appel de l'endpoint sans token
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data
        )
        
        # Vérifications - doit échouer
        assert response.status_code == 401

    def test_close_session_tolerance_for_small_variance(self, client: TestClient, db_session: Session, test_cash_session: CashSession, test_user: User, report_environment):
        """Test de fermeture avec un petit écart (tolérance de 1 centime)."""
        # Données de fermeture avec écart de 0.5 centime (dans la tolérance)
        close_data = {
            "actual_amount": 75.005,  # 0.5 centime d'écart
            "variance_comment": None
        }
        
        # Appel de l'endpoint
        response = client.post(
            f"/api/v1/cash-sessions/{test_cash_session.id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {create_access_token(data={'sub': str(test_user.id)})}"}
        )
        
        # Vérifications - doit réussir
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "closed"
        download_url = data["report_download_url"]
        parsed = urlparse(download_url)
        token = parse_qs(parsed.query).get('token', [None])[0]
        assert token
        filename = Path(parsed.path).name
        assert verify_download_token(token, filename)
        assert (Path(settings.CASH_SESSION_REPORT_DIR) / filename).exists()
        assert data["report_email_sent"] is True
        assert report_environment.send_email.called
