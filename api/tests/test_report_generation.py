import csv
import os
import time
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from recyclic_api.core.config import settings
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.services.export_service import generate_cash_session_report
from recyclic_api.core.security import hash_password


def _create_site(db_session: Session) -> Site:
    site = Site(
        name="Report Site",
        address="10 Place des Rapports",
        city="Paris",
        postal_code="75001",
        country="France",
        is_active=True,
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site


def _create_operator(db_session: Session, site: Site) -> User:
    operator = User(
        telegram_id="report_operator",
        username="report_operator",
        email="report@example.com",
        hashed_password=hash_password("operator-secret"),
        first_name="Report",
        last_name="Operator",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site.id,
    )
    db_session.add(operator)
    db_session.commit()
    db_session.refresh(operator)
    return operator


def test_generate_cash_session_report_creates_csv(monkeypatch, tmp_path: Path, db_session: Session):
    reports_dir = tmp_path / "reports"
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_DIR", str(reports_dir))
    monkeypatch.setattr(settings, "CASH_SESSION_REPORT_RETENTION_DAYS", 30)

    site = _create_site(db_session)
    operator = _create_operator(db_session, site)

    session = CashSession(
        operator_id=operator.id,
        site_id=site.id,
        initial_amount=100.0,
        current_amount=100.0,
        status=CashSessionStatus.CLOSED,
        total_sales=75.0,
        total_items=5,
    )
    session.closed_at = session.opened_at
    session.actual_amount = 175.0
    session.variance = 0.0
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    sale = Sale(cash_session_id=session.id, total_amount=25.0)
    db_session.add(sale)
    db_session.commit()
    db_session.refresh(sale)

    sale_item = SaleItem(
        sale_id=sale.id,
        category="EEE-1",
        quantity=2,
        unit_price=12.5,
        total_price=25.0,
    )
    db_session.add(sale_item)
    db_session.commit()

    old_file = reports_dir / f"cash_session_{uuid4()}_old.csv"
    reports_dir.mkdir(parents=True, exist_ok=True)
    old_file.write_text("old\n", encoding="utf-8")
    old_timestamp = time.time() - (60 * 60 * 24 * 60)
    os.utime(old_file, (old_timestamp, old_timestamp))

    report_path = generate_cash_session_report(db_session, session)

    assert report_path.exists()
    assert report_path.parent == reports_dir
    assert report_path.name.startswith(f"cash_session_{session.id}_")
    assert not old_file.exists(), "Retention policy should remove stale reports"

    with report_path.open("r", encoding="utf-8") as handle:
        rows = list(csv.reader(handle))

    header = rows[0]
    assert header == ['section', 'field', 'value']
    summary = {row[1]: row[2] for row in rows[1:16] if row and row[0] == 'session_summary'}
    assert summary["Session ID"] == str(session.id)
    assert summary["Total Sales"] == "75.00"
    assert summary["Total Items"] == "5"


def test_generate_cash_session_report_respects_custom_dir(monkeypatch, tmp_path: Path, db_session: Session):
    custom_dir = tmp_path / "custom" / "reports"
    site = _create_site(db_session)
    operator = _create_operator(db_session, site)

    session = CashSession(
        operator_id=operator.id,
        site_id=site.id,
        initial_amount=40.0,
        current_amount=55.0,
        status=CashSessionStatus.CLOSED,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    report_path = generate_cash_session_report(db_session, session, reports_dir=custom_dir)

    assert report_path.exists()
    assert report_path.parent == custom_dir
    assert report_path.read_text(encoding="utf-8").splitlines()[0] == 'section,field,value'
