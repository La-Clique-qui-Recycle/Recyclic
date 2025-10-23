"""
Tests pour l'endpoint des permissions utilisateur
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.permission import Permission, Group
from recyclic_api.core.security import hash_password


class TestUserPermissions:
    """Tests pour l'endpoint /v1/users/me/permissions"""

    def test_get_my_permissions_super_admin(self, client: TestClient, db_session: Session):
        """Test que les super-admins ont toutes les permissions."""
        # Créer un super-admin
        user = User(
            id="test-super-admin",
            username="superadmin@test.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Créer quelques permissions
        perm1 = Permission(name="caisse.access", description="Accès à la caisse")
        perm2 = Permission(name="reception.access", description="Accès à la réception")
        db_session.add_all([perm1, perm2])
        db_session.commit()

        # Login
        response = client.post("/v1/auth/login", json={
            "username": "superadmin@test.com",
            "password": "Test1234!"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Tester l'endpoint des permissions
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/v1/users/me/permissions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        # Les super-admins devraient avoir toutes les permissions
        assert len(data["permissions"]) >= 2
        assert "caisse.access" in data["permissions"]
        assert "reception.access" in data["permissions"]

    def test_get_my_permissions_regular_user(self, client: TestClient, db_session: Session):
        """Test qu'un utilisateur normal n'a pas de permissions par défaut."""
        # Créer un utilisateur normal
        user = User(
            id="test-user",
            username="user@test.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Login
        response = client.post("/v1/auth/login", json={
            "username": "user@test.com",
            "password": "Test1234!"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Tester l'endpoint des permissions
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/v1/users/me/permissions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        # Un utilisateur normal sans groupes devrait avoir une liste vide
        assert data["permissions"] == []

    def test_get_my_permissions_user_with_groups(self, client: TestClient, db_session: Session):
        """Test qu'un utilisateur avec des groupes a les permissions de ses groupes."""
        # Créer des permissions
        perm1 = Permission(name="caisse.access", description="Accès à la caisse")
        perm2 = Permission(name="reception.access", description="Accès à la réception")
        db_session.add_all([perm1, perm2])
        db_session.commit()

        # Créer un groupe avec des permissions
        group = Group(name="Caisse Operators", description="Opérateurs de caisse")
        group.permissions = [perm1]
        db_session.add(group)
        db_session.commit()

        # Créer un utilisateur et l'ajouter au groupe
        user = User(
            id="test-user",
            username="user@test.com",
            hashed_password=hash_password("Test1234!"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        user.groups = [group]
        db_session.add(user)
        db_session.commit()

        # Login
        response = client.post("/v1/auth/login", json={
            "username": "user@test.com",
            "password": "Test1234!"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Tester l'endpoint des permissions
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/v1/users/me/permissions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        # L'utilisateur devrait avoir la permission de son groupe
        assert "caisse.access" in data["permissions"]
        assert "reception.access" not in data["permissions"]

    def test_get_my_permissions_unauthorized(self, client: TestClient):
        """Test que l'endpoint nécessite une authentification."""
        response = client.get("/v1/users/me/permissions")
        assert response.status_code == 401