import json
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.security import HTTPAuthorizationCredentials

from recyclic_api.core.auth import CachedUser, get_current_user
from recyclic_api.core.security import create_access_token
from recyclic_api.models.user import User, UserRole, UserStatus


class DummyRedis:
    """Minimal Redis-like interface for unit tests."""

    def __init__(self):
        self.storage = {}

    def get(self, key):
        return self.storage.get(key)

    def set(self, key, value, ex=None):
        self.storage[key] = value
        return True


class NoDBSession:
    """Session stub that should never be used in cache-only scenarios."""

    def execute(self, *args, **kwargs):
        raise AssertionError("Database should not be queried when cache is used.")


class DummyRequest:
    def __init__(self, method: str):
        self.method = method


class ResultWrapper:
    def __init__(self, obj):
        self._obj = obj

    def scalar_one_or_none(self):
        return self._obj


class DummyDBSession:
    def __init__(self, user: User):
        self.user = user
        self.called = False

    def execute(self, stmt):
        self.called = True
        return ResultWrapper(self.user)


def _build_cached_payload(user_id: uuid.UUID) -> str:
    payload = {
        "id": str(user_id),
        "username": "cached-user",
        "email": "cached@example.com",
        "first_name": "Cache",
        "last_name": "User",
        "role": UserRole.USER.value,
        "status": UserStatus.APPROVED.value,
        "is_active": True,
        "telegram_id": None,
        "site_id": None,
        "phone_number": None,
        "address": None,
        "notes": None,
        "skills": None,
        "availability": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    return json.dumps(payload)


@pytest.mark.asyncio
async def test_get_current_user_returns_cached_user_for_safe_methods():
    user_id = uuid.uuid4()
    token = create_access_token(data={"sub": str(user_id)})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    redis_client = DummyRedis()
    redis_client.set(f"user_cache:{user_id}", _build_cached_payload(user_id))

    cached = await get_current_user(
        credentials=credentials,
        db=NoDBSession(),
        redis_client=redis_client,
        request=DummyRequest(method="GET"),
    )

    assert isinstance(cached, CachedUser)
    assert cached.username == "cached-user"
    assert str(cached.id) == str(user_id)


@pytest.mark.asyncio
async def test_get_current_user_fetches_db_for_unsafe_methods():
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        username="unsafe-user",
        email="unsafe@example.com",
        hashed_password="hashed",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True,
    )
    token = create_access_token(data={"sub": str(user_id)})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    redis_client = DummyRedis()
    redis_client.set(f"user_cache:{user_id}", _build_cached_payload(user_id))

    db_session = DummyDBSession(user=user)
    user_from_db = await get_current_user(
        credentials=credentials,
        db=db_session,
        redis_client=redis_client,
        request=DummyRequest(method="POST"),
    )

    assert isinstance(user_from_db, User)
    assert user_from_db is user
    assert db_session.called is True
    assert f"user_cache:{user_id}" in redis_client.storage
