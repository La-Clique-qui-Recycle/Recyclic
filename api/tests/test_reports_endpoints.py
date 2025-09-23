from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.core.auth import create_access_token
from recyclic_api.core.config import settings
from recyclic_api.core.security import hash_password
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.cash_register import CashRegister
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.utils.report_tokens import generate_download_token


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def _create_site(db_session: Session, name: str) -> Site:
    site = Site(
        name=name,
        address="123 Rue des Tests",
        city="Testville",
        postal_code="75000",
        country="France",
        is_active=True,
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site


def _create_operator(db_session: Session, site: Site, username: str = "report_operator") -> User:
    operator = User(
        telegram_id=f"tg_{username}",
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password("operator-secret"),
        first_name="Report",
        last_name="Operator",
        role=UserRole.CASHIER,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site.id,
    )
    db_session.add(operator)
    db_session.commit()
    db_session.refresh(operator)
    operator.site = site
    return operator


def _create_session_record(db_session: Session, operator: User, site: Site) -> CashSession:
    # Créer un poste de caisse pour la session
    register = CashRegister(
        id=uuid4(),
        name="Test Register",
        location="Test Location",
        site_id=site.id,
        is_active=True
    )
    db_session.add(register)
    db_session.flush()  # Flush pour obtenir l'ID
    
    session = CashSession(
        id=uuid4(),
        operator_id=operator.id,
        site_id=site.id,
        register_id=register.id,
        initial_amount=50.0,
        current_amount=50.0,
        status=CashSessionStatus.CLOSED,
        total_sales=25.0,
        total_items=3,
    )
    session.closed_at = datetime.now(timezone.utc)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


@pytest.fixture
def admin_user(db_session: Session) -> User:
    site = _create_site(db_session, "Site Admin")
    user = User(
        telegram_id='admin_reports',
        username='admin_reports',
        first_name='Admin',
        last_name='Reports',
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
        hashed_password=hash_password('reports-secret'),
        site_id=site.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_list_reports_endpoint(monkeypatch, tmp_path: Path, client: TestClient, admin_user: User, db_session: Session):
    reports_dir = tmp_path / "reports"
    reports_dir.mkdir()
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))

    operator_site = _create_site(db_session, "Site Reports")
    operator = _create_operator(db_session, operator_site)
    sessions = [
        _create_session_record(db_session, operator, operator_site),
        _create_session_record(db_session, operator, operator_site),
    ]

    filenames: list[str] = []
    for session in sessions:
        filename = f"cash_session_{session.id}_20250101010101.csv"
        file_path = reports_dir / filename
        file_path.write_text("header\n", encoding="utf-8")
        filenames.append(filename)

    response = client.get(
        "/api/v1/admin/reports/cash-sessions",
        headers=_auth_headers(admin_user),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == len(filenames)
    returned = [entry["filename"] for entry in payload["reports"]]
    assert set(returned) == set(filenames)
    for entry in payload["reports"]:
        parsed = urlparse(entry["download_url"])
        assert parsed.path.endswith(entry["filename"])
        token = parse_qs(parsed.query).get('token', [None])[0]
        assert token


def test_download_report_requires_token(monkeypatch, tmp_path: Path, client: TestClient, admin_user: User, db_session: Session):
    reports_dir = tmp_path / 'reports'
    reports_dir.mkdir()
    monkeypatch.setattr(settings, 'CASH_SESSION_REPORT_DIR', str(reports_dir))

    site = _create_site(db_session, "Site Token")
    operator = _create_operator(db_session, site)
    session = _create_session_record(db_session, operator, site)

    filename = f"cash_session_{session.id}_20250102020202.csv"
    report_file = reports_dir / filename
    report_file.write_text('content\n', encoding='utf-8')

    response = client.get(
        f"/api/v1/admin/reports/cash-sessions/{filename}",
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == 422

    response = client.get(
        f"/api/v1/admin/reports/cash-sessions/{filename}",
        params={'token': 'invalid'},
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == 403


def test_download_report_endpoint(monkeypatch, tmp_path: Path, client: TestClient, admin_user: User, db_session: Session):
    reports_dir = tmp_path / "reports"
    reports_dir.mkdir()
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))

    site = db_session.query(Site).filter(Site.id == admin_user.site_id).first()
    if site is None:
        site = _create_site(db_session, "Admin Site")
        admin_user.site_id = site.id
        db_session.commit()
    operator = _create_operator(db_session, site)
    session = _create_session_record(db_session, operator, site)

    filename = f"cash_session_{session.id}_20250103030303.csv"
    report_file = reports_dir / filename
    report_file.write_text("content\n", encoding="utf-8")

    list_response = client.get(
        "/api/v1/admin/reports/cash-sessions",
        headers=_auth_headers(admin_user),
    )
    download_entry = next(entry for entry in list_response.json()["reports"] if entry["filename"] == filename)
    parsed = urlparse(download_entry["download_url"])
    token = parse_qs(parsed.query).get("token", [None])[0]

    response = client.get(
        parsed.path,
        params={"token": token},
        headers=_auth_headers(admin_user),
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["content-disposition"].endswith(f'filename="{filename}"')
    assert response.content.decode('utf-8').replace('\r\n', '\n') == 'content\n'


def test_download_report_access_control(monkeypatch, tmp_path: Path, client: TestClient, db_session: Session):
    reports_dir = tmp_path / "reports"
    reports_dir.mkdir()
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))

    site_allowed = _create_site(db_session, "Site Allowed")
    site_restricted = _create_site(db_session, "Site Restricted")

    operator = _create_operator(db_session, site_allowed)
    session = _create_session_record(db_session, operator, site_allowed)

    filename = f"cash_session_{session.id}_20250104040404.csv"
    report_path = reports_dir / filename
    report_path.write_text("data\n", encoding="utf-8")

    admin_allowed = User(
        telegram_id='admin_allowed',
        username='admin_allowed',
        first_name='Admin',
        last_name='Allowed',
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
        hashed_password=hash_password('allowed-secret'),
        site_id=site_allowed.id,
    )
    admin_restricted = User(
        telegram_id='admin_restricted',
        username='admin_restricted',
        first_name='Admin',
        last_name='Restricted',
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
        hashed_password=hash_password('restricted-secret'),
        site_id=site_restricted.id,
    )
    db_session.add_all([admin_allowed, admin_restricted])
    db_session.commit()
    db_session.refresh(admin_allowed)
    db_session.refresh(admin_restricted)

    token = generate_download_token(filename)

    denied_response = client.get(
        f"/api/v1/admin/reports/cash-sessions/{filename}",
        params={"token": token},
        headers=_auth_headers(admin_restricted),
    )
    assert denied_response.status_code == 403

    allowed_response = client.get(
        f"/api/v1/admin/reports/cash-sessions/{filename}",
        params={"token": token},
        headers=_auth_headers(admin_allowed),
    )
    assert allowed_response.status_code == 200
    assert allowed_response.content.decode('utf-8').replace('\r\n', '\n') == 'data\n'
