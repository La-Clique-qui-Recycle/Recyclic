"""
Tests pour vérifier que les utilisateurs inactifs sont bloqués par le middleware d'authentification.
Adresse QA AUTH-001: Contrôle is_active dans l'auth et middleware d'accès.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, create_access_token


class TestInactiveUserMiddleware:
    """Tests pour vérifier le blocage des utilisateurs inactifs"""

    def test_inactive_user_cannot_access_protected_endpoint(self, client: TestClient, db_session: Session):
        """Test qu'un utilisateur inactif ne peut pas accéder aux endpoints protégés même avec un token valide"""
        # Créer un utilisateur inactif
        hashed_password = hash_password("testpassword123")
        inactive_user = User(
            username="inactive_user",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=False  # Utilisateur inactif
        )
        db_session.add(inactive_user)
        db_session.commit()
        db_session.refresh(inactive_user)

        # Créer un token pour cet utilisateur (simule un token obtenu avant la désactivation)
        access_token = create_access_token(data={"sub": str(inactive_user.id)})

        # Essayer d'accéder à un endpoint protégé avec ce token
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # L'accès doit être refusé avec 401 Unauthorized
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Impossible de valider les identifiants" in data["detail"]

    def test_active_user_can_access_protected_endpoint(self, client: TestClient, db_session: Session):
        """Test qu'un utilisateur actif peut accéder aux endpoints protégés"""
        # Créer un utilisateur actif
        hashed_password = hash_password("testpassword123")
        active_user = User(
            username="active_user",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True  # Utilisateur actif
        )
        db_session.add(active_user)
        db_session.commit()
        db_session.refresh(active_user)

        # Créer un token pour cet utilisateur
        access_token = create_access_token(data={"sub": str(active_user.id)})

        # Accéder à un endpoint protégé avec ce token
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # L'accès doit être autorisé (200 ou autre code de succès, pas 401)
        assert response.status_code != 401
        # L'endpoint peut retourner 200 ou autre selon l'implémentation
        assert response.status_code in [200, 422]  # 422 pour les paramètres de requête manquants

    def test_user_deactivation_blocks_future_requests(self, client: TestClient, db_session: Session):
        """Test qu'un utilisateur désactivé après avoir obtenu un token ne peut plus l'utiliser"""
        # Créer un utilisateur actif
        hashed_password = hash_password("testpassword123")
        user = User(
            username="user_to_deactivate",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True  # Initialement actif
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Créer un token pendant que l'utilisateur est actif
        access_token = create_access_token(data={"sub": str(user.id)})

        # Vérifier qu'il peut initialement accéder aux endpoints protégés
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code != 401

        # Désactiver l'utilisateur
        user.is_active = False
        db_session.commit()

        # Essayer d'accéder à nouveau avec le même token
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # L'accès doit maintenant être refusé
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Impossible de valider les identifiants" in data["detail"]