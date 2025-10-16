import uuid
from datetime import datetime, timezone

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.user import User, UserRole, UserStatus


def test_cash_sessions_search_by_operator_username(admin_client, db_session):
    # Arrange
    operator = User(
        id=uuid.uuid4(),
        username="jean.dupont",
        hashed_password="x",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(operator)
    db_session.commit()

    s = CashSession(
        operator_id=operator.id,
        site_id=uuid.uuid4(),
        register_id=uuid.uuid4(),
        initial_amount=10.0,
        current_amount=10.0,
        status=CashSessionStatus.OPEN,
        opened_at=datetime.now(timezone.utc),
    )
    db_session.add(s)
    db_session.commit()

    # Act
    resp = admin_client.get("/v1/cash-sessions/", params={"search": "jean"})

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    items = data["data"] if isinstance(data, dict) and "data" in data else data
    assert any(row["id"] == str(s.id) for row in items)


def test_cash_sessions_search_by_session_id(admin_client, db_session):
    # Arrange
    operator = User(
        id=uuid.uuid4(),
        username="search.test",
        hashed_password="x",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(operator)
    db_session.commit()

    s = CashSession(
        operator_id=operator.id,
        site_id=uuid.uuid4(),
        register_id=uuid.uuid4(),
        initial_amount=10.0,
        current_amount=10.0,
        status=CashSessionStatus.OPEN,
        opened_at=datetime.now(timezone.utc),
    )
    db_session.add(s)
    db_session.commit()

    # Act
    resp = admin_client.get("/v1/cash-sessions/", params={"search": str(s.id)[:8]})

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    items = data["data"] if isinstance(data, dict) and "data" in data else data
    assert any(row["id"] == str(s.id) for row in items)


