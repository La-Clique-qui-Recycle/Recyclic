"""
Tests for PIN management functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, verify_password
from uuid import uuid4


class TestPinManagement:
    """Test PIN management endpoints"""

    def test_set_pin_new_user(self, client: TestClient, db_session: Session):
        """Test setting PIN for a user without existing PIN"""
        # Create a user without PIN
        user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Set PIN
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 200
        assert pin_response.json()["message"] == "PIN successfully set"

        # Verify PIN was hashed and stored
        db_session.refresh(user)
        assert user.hashed_pin is not None
        assert verify_password("1234", user.hashed_pin)

    def test_set_pin_existing_user_without_password(self, client: TestClient, db_session: Session):
        """Test setting PIN for user with existing PIN without password (should fail)"""
        # Create a user with existing PIN
        user = User(
            id=uuid4(),
            username="testuser2@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("5678"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser2@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to set PIN without current password (should fail)
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "9999"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 400
        assert "Current password is required" in pin_response.json()["detail"]

    def test_set_pin_existing_user_with_wrong_password(self, client: TestClient, db_session: Session):
        """Test setting PIN for user with existing PIN with wrong password (should fail)"""
        # Create a user with existing PIN
        user = User(
            id=uuid4(),
            username="testuser3@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("5678"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser3@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to set PIN with wrong current password (should fail)
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "9999", "current_password": "WrongPassword!"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 400
        assert "Current password is incorrect" in pin_response.json()["detail"]

    def test_set_pin_existing_user_with_correct_password(self, client: TestClient, db_session: Session):
        """Test setting PIN for user with existing PIN with correct password (should succeed)"""
        # Create a user with existing PIN
        user = User(
            id=uuid4(),
            username="testuser4@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("5678"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser4@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Set PIN with correct current password (should succeed)
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "9999", "current_password": "Test1234!"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 200
        assert pin_response.json()["message"] == "PIN successfully set"

        # Verify PIN was updated
        db_session.refresh(user)
        assert verify_password("9999", user.hashed_pin)
        assert not verify_password("5678", user.hashed_pin)

    def test_set_pin_invalid_format(self, client: TestClient, db_session: Session):
        """Test setting PIN with invalid format (should fail)"""
        # Create a user without PIN
        user = User(
            id=uuid4(),
            username="testuser5@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser5@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to set invalid PIN formats
        invalid_pins = ["123", "12345", "abcd", "12ab", ""]
        for invalid_pin in invalid_pins:
            pin_response = client.put(
                "/users/me/pin",
                json={"pin": invalid_pin},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert pin_response.status_code == 422  # Validation error

    def test_set_pin_unauthorized(self, client: TestClient):
        """Test setting PIN without authentication (should fail)"""
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "1234"}
        )
        assert pin_response.status_code == 401


class TestAdminPinReset:
    """Test admin PIN reset functionality"""

    def test_reset_pin_admin_success(self, admin_client: TestClient, db_session: Session):
        """Test admin resetting user PIN successfully"""
        # Create a user with PIN
        user = User(
            id=uuid4(),
            username="testuser6@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        user_id = str(user.id)

        # Admin resets PIN
        reset_response = admin_client.post(f"/admin/users/{user_id}/reset-pin")
        assert reset_response.status_code == 200
        response_data = reset_response.json()
        assert "PIN réinitialisé avec succès" in response_data["message"]
        assert response_data["user_id"] == user_id

        # Verify PIN was cleared
        db_session.refresh(user)
        assert user.hashed_pin is None

    def test_reset_pin_user_not_found(self, admin_client: TestClient):
        """Test admin resetting PIN for non-existent user (should fail)"""
        fake_user_id = str(uuid4())
        reset_response = admin_client.post(f"/admin/users/{fake_user_id}/reset-pin")
        assert reset_response.status_code == 404
        assert "Utilisateur non trouvé" in reset_response.json()["detail"]

    def test_reset_pin_invalid_user_id(self, admin_client: TestClient):
        """Test admin resetting PIN with invalid user ID (should fail)"""
        reset_response = admin_client.post("/admin/users/invalid-id/reset-pin")
        assert reset_response.status_code == 404

    def test_reset_pin_unauthorized(self, client: TestClient, db_session: Session):
        """Test resetting PIN without admin privileges (should fail)"""
        # Create a regular user
        user = User(
            id=uuid4(),
            username="testuser7@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login as regular user
        login_response = client.post("/auth/login", json={
            "username": "testuser7@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to reset PIN (should fail)
        reset_response = client.post(
            f"/admin/users/{user.id}/reset-pin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert reset_response.status_code == 403

    def test_reset_pin_rate_limiting(self, admin_client: TestClient, db_session: Session):
        """Test that PIN reset is rate limited"""
        # Create a user
        user = User(
            id=uuid4(),
            username="testuser8@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        user_id = str(user.id)

        # Make multiple requests quickly (should hit rate limit)
        for i in range(12):  # More than the 10/minute limit
            reset_response = admin_client.post(f"/admin/users/{user_id}/reset-pin")
            if i < 10:
                assert reset_response.status_code == 200
            else:
                # Should hit rate limit
                assert reset_response.status_code == 429


class TestPinSecurity:
    """Test PIN security features"""

    def test_pin_is_hashed(self, client: TestClient, db_session: Session):
        """Test that PIN is properly hashed before storage"""
        # Create a user
        user = User(
            id=uuid4(),
            username="testuser9@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser9@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Set PIN
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 200

        # Verify PIN is hashed (not stored in plain text)
        db_session.refresh(user)
        assert user.hashed_pin != "1234"  # Should be hashed
        assert verify_password("1234", user.hashed_pin)  # But should verify correctly

    def test_pin_validation_strict(self, client: TestClient, db_session: Session):
        """Test that PIN validation is strict (exactly 4 digits)"""
        # Create a user
        user = User(
            id=uuid4(),
            username="testuser10@example.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Login to get token
        login_response = client.post("/auth/login", json={
            "username": "testuser10@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Test various invalid PIN formats
        invalid_cases = [
            "123",      # Too short
            "12345",    # Too long
            "abcd",     # Letters
            "12ab",     # Mixed
            "12 34",    # Spaces
            "12-34",    # Hyphens
            "12.34",    # Dots
        ]

        for invalid_pin in invalid_cases:
            pin_response = client.put(
                "/users/me/pin",
                json={"pin": invalid_pin},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert pin_response.status_code == 422, f"PIN '{invalid_pin}' should be invalid"

    def test_pin_works_after_reset(self, admin_client: TestClient, client: TestClient, db_session: Session):
        """Test that user can set new PIN after admin reset"""
        # Create a user with PIN
        user = User(
            id=uuid4(),
            username="testuser11@example.com",
            hashed_password=hash_password("Test1234!"),
            hashed_pin=hash_password("1234"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        user_id = str(user.id)

        # Admin resets PIN
        reset_response = admin_client.post(f"/admin/users/{user_id}/reset-pin")
        assert reset_response.status_code == 200

        # User can now set new PIN without current password
        login_response = client.post("/auth/login", json={
            "username": "testuser11@example.com",
            "password": "Test1234!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Set new PIN (should work without current password)
        pin_response = client.put(
            "/users/me/pin",
            json={"pin": "5678"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 200

        # Verify new PIN is set
        db_session.refresh(user)
        assert verify_password("5678", user.hashed_pin)
