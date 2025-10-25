
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import MagicMock

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password
from recyclic_api.core.database import get_db

class TestAuthPerformance:
    """Tests for authentication performance optimizations."""

    def test_jwt_validation_does_not_hit_db(self, client: TestClient, db_session: Session):
        """
        Tests that validating a JWT for an authenticated endpoint does not require a database call.
        This test will fail before the Redis cache is implemented.
        """
        # Arrange: Create a user and log them in to get a token
        test_user = User(
            username="perf_test_user",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(test_user)
        db_session.commit()

        login_response = client.post(
            "/v1/auth/login",
            json={"username": "perf_test_user", "password": "password"}
        )
        token = login_response.json()["access_token"]

        # Arrange: Mock the database session to track queries
        db_session.execute = MagicMock(wraps=db_session.execute)

        # Act: Make the first request to populate the cache
        headers = {"Authorization": f"Bearer {token}"}
        client.get("/v1/users/me", headers=headers)

        # Reset the mock to test the second call
        db_session.execute.reset_mock()

        # Act: Make the second request, which should be a cache hit
        client.get("/v1/users/me", headers=headers)

        # Assert: Check that the database was not queried on the second request
        assert db_session.execute.call_count == 0, "A database query was made on the second request, cache failed."

        # Cleanup
        app.dependency_overrides.clear()
