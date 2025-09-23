"""
Tests pour l'endpoint de mise à jour du statut utilisateur.
Adresse QA API-001: Définir schéma, validations, audit log et permissions.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.core.security import hash_password, create_access_token


class TestAdminUserStatusEndpoint:
    """Tests pour l'endpoint PUT /admin/users/{user_id}/status"""

    def test_update_user_status_success(self, client: TestClient, db_session: Session):
        """Test de mise à jour réussie du statut utilisateur"""
        # Créer un admin
        admin_user = User(
            username="admin",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)

        # Créer un utilisateur à modifier
        target_user = User(
            username="target_user",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(admin_user)
        db_session.refresh(target_user)

        # Créer un token admin
        access_token = create_access_token(data={"sub": str(admin_user.id)})

        # Désactiver l'utilisateur
        response = client.put(
            f"/api/v1/admin/users/{target_user.id}/status",
            json={
                "is_active": False,
                "reason": "Désactivé pour test"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Utilisateur" in data["message"]
        assert "désactivé avec succès" in data["message"]
        assert data["data"]["is_active"] is False
        assert data["data"]["previous_status"] is True
        assert data["data"]["reason"] == "Désactivé pour test"

        # Vérifier que l'utilisateur est bien désactivé dans la DB
        db_session.refresh(target_user)
        assert target_user.is_active is False

        # Vérifier l'historique
        history = db_session.query(UserStatusHistory).filter(
            UserStatusHistory.user_id == target_user.id
        ).first()
        assert history is not None
        assert history.old_status is True
        assert history.new_status is False
        assert history.reason == "Désactivé pour test"
        assert history.changed_by_admin_id == admin_user.id

    def test_update_user_status_validation_error(self, client: TestClient, db_session: Session):
        """Test de validation des données d'entrée"""
        # Créer un admin
        admin_user = User(
            username="admin",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        # Créer un token admin
        access_token = create_access_token(data={"sub": str(admin_user.id)})

        # Envoyer des données invalides
        response = client.put(
            f"/api/v1/admin/users/{admin_user.id}/status",
            json={
                "is_active": "not_a_boolean",  # Type incorrect
                "reason": "Test"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 422  # Unprocessable Entity
        data = response.json()
        assert "detail" in data

    def test_update_user_status_not_found(self, client: TestClient, db_session: Session):
        """Test avec un ID utilisateur inexistant"""
        # Créer un admin
        admin_user = User(
            username="admin",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        # Créer un token admin
        access_token = create_access_token(data={"sub": str(admin_user.id)})

        # Utiliser un ID inexistant
        fake_user_id = str(uuid.uuid4())
        response = client.put(
            f"/api/v1/admin/users/{fake_user_id}/status",
            json={
                "is_active": False,
                "reason": "Test"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 404
        data = response.json()
        assert "Utilisateur non trouvé" in data["detail"]

    def test_update_user_status_unauthorized(self, client: TestClient, db_session: Session):
        """Test d'accès non autorisé (utilisateur non-admin)"""
        # Créer un utilisateur normal
        normal_user = User(
            username="normal_user",
            hashed_password=hash_password("password"),
            role=UserRole.USER,  # Pas admin
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(normal_user)
        db_session.commit()
        db_session.refresh(normal_user)

        # Créer un token utilisateur normal
        access_token = create_access_token(data={"sub": str(normal_user.id)})

        response = client.put(
            f"/api/v1/admin/users/{normal_user.id}/status",
            json={
                "is_active": False,
                "reason": "Test"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403  # Forbidden

    def test_admin_cannot_deactivate_self(self, client: TestClient, db_session: Session):
        """Test qu'un admin ne peut pas se désactiver lui-même"""
        # Créer un admin
        admin_user = User(
            username="admin",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        # Créer un token admin
        access_token = create_access_token(data={"sub": str(admin_user.id)})

        # Essayer de se désactiver
        response = client.put(
            f"/api/v1/admin/users/{admin_user.id}/status",
            json={
                "is_active": False,
                "reason": "Auto-désactivation"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403
        data = response.json()
        assert "ne peut pas se désactiver lui-même" in data["detail"]

        # Vérifier que l'admin est toujours actif
        db_session.refresh(admin_user)
        assert admin_user.is_active is True

    def test_reactivate_user_success(self, client: TestClient, db_session: Session):
        """Test de réactivation d'un utilisateur inactif"""
        # Créer un admin
        admin_user = User(
            username="admin",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)

        # Créer un utilisateur inactif
        inactive_user = User(
            username="inactive_user",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False  # Déjà inactif
        )
        db_session.add(inactive_user)
        db_session.commit()
        db_session.refresh(admin_user)
        db_session.refresh(inactive_user)

        # Créer un token admin
        access_token = create_access_token(data={"sub": str(admin_user.id)})

        # Réactiver l'utilisateur
        response = client.put(
            f"/api/v1/admin/users/{inactive_user.id}/status",
            json={
                "is_active": True,
                "reason": "Réactivé après résolution du problème"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "activé avec succès" in data["message"]
        assert data["data"]["is_active"] is True

        # Vérifier que l'utilisateur est bien réactivé dans la DB
        db_session.refresh(inactive_user)
        assert inactive_user.is_active is True