"""Tests pour les endpoints de gestion des utilisateurs (statut et profil)"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.core.security import hash_password


def test_update_user_status_success(client: TestClient, db_session: Session):
    """Test de mise à jour du statut utilisateur avec succès"""
    # Créer un utilisateur de test
    test_user = User(
        username="testuser",
        hashed_password=hash_password("password"),
        telegram_id="123456789",
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    # Créer un admin pour la requête
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Mettre à jour le statut de l'utilisateur
    response = client.put(
        f"/api/v1/admin/users/{test_user.id}/status",
        json={"is_active": False, "reason": "Test de désactivation"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_active"] is False
    assert data["data"]["previous_status"] is True
    assert data["data"]["reason"] == "Test de désactivation"
    
    # Vérifier que l'utilisateur a été mis à jour en base
    db_session.refresh(test_user)
    assert test_user.is_active is False
    
    # Vérifier que l'historique a été créé
    history = db_session.query(UserStatusHistory).filter(
        UserStatusHistory.user_id == test_user.id
    ).first()
    assert history is not None
    assert history.old_status is True
    assert history.new_status is False
    assert history.reason == "Test de désactivation"
    assert history.changed_by_admin_id == admin_user.id


def test_update_user_status_user_not_found(client: TestClient, db_session: Session):
    """Test de mise à jour du statut d'un utilisateur inexistant"""
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Essayer de mettre à jour un utilisateur inexistant
    response = client.put(
        "/api/v1/admin/users/00000000-0000-0000-0000-000000000000/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


def test_update_user_status_admin_cannot_deactivate_self(client: TestClient, db_session: Session):
    """Test qu'un admin ne peut pas se désactiver lui-même"""
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Essayer de se désactiver soi-même
    response = client.put(
        f"/api/v1/admin/users/{admin_user.id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403
    assert "ne peut pas se désactiver lui-même" in response.json()["detail"]


def test_update_user_profile_success(client: TestClient, db_session: Session):
    """Test de mise à jour du profil utilisateur avec succès"""
    # Créer un utilisateur de test
    test_user = User(
        username="testuser",
        hashed_password=hash_password("password"),
        telegram_id="123456789",
        first_name="Old",
        last_name="Name",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Mettre à jour le profil de l'utilisateur
    response = client.put(
        f"/api/v1/admin/users/{test_user.id}",
        json={"first_name": "New", "last_name": "Name"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["first_name"] == "New"
    assert data["data"]["last_name"] == "Name"
    assert "first_name" in data["data"]["updated_fields"]
    assert "last_name" in data["data"]["updated_fields"]
    
    # Vérifier que l'utilisateur a été mis à jour en base
    db_session.refresh(test_user)
    assert test_user.first_name == "New"
    assert test_user.last_name == "Name"


def test_update_user_profile_partial_update(client: TestClient, db_session: Session):
    """Test de mise à jour partielle du profil utilisateur"""
    # Créer un utilisateur de test
    test_user = User(
        username="testuser",
        hashed_password=hash_password("password"),
        telegram_id="123456789",
        first_name="Old",
        last_name="Name",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Mettre à jour seulement le prénom
    response = client.put(
        f"/api/v1/admin/users/{test_user.id}",
        json={"first_name": "NewFirst"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["first_name"] == "NewFirst"
    assert data["data"]["last_name"] == "Name"  # Inchangé
    assert data["data"]["updated_fields"] == ["first_name"]
    
    # Vérifier que seul le prénom a été mis à jour
    db_session.refresh(test_user)
    assert test_user.first_name == "NewFirst"
    assert test_user.last_name == "Name"  # Inchangé


def test_update_user_profile_no_fields_provided(client: TestClient, db_session: Session):
    """Test de mise à jour du profil sans champs fournis"""
    # Créer un utilisateur de test
    test_user = User(
        username="testuser",
        hashed_password=hash_password("password"),
        telegram_id="123456789",
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Essayer de mettre à jour sans fournir de champs
    response = client.put(
        f"/api/v1/admin/users/{test_user.id}",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 400
    assert "Aucun champ à mettre à jour fourni" in response.json()["detail"]


def test_update_user_profile_user_not_found(client: TestClient, db_session: Session):
    """Test de mise à jour du profil d'un utilisateur inexistant"""
    # Créer un admin
    admin_user = User(
        username="admin",
        hashed_password=hash_password("password"),
        telegram_id="987654321",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # Se connecter en tant qu'admin
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Essayer de mettre à jour un utilisateur inexistant
    response = client.put(
        "/api/v1/admin/users/00000000-0000-0000-0000-000000000000",
        json={"first_name": "New"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


def test_admin_endpoints_require_admin_role(client: TestClient, db_session: Session):
    """Test que les endpoints nécessitent un rôle admin"""
    # Créer un utilisateur normal (non-admin)
    normal_user = User(
        username="normaluser",
        hashed_password=hash_password("password"),
        telegram_id="123456789",
        first_name="Normal",
        last_name="User",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(normal_user)
    db_session.commit()
    
    # Se connecter en tant qu'utilisateur normal
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "normaluser", "password": "password"}
    )
    token = login_response.json()["access_token"]
    
    # Essayer d'accéder aux endpoints admin
    response = client.put(
        "/api/v1/admin/users/123/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    
    response = client.put(
        "/api/v1/admin/users/123",
        json={"first_name": "New"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
