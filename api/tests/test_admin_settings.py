from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.core.security import hash_password, create_access_token
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.models.admin_setting import AdminSetting


@pytest.fixture
def admin_user(db_session: Session) -> User:
    site = Site(
        id=uuid4(),
        name='Admin HQ',
        address='1 rue de la Paix',
        city='Paris',
        postal_code='75000',
        country='France',
        is_active=True,
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)

    user = User(
        username='admin_dashboard',
        email='admin@example.com',
        hashed_password=hash_password('StrongPass!23'),
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_get_default_alert_thresholds(client: TestClient, db_session: Session, admin_user: User):
    response = client.get(
        '/api/v1/admin/settings/alert-thresholds',
        headers=_auth_headers(admin_user),
    )
    payload = response.json()
    assert response.status_code == 200
    assert payload['thresholds']['cashDiscrepancy'] == 10
    assert payload['thresholds']['lowInventory'] == 5


def test_update_alert_thresholds_persists_encrypted_value(client: TestClient, db_session: Session, admin_user: User):
    site_id = str(admin_user.site_id)
    body = {
        'thresholds': {
            'cash_discrepancy': 25.5,
            'low_inventory': 3,
        },
        'site_id': site_id,
    }

    update_response = client.put(
        '/api/v1/admin/settings/alert-thresholds',
        json=body,
        headers=_auth_headers(admin_user),
    )
    assert update_response.status_code == 200
    data = update_response.json()['thresholds']
    assert data['cashDiscrepancy'] == pytest.approx(25.5)
    assert data['lowInventory'] == 3

    record = db_session.query(AdminSetting).filter(AdminSetting.site_id == admin_user.site_id).first()
    assert record is not None
    assert record.value_encrypted != '25.5'
    assert '25.5' not in record.value_encrypted

    get_response = client.get(
        f'/api/v1/admin/settings/alert-thresholds?site_id={site_id}',
        headers=_auth_headers(admin_user),
    )
    assert get_response.status_code == 200
    fetched = get_response.json()['thresholds']
    assert fetched['cashDiscrepancy'] == pytest.approx(25.5)
    assert fetched['lowInventory'] == 3
