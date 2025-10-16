import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.user import User, UserRole, UserStatus


def test_cash_sessions_combined_filters_list_and_kpis(admin_client, db_session: Session):
    # Arrange
    site_id = uuid.uuid4()
    operator = User(
        id=uuid.uuid4(),
        username="combo.operator",
        hashed_password="x",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        site_id=site_id,
    )
    db_session.add(operator)
    db_session.commit()

    in_range = datetime.now(timezone.utc) - timedelta(days=2)
    out_range = datetime.now(timezone.utc) - timedelta(days=30)

    # session matching all filters
    s_match = CashSession(
        operator_id=operator.id,
        site_id=site_id,
        register_id=uuid.uuid4(),
        initial_amount=10.0,
        current_amount=10.0,
        status=CashSessionStatus.CLOSED,
        opened_at=in_range,
        closed_at=datetime.now(timezone.utc) - timedelta(days=1),
        total_sales=70.0,
        total_items=3,
    )
    # session excluded by date
    s_old = CashSession(
        operator_id=operator.id,
        site_id=site_id,
        register_id=uuid.uuid4(),
        initial_amount=5.0,
        current_amount=5.0,
        status=CashSessionStatus.CLOSED,
        opened_at=out_range,
        closed_at=out_range + timedelta(hours=2),
        total_sales=10.0,
        total_items=1,
    )
    db_session.add_all([s_match, s_old])
    db_session.commit()

    # Act: list with combined filters + search by partial username
    params = {
        "date_from": (in_range - timedelta(days=1)).isoformat(),
        "date_to": datetime.now(timezone.utc).isoformat(),
        "operator_id": str(operator.id),
        "site_id": str(site_id),
        "status": "closed",
        "search": "combo",
    }
    r_list = admin_client.get("/v1/cash-sessions/", params=params)
    assert r_list.status_code == 200
    body = r_list.json()
    data = body.get("data", [])
    ids = {row["id"] for row in data}
    assert str(s_match.id) in ids
    assert str(s_old.id) not in ids

    # Act: KPIs scoped to site and date range
    r_kpi = admin_client.get("/v1/cash-sessions/stats/summary", params={
        "date_from": params["date_from"],
        "date_to": params["date_to"],
        "site_id": params["site_id"],
    })
    assert r_kpi.status_code == 200
    kpi = r_kpi.json()
    # Only the matching session should contribute
    assert kpi["total_sessions"] >= 1
    assert kpi["total_sales"] >= 70.0

