"""
Tests pour l'assignation de groupes aux utilisateurs.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.permission import Group
from recyclic_api.core.security import hash_password


class TestUserGroups:
    """Tests pour la gestion des groupes d'utilisateurs."""

    def test_update_user_groups_success(self, client: TestClient, db_session: Session, admin_user: User):
        """Test de mise à jour des groupes d'un utilisateur avec succès."""
        # Créer un utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        
        # Créer des groupes de test
        group1 = Group(
            id=uuid4(),
            name="Groupe Test 1",
            description="Premier groupe de test"
        )
        group2 = Group(
            id=uuid4(),
            name="Groupe Test 2", 
            description="Deuxième groupe de test"
        )
        db_session.add_all([group1, group2])
        db_session.commit()

        # Authentifier l'admin
        client.headers["Authorization"] = f"Bearer {admin_user.id}"

        # Mettre à jour les groupes de l'utilisateur
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": [str(group1.id), str(group2.id)]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["group_ids"]) == 2
        assert str(group1.id) in data["data"]["group_ids"]
        assert str(group2.id) in data["data"]["group_ids"]

    def test_update_user_groups_user_not_found(self, client: TestClient, admin_user: User):
        """Test de mise à jour des groupes avec un utilisateur inexistant."""
        # Authentifier l'admin
        client.headers["Authorization"] = f"Bearer {admin_user.id}"

        # Essayer de mettre à jour les groupes d'un utilisateur inexistant
        fake_user_id = str(uuid4())
        response = client.put(
            f"/api/v1/admin/users/{fake_user_id}/groups",
            json={
                "group_ids": ["group1", "group2"]
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "Utilisateur non trouvé" in data["detail"]

    def test_update_user_groups_invalid_group_id(self, client: TestClient, db_session: Session, admin_user: User):
        """Test de mise à jour avec un ID de groupe invalide."""
        # Créer un utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Authentifier l'admin
        client.headers["Authorization"] = f"Bearer {admin_user.id}"

        # Essayer de mettre à jour avec un ID de groupe invalide
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": ["invalid-group-id"]
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "ID de groupe invalide" in data["detail"]

    def test_update_user_groups_nonexistent_group(self, client: TestClient, db_session: Session, admin_user: User):
        """Test de mise à jour avec un groupe inexistant."""
        # Créer un utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Authentifier l'admin
        client.headers["Authorization"] = f"Bearer {admin_user.id}"

        # Essayer de mettre à jour avec un groupe inexistant
        fake_group_id = str(uuid4())
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": [fake_group_id]
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert f"Groupe non trouvé: {fake_group_id}" in data["detail"]

    def test_update_user_groups_empty_list(self, client: TestClient, db_session: Session, admin_user: User):
        """Test de mise à jour avec une liste vide de groupes."""
        # Créer un utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Authentifier l'admin
        client.headers["Authorization"] = f"Bearer {admin_user.id}"

        # Mettre à jour avec une liste vide (retirer tous les groupes)
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": []
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["group_ids"]) == 0

    def test_update_user_groups_unauthorized(self, client: TestClient, db_session: Session):
        """Test de mise à jour des groupes sans authentification."""
        # Créer un utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Essayer de mettre à jour sans authentification
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": ["group1"]
            }
        )

        assert response.status_code == 401

    def test_update_user_groups_non_admin(self, client: TestClient, db_session: Session):
        """Test de mise à jour des groupes par un utilisateur non-admin."""
        # Créer un utilisateur non-admin
        regular_user = User(
            id=uuid4(),
            username="regular@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(regular_user)
        
        # Créer un autre utilisateur de test
        test_user = User(
            id=uuid4(),
            username="testuser@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Authentifier l'utilisateur non-admin
        client.headers["Authorization"] = f"Bearer {regular_user.id}"

        # Essayer de mettre à jour les groupes
        response = client.put(
            f"/api/v1/admin/users/{test_user.id}/groups",
            json={
                "group_ids": ["group1"]
            }
        )

        assert response.status_code == 403
