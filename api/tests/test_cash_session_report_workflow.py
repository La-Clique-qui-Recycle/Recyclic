from pathlib import Path
from urllib.parse import urlparse, parse_qs

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import MagicMock

from recyclic_api.core.auth import create_access_token
from recyclic_api.core.config import settings
from recyclic_api.core.security import hash_password
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.utils.report_tokens import verify_download_token, generate_download_token


def _create_site(db_session: Session, name: str) -> Site:
    site = Site(
        name=name,
        address="1 Rue des Rapports",
        city="Paris",
        postal_code="75001",
        country="France",
        is_active=True,
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site


def _create_user(db_session: Session, *, username: str, role: UserRole, site: Site) -> User:
    user = User(
        telegram_id=f"tg_{username}",
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password("secret"),
        first_name=username.capitalize(),
        last_name="User",
        role=role,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_cash_session_report_workflow(monkeypatch, tmp_path: Path, client: TestClient, db_session: Session):
    reports_dir = tmp_path / "reports"
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_RECIPIENT", "reports@example.com")

    fake_email_service = MagicMock()
    fake_email_service.send_email.return_value = True
    monkeypatch.setattr(
        'recyclic_api.api.api_v1.endpoints.cash_sessions.get_email_service',
        lambda: fake_email_service,
    )

    site = _create_site(db_session, "Workflow Site")
    cashier = _create_user(db_session, username="cashier_workflow", role=UserRole.CASHIER, site=site)
    admin = _create_user(db_session, username="admin_workflow", role=UserRole.ADMIN, site=site)

    session = CashSession(
        operator_id=cashier.id,
        site_id=site.id,
        initial_amount=60.0,
        current_amount=60.0,
        status=CashSessionStatus.OPEN,
        total_sales=40.0,
        total_items=4,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    sale = Sale(cash_session_id=session.id, total_amount=40.0)
    db_session.add(sale)
    db_session.commit()
    db_session.refresh(sale)

    sale_item = SaleItem(
        sale_id=sale.id,
        category="EEE-2",
        quantity=4,
        unit_price=10.0,
        total_price=40.0,
    )
    db_session.add(sale_item)
    db_session.commit()

    response = client.post(
        f"/api/v1/cash-sessions/{session.id}/close",
        json={"actual_amount": 100.0, "variance_comment": None},
        headers=_auth_headers(cashier),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["report_download_url"].startswith(settings.API_V1_STR)
    assert payload["report_email_sent"] is True
    fake_email_service.send_email.assert_called_once()

    download_url = payload["report_download_url"]
    parsed = urlparse(download_url)
    token = parse_qs(parsed.query).get("token", [None])[0]
    assert token
    filename = Path(parsed.path).name
    assert verify_download_token(token, filename)

    assert any(file.name == filename for file in reports_dir.iterdir())

    list_response = client.get(
        "/api/v1/admin/reports/cash-sessions",
        headers=_auth_headers(admin),
    )
    assert list_response.status_code == 200
    listed_files = [entry["filename"] for entry in list_response.json()["reports"]]
    assert filename in listed_files

    download_response = client.get(
        parsed.path,
        params={"token": token},
        headers=_auth_headers(admin),
    )
    assert download_response.status_code == 200
    assert download_response.headers["content-type"].startswith("text/csv")


def test_cash_session_report_site_restriction(monkeypatch, tmp_path: Path, client: TestClient, db_session: Session):
    reports_dir = tmp_path / "reports"
    reports_dir.mkdir()
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))

    site_a = _create_site(db_session, "Site A")
    site_b = _create_site(db_session, "Site B")

    operator = _create_user(db_session, username="cashier_a", role=UserRole.CASHIER, site=site_a)
    admin_same = _create_user(db_session, username="admin_a", role=UserRole.ADMIN, site=site_a)
    admin_other = _create_user(db_session, username="admin_b", role=UserRole.ADMIN, site=site_b)

    session = CashSession(
        operator_id=operator.id,
        site_id=site_a.id,
        initial_amount=30.0,
        current_amount=30.0,
        status=CashSessionStatus.CLOSED,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    report_filename = f"cash_session_{session.id}_20250105050505.csv"
    report_path = reports_dir / report_filename
    report_path.write_text("demo\n", encoding="utf-8")

    token = generate_download_token(report_filename)

    denied = client.get(
        f"/api/v1/admin/reports/cash-sessions/{report_filename}",
        params={"token": token},
        headers=_auth_headers(admin_other),
    )
    assert denied.status_code == 403

    allowed = client.get(
        f"/api/v1/admin/reports/cash-sessions/{report_filename}",
        params={"token": token},
        headers=_auth_headers(admin_same),
    )
    assert allowed.status_code == 200
    assert allowed.content.decode('utf-8').replace('\r\n', '\n') == 'demo\n'
