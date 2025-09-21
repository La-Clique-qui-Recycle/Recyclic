from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.core.config import settings
from recyclic_api.core.security import hash_password, create_access_token
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def _create_user(db: Session, role: UserRole, username: str, site_id) -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password('StrongPass!23'),
        role=role,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_dashboard_stats_endpoint(tmp_path: Path, client: TestClient, db_session: Session):
    # Redirect reports directory to temporary path for the test
    original_dir = settings.CASH_SESSION_REPORT_DIR
    settings.CASH_SESSION_REPORT_DIR = str(tmp_path)

    try:
        site = Site(
            id=uuid4(),
            name='Site Gestion',
            address='10 avenue des Caisses',
            city='Lyon',
            postal_code='69000',
            country='France',
            is_active=True,
        )
        db_session.add(site)
        db_session.commit()

        admin_user = _create_user(db_session, UserRole.ADMIN, 'admin_stats', site.id)
        operator = _create_user(db_session, UserRole.CASHIER, 'cashier_stats', site.id)

        session = CashSession(
            operator_id=operator.id,
            site_id=site.id,
            initial_amount=100.0,
            current_amount=250.0,
            status=CashSessionStatus.CLOSED,
            opened_at=datetime(2025, 1, 1, 8, 0, tzinfo=timezone.utc),
            closed_at=datetime(2025, 1, 1, 16, 0, tzinfo=timezone.utc),
            total_sales=150.0,
            total_items=12,
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        # Create a fake report file for this session
        report_name = f"cash_session_{session.id}_20250101080000.csv"
        report_path = tmp_path / report_name
        report_path.write_text('section,field,value\n', encoding='utf-8')

        response = client.get(
            '/api/v1/admin/dashboard/stats',
            headers=_auth_headers(admin_user),
        )
        assert response.status_code == 200
        payload = response.json()

        metrics = payload['metrics']
        assert metrics['totalSessions'] >= 1
        assert pytest.approx(metrics['totalSales']) == 150.0
        assert payload['encryptedMetrics'] != ''

        sessions = payload['recentSessions']
        assert any(entry['sessionId'].startswith(str(session.id)[:8]) or entry['sessionId'] == str(session.id) for entry in sessions)

        reports = payload['recentReports']
        assert len(reports) == 1
        assert reports[0]['filename'] == report_name
        assert '/admin/reports/cash-sessions/' in reports[0]['downloadUrl']

    finally:
        settings.CASH_SESSION_REPORT_DIR = original_dir

