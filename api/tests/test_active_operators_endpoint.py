import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.auth import create_access_token


def _auth_headers(user: User):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_active_operators_filters_roles_and_is_active(client: TestClient, db_session: Session):
    # Arrange
    requester = User(
        id=uuid.uuid4(), username="req", hashed_password="x",
        role=UserRole.ADMIN, status=UserStatus.APPROVED, is_active=True,
    )
    u1 = User(id=uuid.uuid4(), username="op1", hashed_password="x", role=UserRole.USER, status=UserStatus.APPROVED, is_active=True)
    u2 = User(id=uuid.uuid4(), username="op2", hashed_password="x", role=UserRole.ADMIN, status=UserStatus.APPROVED, is_active=True)
    u3 = User(id=uuid.uuid4(), username="op3", hashed_password="x", role=UserRole.SUPER_ADMIN, status=UserStatus.APPROVED, is_active=True)
    u4 = User(id=uuid.uuid4(), username="inactive", hashed_password="x", role=UserRole.USER, status=UserStatus.APPROVED, is_active=False)
    db_session.add_all([requester, u1, u2, u3, u4])
    db_session.commit()

    # Act
    resp = client.get("/api/v1/users/active-operators", headers=_auth_headers(requester))

    # Assert
    assert resp.status_code == 200
    items = resp.json()
    usernames = {it.get("username") for it in items}
    # Must include user, admin, super-admin and exclude inactive
    assert {"op1", "op2", "op3"}.issubset(usernames)
    assert "inactive" not in usernames

