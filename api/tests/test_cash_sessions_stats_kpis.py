import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem


@pytest.mark.parametrize("with_site", [False, True])
def test_cash_sessions_kpis_summary(admin_client, db_session: Session, with_site: bool):
    # Arrange: create an admin operator and two sessions with sales and items
    site_id = uuid.uuid4() if with_site else None

    operator = User(
        id=uuid.uuid4(),
        username="operator@test.com",
        hashed_password="x",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        site_id=site_id,
    )
    db_session.add(operator)
    db_session.commit()

    s1 = CashSession(
        id=uuid.uuid4(),
        operator_id=operator.id,
        site_id=site_id or uuid.uuid4(),
        register_id=uuid.uuid4(),
        initial_amount=50.0,
        current_amount=50.0,
        status=CashSessionStatus.OPEN,
        opened_at=datetime.now(timezone.utc) - timedelta(hours=4),
    )
    s2 = CashSession(
        id=uuid.uuid4(),
        operator_id=operator.id,
        site_id=site_id or uuid.uuid4(),
        register_id=uuid.uuid4(),
        initial_amount=20.0,
        current_amount=20.0,
        status=CashSessionStatus.CLOSED,
        opened_at=datetime.now(timezone.utc) - timedelta(hours=6),
        closed_at=datetime.now(timezone.utc) - timedelta(hours=1),
        total_sales=70.0,
        total_items=3,
    )
    db_session.add_all([s1, s2])
    db_session.commit()

    sale1 = Sale(
        id=uuid.uuid4(),
        cash_session_id=s2.id,
        operator_id=operator.id,
        total_amount=40.0,
        donation=5.0,
    )
    sale2 = Sale(
        id=uuid.uuid4(),
        cash_session_id=s2.id,
        operator_id=operator.id,
        total_amount=30.0,
        donation=0.0,
    )
    db_session.add_all([sale1, sale2])
    db_session.commit()

    item1 = SaleItem(id=uuid.uuid4(), sale_id=sale1.id, category="EEE-1", quantity=1, weight=2.5, unit_price=40.0, total_price=40.0)
    item2 = SaleItem(id=uuid.uuid4(), sale_id=sale2.id, category="EEE-2", quantity=1, weight=0.5, unit_price=30.0, total_price=30.0)
    db_session.add_all([item1, item2])
    db_session.commit()

    params = {}
    if with_site and site_id:
        params["site_id"] = str(site_id)

    # Act
    response = admin_client.get("/v1/cash-sessions/stats/summary", params=params)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["total_sessions"] >= 2
    assert data["number_of_sales"] >= 2
    assert data["total_donations"] >= 5.0
    assert data["total_weight_sold"] >= 3.0
    assert "total_sales" in data
    assert "average_session_duration" in data


