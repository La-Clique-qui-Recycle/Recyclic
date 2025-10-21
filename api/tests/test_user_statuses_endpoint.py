"""
Tests pour l'endpoint GET /v1/admin/users/statuses
Teste la récupération des statuts en ligne/hors ligne des utilisateurs
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.core.auth import create_access_token


class TestUserStatusesEndpoint:
    """Tests pour l'endpoint des statuts utilisateurs"""

    def test_get_user_statuses_requires_admin_auth(self, client: TestClient):
        """Test que l'endpoint nécessite une authentification admin"""
        response = client.get("/v1/admin/users/statuses")
        assert response.status_code == 401

    def test_get_user_statuses_requires_admin_role(self, client: TestClient, db_session: Session):
        """Test que l'endpoint nécessite le rôle admin"""
        from recyclic_api.core.security import hash_password
        
        # Créer un utilisateur non-admin
        user = User(
            username="user@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Générer un token pour cet utilisateur
        access_token = create_access_token(data={"sub": str(user.id)})
        client.headers["Authorization"] = f"Bearer {access_token}"

        response = client.get("/v1/admin/users/statuses")
        assert response.status_code == 403

    def test_get_user_statuses_success_with_admin(self, admin_client: TestClient, db_session: Session):
        """Test de récupération réussie des statuts avec un admin"""
        from recyclic_api.core.security import hash_password
        
        # Créer des utilisateurs de test
        user1 = User(
            username="user1@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        user2 = User(
            username="user2@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Ajouter des entrées de login_history
        now = datetime.utcnow()
        
        # User1: connexion récente (en ligne)
        recent_login = LoginHistory(
            user_id=user1.id,
            username=user1.username,
            success=True,
            created_at=now - timedelta(minutes=5)  # Il y a 5 minutes
        )
        
        # User2: connexion ancienne (hors ligne)
        old_login = LoginHistory(
            user_id=user2.id,
            username=user2.username,
            success=True,
            created_at=now - timedelta(minutes=30)  # Il y a 30 minutes
        )
        
        db_session.add_all([recent_login, old_login])
        db_session.commit()

        response = admin_client.get("/v1/admin/users/statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_statuses" in data
        assert "total_count" in data
        assert "online_count" in data
        assert "offline_count" in data
        assert "timestamp" in data
        
        # Vérifier que nous avons des statuts pour nos utilisateurs
        user_statuses = data["user_statuses"]
        assert len(user_statuses) >= 2  # Au moins nos 2 utilisateurs de test
        
        # Trouver les statuts de nos utilisateurs de test
        user1_status = next((s for s in user_statuses if s["user_id"] == str(user1.id)), None)
        user2_status = next((s for s in user_statuses if s["user_id"] == str(user2.id)), None)
        
        assert user1_status is not None
        assert user2_status is not None
        
        # User1 devrait être en ligne (connexion il y a 5 minutes)
        assert user1_status["is_online"] is True
        assert user1_status["minutes_since_login"] <= 15
        
        # User2 devrait être hors ligne (connexion il y a 30 minutes)
        assert user2_status["is_online"] is False
        assert user2_status["minutes_since_login"] > 15

    def test_get_user_statuses_with_no_logins(self, admin_client: TestClient, db_session: Session):
        """Test avec des utilisateurs qui n'ont jamais eu de connexion"""
        from recyclic_api.core.security import hash_password
        
        # Créer un utilisateur sans historique de connexion
        user = User(
            username="newuser@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        response = admin_client.get("/v1/admin/users/statuses")
        assert response.status_code == 200
        
        data = response.json()
        user_statuses = data["user_statuses"]
        
        # Trouver le statut de notre utilisateur
        user_status = next((s for s in user_statuses if s["user_id"] == str(user.id)), None)
        assert user_status is not None
        
        # L'utilisateur devrait être hors ligne
        assert user_status["is_online"] is False
        assert user_status["last_login"] is None
        assert user_status["minutes_since_login"] is None

    def test_get_user_statuses_with_failed_logins(self, admin_client: TestClient, db_session: Session):
        """Test que seules les connexions réussies comptent"""
        from recyclic_api.core.security import hash_password
        
        # Créer un utilisateur
        user = User(
            username="testuser@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        now = datetime.utcnow()
        
        # Ajouter des tentatives de connexion échouées
        failed_login1 = LoginHistory(
            user_id=user.id,
            username=user.username,
            success=False,
            created_at=now - timedelta(minutes=5)
        )
        failed_login2 = LoginHistory(
            user_id=user.id,
            username=user.username,
            success=False,
            created_at=now - timedelta(minutes=2)
        )
        
        # Ajouter une connexion réussie ancienne
        successful_login = LoginHistory(
            user_id=user.id,
            username=user.username,
            success=True,
            created_at=now - timedelta(minutes=20)
        )
        
        db_session.add_all([failed_login1, failed_login2, successful_login])
        db_session.commit()

        response = admin_client.get("/v1/admin/users/statuses")
        assert response.status_code == 200
        
        data = response.json()
        user_statuses = data["user_statuses"]
        
        # Trouver le statut de notre utilisateur
        user_status = next((s for s in user_statuses if s["user_id"] == str(user.id)), None)
        assert user_status is not None
        
        # L'utilisateur devrait être hors ligne (dernière connexion réussie il y a 20 minutes)
        assert user_status["is_online"] is False
        assert user_status["minutes_since_login"] > 15

    def test_get_user_statuses_threshold_boundary(self, admin_client: TestClient, db_session: Session):
        """Test du seuil exact de 15 minutes"""
        from recyclic_api.core.security import hash_password
        
        # Créer des utilisateurs
        user_online = User(
            username="online@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        user_offline = User(
            username="offline@test.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add_all([user_online, user_offline])
        db_session.commit()

        now = datetime.utcnow()
        
        # User en ligne: connexion il y a exactement 14 minutes
        login_online = LoginHistory(
            user_id=user_online.id,
            username=user_online.username,
            success=True,
            created_at=now - timedelta(minutes=14)
        )
        
        # User hors ligne: connexion il y a exactement 16 minutes
        login_offline = LoginHistory(
            user_id=user_offline.id,
            username=user_offline.username,
            success=True,
            created_at=now - timedelta(minutes=16)
        )
        
        db_session.add_all([login_online, login_offline])
        db_session.commit()

        response = admin_client.get("/v1/admin/users/statuses")
        assert response.status_code == 200
        
        data = response.json()
        user_statuses = data["user_statuses"]
        
        # Trouver les statuts
        online_status = next((s for s in user_statuses if s["user_id"] == str(user_online.id)), None)
        offline_status = next((s for s in user_statuses if s["user_id"] == str(user_offline.id)), None)
        
        assert online_status is not None
        assert offline_status is not None
        
        # Vérifier les statuts
        assert online_status["is_online"] is True
        assert offline_status["is_online"] is False

    def test_get_user_statuses_performance(self, admin_client: TestClient, db_session: Session):
        """Test de performance avec de nombreux utilisateurs"""
        from recyclic_api.core.security import hash_password
        
        # Créer plusieurs utilisateurs
        users = []
        for i in range(10):
            user = User(
                username=f"user{i}@test.com",
                hashed_password=hash_password("testpassword"),
                role=UserRole.USER,
                status=UserStatus.ACTIVE
            )
            users.append(user)
        
        db_session.add_all(users)
        db_session.commit()

        # Ajouter des entrées de login_history
        now = datetime.utcnow()
        logins = []
        for i, user in enumerate(users):
            login = LoginHistory(
                user_id=user.id,
                username=user.username,
                success=True,
                created_at=now - timedelta(minutes=i * 2)  # Connexions espacées de 2 minutes
            )
            logins.append(login)
        
        db_session.add_all(logins)
        db_session.commit()

        # Mesurer le temps de réponse
        import time
        start_time = time.time()
        
        response = admin_client.get("/v1/admin/users/statuses")
        
        end_time = time.time()
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 1.0  # Doit répondre en moins d'1 seconde
        
        data = response.json()
        assert len(data["user_statuses"]) >= 10


