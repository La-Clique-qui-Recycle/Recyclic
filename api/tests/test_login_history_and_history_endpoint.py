"""
Tests d'intégration pour la story 5.4.2:
- Vérifier l'enregistrement dans login_history lors des tentatives de connexion
- Vérifier la présence des événements LOGIN dans l'endpoint /admin/users/{user_id}/history
"""

import uuid
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.security import hash_password


@pytest.fixture
def admin_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        telegram_id=111222333,
        username="admin_login_hist",
        first_name="Admin",
        last_name="LH",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
        hashed_password=hash_password("AdminPass!234")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id)})


@pytest.fixture
def active_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        telegram_id=999888777,
        username="active_login_hist",
        first_name="Active",
        last_name="User",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True,
        hashed_password=hash_password("StrongP@ssw0rd!")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_history_persists_success_and_failure(
    client: TestClient,
    db_session: Session,
    active_user: User,
    admin_token: str,
):
    # Définir un mot de passe pour l'utilisateur
    from recyclic_api.core.security import hash_password

    active_user.hashed_password = hash_password("StrongP@ssw0rd!")
    db_session.commit()

    # 1) Échec de login (mauvais mot de passe)
    resp_fail = client.post(
        "/api/v1/auth/login",
        json={"username": active_user.username, "password": "wrong"},
    )
    assert resp_fail.status_code == 401

    # 2) Succès de login
    resp_ok = client.post(
        "/api/v1/auth/login",
        json={"username": active_user.username, "password": "StrongP@ssw0rd!"},
    )
    assert resp_ok.status_code == 200

    # Vérifier login_history en base
    entries = (
        db_session.query(LoginHistory)
        .filter(LoginHistory.username == active_user.username)
        .order_by(LoginHistory.created_at.asc())
        .all()
    )
    assert len(entries) >= 2
    # Dernières deux: échec puis succès
    assert entries[-2].success is False
    assert entries[-1].success is True

    # Vérifier l'endpoint /history contient des événements LOGIN
    user_id = str(active_user.id)
    resp_hist = client.get(
        f"/api/v1/admin/users/{user_id}/history",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp_hist.status_code == 200
    data = resp_hist.json()
    login_events = [e for e in data["events"] if e["event_type"] == "LOGIN"]
    assert len(login_events) >= 1


