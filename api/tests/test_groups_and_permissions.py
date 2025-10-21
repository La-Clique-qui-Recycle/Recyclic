"""Tests for groups and permissions endpoints."""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.permission import Permission, Group
from recyclic_api.core.security import hash_password, create_access_token


@pytest.fixture
def admin_user(db_session: Session) -> User:
    """Create an admin user for testing."""
    user = User(
        id=uuid4(),
        username="admin@test.com",
        hashed_password=hash_password("TestPassword123!"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session: Session) -> User:
    """Create a regular user for testing."""
    user = User(
        id=uuid4(),
        username="user@test.com",
        hashed_password=hash_password("TestPassword123!"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Create an access token for admin user."""
    return create_access_token(data={"sub": str(admin_user.id)})


@pytest.fixture
def user_token(regular_user: User) -> str:
    """Create an access token for regular user."""
    return create_access_token(data={"sub": str(regular_user.id)})


@pytest.fixture
def sample_permission(db_session: Session) -> Permission:
    """Create a sample permission."""
    perm = Permission(
        id=uuid4(),
        name="test.permission",
        description="A test permission"
    )
    db_session.add(perm)
    db_session.commit()
    db_session.refresh(perm)
    return perm


@pytest.fixture
def sample_group(db_session: Session) -> Group:
    """Create a sample group."""
    group = Group(
        id=uuid4(),
        name="Test Group",
        description="A test group"
    )
    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)
    return group


# ============================================================================
# Permission Endpoints Tests
# ============================================================================

class TestPermissionEndpoints:
    """Test permission CRUD endpoints."""

    def test_list_permissions_requires_auth(self, client: TestClient):
        """Test that listing permissions requires authentication."""
        response = client.get("/api/v1/admin/permissions/")
        assert response.status_code == 401

    def test_list_permissions_requires_admin(self, client: TestClient, user_token: str):
        """Test that listing permissions requires admin role."""
        response = client.get(
            "/api/v1/admin/permissions/",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403

    def test_list_permissions_success(self, client: TestClient, admin_token: str, db_session: Session):
        """Test successful listing of permissions."""
        response = client.get(
            "/api/v1/admin/permissions/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the seeded permissions
        assert len(data) >= 6

    def test_create_permission_success(self, client: TestClient, admin_token: str):
        """Test successful permission creation."""
        permission_data = {
            "name": "new.permission",
            "description": "A new permission"
        }
        response = client.post(
            "/api/v1/admin/permissions/",
            json=permission_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == permission_data["name"]
        assert data["description"] == permission_data["description"]
        assert "id" in data

    def test_create_permission_duplicate_fails(
        self, client: TestClient, admin_token: str, sample_permission: Permission
    ):
        """Test that creating a duplicate permission fails."""
        permission_data = {
            "name": sample_permission.name,
            "description": "Duplicate"
        }
        response = client.post(
            "/api/v1/admin/permissions/",
            json=permission_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 409

    def test_get_permission_success(
        self, client: TestClient, admin_token: str, sample_permission: Permission
    ):
        """Test successful retrieval of a permission."""
        response = client.get(
            f"/api/v1/admin/permissions/{sample_permission.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_permission.name

    def test_update_permission_success(
        self, client: TestClient, admin_token: str, sample_permission: Permission
    ):
        """Test successful permission update."""
        update_data = {
            "description": "Updated description"
        }
        response = client.put(
            f"/api/v1/admin/permissions/{sample_permission.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == update_data["description"]

    def test_delete_permission_success(
        self, client: TestClient, admin_token: str, sample_permission: Permission
    ):
        """Test successful permission deletion."""
        response = client.delete(
            f"/api/v1/admin/permissions/{sample_permission.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 204


# ============================================================================
# Group Endpoints Tests
# ============================================================================

class TestGroupEndpoints:
    """Test group CRUD endpoints."""

    def test_list_groups_requires_auth(self, client: TestClient):
        """Test that listing groups requires authentication."""
        response = client.get("/api/v1/admin/groups/")
        assert response.status_code == 401

    def test_list_groups_requires_admin(self, client: TestClient, user_token: str):
        """Test that listing groups requires admin role."""
        response = client.get(
            "/api/v1/admin/groups/",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403

    def test_list_groups_success(self, client: TestClient, admin_token: str):
        """Test successful listing of groups."""
        response = client.get(
            "/api/v1/admin/groups/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_group_success(self, client: TestClient, admin_token: str):
        """Test successful group creation."""
        group_data = {
            "name": "New Group",
            "description": "A new group"
        }
        response = client.post(
            "/api/v1/admin/groups/",
            json=group_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == group_data["name"]
        assert data["description"] == group_data["description"]
        assert "id" in data

    def test_create_group_duplicate_fails(
        self, client: TestClient, admin_token: str, sample_group: Group
    ):
        """Test that creating a duplicate group fails."""
        group_data = {
            "name": sample_group.name,
            "description": "Duplicate"
        }
        response = client.post(
            "/api/v1/admin/groups/",
            json=group_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 409

    def test_get_group_success(
        self, client: TestClient, admin_token: str, sample_group: Group
    ):
        """Test successful retrieval of a group."""
        response = client.get(
            f"/api/v1/admin/groups/{sample_group.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_group.name

    def test_update_group_success(
        self, client: TestClient, admin_token: str, sample_group: Group
    ):
        """Test successful group update."""
        update_data = {
            "description": "Updated description"
        }
        response = client.put(
            f"/api/v1/admin/groups/{sample_group.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == update_data["description"]

    def test_delete_group_success(
        self, client: TestClient, admin_token: str, sample_group: Group
    ):
        """Test successful group deletion."""
        response = client.delete(
            f"/api/v1/admin/groups/{sample_group.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 204

    def test_assign_permissions_to_group(
        self,
        client: TestClient,
        admin_token: str,
        sample_group: Group,
        sample_permission: Permission
    ):
        """Test assigning permissions to a group."""
        assign_data = {
            "permission_ids": [str(sample_permission.id)]
        }
        response = client.post(
            f"/api/v1/admin/groups/{sample_group.id}/permissions",
            json=assign_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["permissions"]) == 1
        assert data["permissions"][0]["name"] == sample_permission.name

    def test_remove_permission_from_group(
        self,
        client: TestClient,
        admin_token: str,
        sample_group: Group,
        sample_permission: Permission,
        db_session: Session
    ):
        """Test removing a permission from a group."""
        # First assign the permission
        sample_group.permissions.append(sample_permission)
        db_session.commit()

        # Then remove it
        response = client.delete(
            f"/api/v1/admin/groups/{sample_group.id}/permissions/{sample_permission.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["permissions"]) == 0

    def test_assign_users_to_group(
        self,
        client: TestClient,
        admin_token: str,
        sample_group: Group,
        regular_user: User
    ):
        """Test assigning users to a group."""
        assign_data = {
            "user_ids": [str(regular_user.id)]
        }
        response = client.post(
            f"/api/v1/admin/groups/{sample_group.id}/users",
            json=assign_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["users"][0]["username"] == regular_user.username

    def test_remove_user_from_group(
        self,
        client: TestClient,
        admin_token: str,
        sample_group: Group,
        regular_user: User,
        db_session: Session
    ):
        """Test removing a user from a group."""
        # First assign the user
        sample_group.users.append(regular_user)
        db_session.commit()

        # Then remove them
        response = client.delete(
            f"/api/v1/admin/groups/{sample_group.id}/users/{regular_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 0


# ============================================================================
# Permission Check Tests
# ============================================================================

class TestPermissionChecks:
    """Test permission checking functionality."""

    def test_user_has_permission_through_group(
        self,
        db_session: Session,
        regular_user: User,
        sample_group: Group,
        sample_permission: Permission
    ):
        """Test that a user has a permission through their group."""
        from recyclic_api.core.auth import user_has_permission

        # Assign permission to group
        sample_group.permissions.append(sample_permission)
        # Assign user to group
        sample_group.users.append(regular_user)
        db_session.commit()

        # Check permission
        assert user_has_permission(regular_user, sample_permission.name, db_session) is True

    def test_user_without_permission(
        self,
        db_session: Session,
        regular_user: User,
        sample_permission: Permission
    ):
        """Test that a user without a permission is correctly identified."""
        from recyclic_api.core.auth import user_has_permission

        assert user_has_permission(regular_user, sample_permission.name, db_session) is False

    def test_super_admin_has_all_permissions(
        self,
        db_session: Session,
        sample_permission: Permission
    ):
        """Test that super-admin has all permissions."""
        from recyclic_api.core.auth import user_has_permission

        super_admin = User(
            id=uuid4(),
            username="superadmin@test.com",
            hashed_password=hash_password("TestPassword123!"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()

        assert user_has_permission(super_admin, sample_permission.name, db_session) is True
        assert user_has_permission(super_admin, "any.permission", db_session) is True

    def test_get_user_permissions(
        self,
        db_session: Session,
        regular_user: User,
        sample_group: Group,
        sample_permission: Permission
    ):
        """Test getting all permissions for a user."""
        from recyclic_api.core.auth import get_user_permissions

        # Create another permission
        perm2 = Permission(id=uuid4(), name="another.permission")
        db_session.add(perm2)

        # Assign permissions to group
        sample_group.permissions.extend([sample_permission, perm2])
        # Assign user to group
        sample_group.users.append(regular_user)
        db_session.commit()

        permissions = get_user_permissions(regular_user, db_session)
        assert len(permissions) == 2
        assert sample_permission.name in permissions
        assert perm2.name in permissions
