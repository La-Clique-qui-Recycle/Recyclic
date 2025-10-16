import uuid
from datetime import datetime, timezone

from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.core.auth import create_access_token
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.cash_session import CashSession, CashSessionStatus


def make_user_client(client: TestClient, db_session: Session) -> TestClient:
    user = User(
        id=uuid.uuid4(),
        username="basic.user",
        hashed_password="x",
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(data={"sub": str(user.id)})
    client.headers["Authorization"] = f"Bearer {token}"
    return client


def test_stats_summary_requires_admin(client: TestClient, db_session: Session):
    basic_client = make_user_client(client, db_session)
    r = basic_client.get("/v1/cash-sessions/stats/summary")
    assert r.status_code == 403


def test_cash_session_detail_requires_admin(client: TestClient, db_session: Session):
    # Create a session
    s = CashSession(
        operator_id=uuid.uuid4(),
        site_id=uuid.uuid4(),
        register_id=uuid.uuid4(),
        initial_amount=10.0,
        current_amount=10.0,
        status=CashSessionStatus.OPEN,
        opened_at=datetime.now(timezone.utc),
    )
    db_session.add(s)
    db_session.commit()

    basic_client = make_user_client(client, db_session)
    r = basic_client.get(f"/v1/cash-sessions/{s.id}")
    assert r.status_code == 403


def test_admin_reports_requires_admin(client: TestClient, db_session: Session):
    basic_client = make_user_client(client, db_session)
    r = basic_client.get("/v1/admin/reports/cash-sessions")
    assert r.status_code in (401, 403)


