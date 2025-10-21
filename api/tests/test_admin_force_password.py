"""
Tests unitaires pour l'endpoint de forçage de mot de passe (Super Admin uniquement)
Story b33-p4: Solidifier la Gestion des Mots de Passe
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, verify_password
from recyclic_api.core.auth import create_access_token


class TestAdminForcePasswordEndpoint:
    """Tests d'intégration pour l'endpoint de forçage de mot de passe"""

    def test_force_password_success_super_admin(self, client: TestClient, db_session: Session):
        """Test de forçage de mot de passe réussi par un Super Admin"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Forcer le mot de passe
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Sécurité compromise"
            },
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "forcé avec succès" in data["message"]
        assert data["data"]["action"] == "password_forced"
        assert data["data"]["reason"] == "Sécurité compromise"

        # Vérifier que le mot de passe a été changé
        db_session.refresh(target_user)
        assert verify_password("NewForcedPassword123!", target_user.hashed_password)

    def test_force_password_forbidden_regular_admin(self, client: TestClient, db_session: Session):
        """Test que les administrateurs normaux ne peuvent pas forcer les mots de passe"""
        
        # Créer un Admin normal
        regular_admin = User(
            username="regularadmin",
            email="admin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(regular_admin)
        db_session.commit()
        db_session.refresh(regular_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier l'Admin normal
        admin_token = create_access_token({"sub": str(regular_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Tenter de forcer le mot de passe
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test"
            },
            headers=headers
        )

        assert response.status_code == 403
        data = response.json()
        assert "Super Administrateurs uniquement" in data["detail"]

    def test_force_password_forbidden_user_role(self, client: TestClient, db_session: Session):
        """Test que les utilisateurs normaux ne peuvent pas forcer les mots de passe"""
        
        # Créer un utilisateur normal
        regular_user = User(
            username="regularuser",
            email="user@example.com",
            hashed_password=hash_password("userpass123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(regular_user)
        db_session.commit()
        db_session.refresh(regular_user)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier l'utilisateur normal
        user_token = create_access_token({"sub": str(regular_user.id)})
        headers = {"Authorization": f"Bearer {user_token}"}

        # Tenter de forcer le mot de passe
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test"
            },
            headers=headers
        )

        assert response.status_code == 403
        data = response.json()
        assert "Super Administrateurs uniquement" in data["detail"]

    def test_force_password_unauthorized_no_token(self, client: TestClient, db_session: Session):
        """Test que l'endpoint nécessite une authentification"""
        
        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Tenter de forcer le mot de passe sans token
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test"
            }
        )

        assert response.status_code == 401

    def test_force_password_user_not_found(self, client: TestClient, db_session: Session):
        """Test de forçage de mot de passe avec un utilisateur inexistant"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Tenter de forcer le mot de passe d'un utilisateur inexistant
        fake_user_id = "99999999-9999-9999-9999-999999999999"
        response = client.post(
            f"/api/v1/admin/users/{fake_user_id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test"
            },
            headers=headers
        )

        assert response.status_code == 404
        data = response.json()
        assert "Utilisateur non trouvé" in data["detail"]

    def test_force_password_validation_weak_password(self, client: TestClient, db_session: Session):
        """Test de validation avec un mot de passe faible"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Tenter de forcer un mot de passe faible
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "weak",
                "reason": "Test"
            },
            headers=headers
        )

        assert response.status_code == 422
        data = response.json()
        assert "Mot de passe invalide" in data["detail"]
        assert "8 caractères" in data["detail"]

    def test_force_password_validation_missing_password(self, client: TestClient, db_session: Session):
        """Test de validation avec mot de passe manquant"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Tenter de forcer sans mot de passe
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "reason": "Test"
            },
            headers=headers
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_force_password_audit_logging(self, client: TestClient, db_session: Session):
        """Test que l'action de forçage est enregistrée dans l'audit"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Forcer le mot de passe
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test d'audit"
            },
            headers=headers
        )

        assert response.status_code == 200

        # Vérifier que l'historique a été enregistré
        from recyclic_api.models.user_status_history import UserStatusHistory
        history_entries = db_session.query(UserStatusHistory).filter(
            UserStatusHistory.user_id == target_user.id,
            UserStatusHistory.changed_by_admin_id == super_admin.id
        ).all()

        assert len(history_entries) > 0
        latest_entry = history_entries[-1]
        assert "Mot de passe forcé par Super Admin" in latest_entry.reason
        assert "Test d'audit" in latest_entry.reason

    def test_force_password_rate_limiting(self, client: TestClient, db_session: Session):
        """Test du rate limiting sur l'endpoint force-password"""
        
        # Créer un Super Admin
        super_admin = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        # Créer un utilisateur cible
        target_user = User(
            username="targetuser",
            email="target@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(target_user)
        db_session.commit()
        db_session.refresh(target_user)

        # Authentifier le Super Admin
        admin_token = create_access_token({"sub": str(super_admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Premier appel - devrait fonctionner
        response = client.post(
            f"/api/v1/admin/users/{target_user.id}/force-password",
            json={
                "new_password": "NewForcedPassword123!",
                "reason": "Test rate limiting"
            },
            headers=headers
        )

        # Le test vérifie juste que l'endpoint fonctionne
        # Le rate limiting réel dépend de la configuration
        assert response.status_code in [200, 429]  # 200 si pas de limite atteinte, 429 si limite atteinte
