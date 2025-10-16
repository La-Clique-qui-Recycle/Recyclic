import uuid
from datetime import datetime, timedelta, timezone

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.user import User, UserRole, UserStatus


def test_filters_combined_with_pagination(admin_client, db_session):
    # Arrange: create operator and multiple sessions
    operator = User(
        id=uuid.uuid4(),
        username="combo",
        hashed_password="x",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(operator)
    db_session.commit()

    base_time = datetime.now(timezone.utc) - timedelta(days=10)
    site_id = uuid.uuid4()

    sessions = []
    for i in range(15):
        s = CashSession(
            operator_id=operator.id,
            site_id=site_id,
            register_id=uuid.uuid4(),
            initial_amount=10.0,
            current_amount=10.0,
            status=CashSessionStatus.CLOSED if i % 2 else CashSessionStatus.OPEN,
            opened_at=base_time + timedelta(days=i),
            closed_at=(base_time + timedelta(days=i, hours=1)) if i % 2 else None,
            total_sales= float(i),
            total_items= i,
        )
        sessions.append(s)
    db_session.add_all(sessions)
    db_session.commit()

    # Act: combine filters (status=closed, site_id, date_from, search by operator username)
    params = {
        "status": "closed",
        "site_id": str(site_id),
        "date_from": (base_time + timedelta(days=5)).isoformat(),
        "limit": 5,
        "skip": 0,
        "search": "comb",  # partial username
    }
    r = admin_client.get("/v1/cash-sessions/", params=params)

    # Assert
    assert r.status_code == 200
    payload = r.json()
    assert "total" in payload
    assert isinstance(payload["data"], list)
    # Only closed sessions from day >=5 should be counted
    assert all(row["status"] == "closed" for row in payload["data"])
    assert len(payload["data"]) <= 5


