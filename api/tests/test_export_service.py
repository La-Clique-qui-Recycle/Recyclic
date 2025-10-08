"""Tests for Ecologic export service (Story 4.1)."""

from __future__ import annotations

import csv
from datetime import datetime, timedelta
from pathlib import Path
import os

import pytest

from recyclic_api.models.deposit import Deposit, DepositStatus, EEECategory
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.core.config import settings
from recyclic_api.services.export_service import (
    ECOLOGIC_CATEGORIES,
    generate_ecologic_csv,
    generate_cash_session_report,
    preview_ecologic_export,
)


@pytest.fixture
def sample_data(db_session):
    """Create sample deposits and sales for export tests."""
    site = Site(name="Test Ressourcerie")
    db_session.add(site)
    db_session.flush()

    donor = User(
        username="donor",
        hashed_password="hashed",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        site_id=site.id,
    )
    cashier = User(
        username="cashier",
        hashed_password="hashed",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        site_id=site.id,
    )
    db_session.add_all([donor, cashier])
    db_session.flush()

    base_time = datetime(2025, 1, 10, 10, 30, 0)

    deposits = [
        Deposit(
            user_id=donor.id,
            site_id=site.id,
            status=DepositStatus.COMPLETED,
            category=EEECategory.SMALL_APPLIANCE,
            weight=3.5,
            created_at=base_time,
        ),
        Deposit(
            user_id=donor.id,
            site_id=site.id,
            status=DepositStatus.VALIDATED,
            category=EEECategory.LARGE_APPLIANCE,
            weight=12.0,
            created_at=base_time + timedelta(hours=1),
        ),
        Deposit(
            user_id=donor.id,
            site_id=site.id,
            status=DepositStatus.COMPLETED,
            category=None,
            eee_category=EEECategory.OTHER,
            weight=None,
            created_at=base_time + timedelta(days=1),
        ),
        # Should be ignored (status not finalized)
        Deposit(
            user_id=donor.id,
            site_id=site.id,
            status=DepositStatus.PENDING_AUDIO,
            category=EEECategory.TOOLS,
            weight=4.0,
            created_at=base_time,
        ),
    ]
    db_session.add_all(deposits)

    cash_session = CashSession(
        operator_id=cashier.id,
        site_id=site.id,
        initial_amount=100,
        current_amount=150,
        status=CashSessionStatus.OPEN,
        opened_at=base_time,
    )
    db_session.add(cash_session)
    db_session.flush()

    sale = Sale(
        cash_session_id=cash_session.id,
        total_amount=40.0,
        created_at=base_time + timedelta(hours=2),
    )
    db_session.add(sale)
    db_session.flush()

    sale_items = [
        SaleItem(
            sale_id=sale.id,
            category="EEE-2",
            quantity=2,
            unit_price=10.0,
            total_price=20.0,
        ),
        SaleItem(
            sale_id=sale.id,
            category="EEE-8",
            quantity=1,
            unit_price=20.0,
            total_price=20.0,
        ),
    ]
    db_session.add_all(sale_items)
    db_session.commit()

    return {
        "site": site,
        "donor": donor,
        "cashier": cashier,
        "base_time": base_time,
    }


def _read_csv(path: Path) -> dict[str, dict[str, str]]:
    with path.open("r", encoding="utf-8") as export_file:
        reader = csv.DictReader(export_file)
        return {row["category_code"]: row for row in reader}


def test_generate_ecologic_csv_creates_expected_file(sample_data, db_session, tmp_path):
    start = sample_data["base_time"] - timedelta(days=1)
    end = sample_data["base_time"] + timedelta(days=2)

    export_path = generate_ecologic_csv(
        db=db_session,
        date_from=start,
        date_to=end,
        export_dir=tmp_path,
    )

    assert export_path.exists()
    rows = _read_csv(export_path)

    # Verify deterministic row set
    assert set(rows.keys()) == {cat.code for cat in ECOLOGIC_CATEGORIES}

    eee2 = rows["EEE-2"]
    assert eee2["deposit_count"] == "1"
    assert eee2["deposit_weight_kg"] == "3.5"
    assert eee2["sales_quantity"] == "2"
    assert eee2["sales_amount_eur"] == "20.0"

    eee1 = rows["EEE-1"]
    assert eee1["deposit_count"] == "1"
    assert eee1["deposit_weight_kg"] == "12.0"
    assert eee1["sales_quantity"] == "0"

    eee8 = rows["EEE-8"]
    assert eee8["deposit_count"] == "1"
    assert eee8["deposit_weight_kg"] == "0.0"
    assert eee8["sales_quantity"] == "1"
    assert eee8["sales_amount_eur"] == "20.0"

    # Ensure ignored deposit did not appear in EEE-5 (tools)
    assert rows["EEE-5"]["deposit_count"] == "0"

    # Period metadata consistent
    assert rows["EEE-1"]["period_start"] == start.date().isoformat()
    assert rows["EEE-1"]["period_end"] == end.date().isoformat()
    assert rows["EEE-1"]["generated_at"]


def test_preview_ecologic_export_returns_aggregated_rows(sample_data, db_session):
    start = sample_data["base_time"] - timedelta(days=1)
    end = sample_data["base_time"] + timedelta(days=2)

    rows = preview_ecologic_export(db_session, start, end)

    assert len(rows) == len(ECOLOGIC_CATEGORIES)
    codes = [row["category_code"] for row in rows]
    assert codes == [cat.code for cat in ECOLOGIC_CATEGORIES]

    eee2 = next(row for row in rows if row["category_code"] == "EEE-2")
    assert eee2["deposit_count"] == 1
    assert eee2["deposit_weight_kg"] == 3.5
    assert eee2["sales_quantity"] == 2
    assert eee2["sales_amount_eur"] == 20.0



def test_generate_cash_session_report_prunes_old_files(db_session, monkeypatch, tmp_path, sample_data):
    monkeypatch.setattr(settings, 'CASH_SESSION_REPORT_DIR', str(tmp_path))
    monkeypatch.setattr(settings, 'CASH_SESSION_REPORT_RETENTION_DAYS', 1)

    old_file = tmp_path / 'old_report.csv'
    old_file.write_text('old', encoding='utf-8')
    past = datetime.utcnow() - timedelta(days=2)
    os.utime(old_file, (past.timestamp(), past.timestamp()))

    cashier = db_session.query(User).filter_by(username='cashier').first()
    site = sample_data['site']

    session = CashSession(
        operator_id=cashier.id,
        site_id=site.id,
        initial_amount=50.0,
        current_amount=75.0,
        status=CashSessionStatus.CLOSED,
        opened_at=sample_data['base_time'],
        closed_at=sample_data['base_time'] + timedelta(hours=8),
        total_sales=25.0,
        total_items=5,
    )
    db_session.add(session)
    db_session.commit()

    report_path = generate_cash_session_report(db_session, session, reports_dir=tmp_path)

    assert report_path.exists()
    assert report_path.parent == tmp_path
    assert report_path.name.startswith(f"cash_session_{session.id}")
    assert not old_file.exists()
