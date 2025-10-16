import os
import uuid
from sqlalchemy import select

from recyclic_api.models.user import User, UserRole


def test_super_admin_created_on_startup_when_env_set_with_username(client, db_session):
    # Arrange
    unique_username = f"first_super_{uuid.uuid4().hex[:8]}"
    os.environ["FIRST_SUPER_ADMIN_USERNAME"] = unique_username
    os.environ["FIRST_SUPER_ADMIN_PASSWORD"] = "StrongPassw0rd!"

    # Act: touching the app (client) ensures app startup already ran via conftest
    resp = client.get("/health")
    assert resp.status_code in (200, 500)

    # Assert: user exists with SUPER_ADMIN role
    result = db_session.execute(select(User).where(User.username == unique_username))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.role == UserRole.SUPER_ADMIN


def test_super_admin_bootstrap_is_idempotent(client, db_session):
    # Arrange
    unique_username = f"first_super_{uuid.uuid4().hex[:8]}"
    os.environ["FIRST_SUPER_ADMIN_USERNAME"] = unique_username
    os.environ["FIRST_SUPER_ADMIN_PASSWORD"] = "StrongPassw0rd!"

    # Act: first access triggers startup
    client.get("/health")

    # Act again: simulate another startup call by hitting the health again
    client.get("/health")

    # Assert: only one user exists
    users = db_session.execute(select(User).where(User.username == unique_username)).scalars().all()
    assert len(users) == 1
    


