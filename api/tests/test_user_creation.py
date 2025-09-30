"""Tests pour l'endpoint de création d'utilisateur"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.schemas.user import UserCreate


def test_create_user_success(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec succès"""
    # Données de test valides
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123!",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    # Créer l'utilisateur via l'API
    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"
    assert data["role"] == "user"
    assert data["status"] == "pending"
    assert data["is_active"] is True
    assert data["telegram_id"] == "123456789"
    assert "hashed_password" not in data  # Le mot de passe ne doit pas être dans la réponse

    # Vérifier que l'utilisateur existe en base
    user = db_session.query(User).filter(User.username == "testuser").first()
    assert user is not None
    assert user.username == "testuser"
    assert user.first_name == "Test"
    assert user.last_name == "User"
    assert user.role == UserRole.USER
    assert user.status == UserStatus.PENDING
    assert user.is_active is True
    assert user.telegram_id == "123456789"
    assert user.hashed_password != "SecurePass123!"  # Le mot de passe doit être hashé


def test_create_user_username_already_exists(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec username déjà existant"""
    # Créer un utilisateur existant
    existing_user = User(
        username="existinguser",
        hashed_password="hashedpassword",
        telegram_id="987654321",
        first_name="Existing",
        last_name="User",
        role=UserRole.USER,
        status=UserStatus.PENDING,
        is_active=True
    )
    db_session.add(existing_user)
    db_session.commit()

    # Essayer de créer un utilisateur avec le même username
    user_data = {
        "telegram_id": "123456789",
        "username": "existinguser",  # Username déjà pris
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123!",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]


def test_create_user_invalid_password_too_short(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec mot de passe trop court"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "123",  # Mot de passe trop court
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Password must be at least 8 characters long" in error_detail["msg"]


def test_create_user_invalid_password_no_uppercase(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec mot de passe sans majuscule"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "securepass123!",  # Pas de majuscule
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Password must contain at least one uppercase letter" in error_detail["msg"]


def test_create_user_invalid_password_no_lowercase(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec mot de passe sans minuscule"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "SECUREPASS123!",  # Pas de minuscule
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Password must contain at least one lowercase letter" in error_detail["msg"]


def test_create_user_invalid_password_no_digit(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec mot de passe sans chiffre"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass!",  # Pas de chiffre
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Password must contain at least one digit" in error_detail["msg"]


def test_create_user_invalid_password_no_special_char(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec mot de passe sans caractère spécial"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123",  # Pas de caractère spécial
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Password must contain at least one special character" in error_detail["msg"]


def test_create_user_invalid_username_too_short(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec username trop court"""
    user_data = {
        "telegram_id": "123456789",
        "username": "ab",  # Username trop court
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123!",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Username must be at least 3 characters long" in error_detail["msg"]


def test_create_user_invalid_username_format(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec username au format invalide"""
    user_data = {
        "telegram_id": "123456789",
        "username": "test@user",  # Caractères non autorisés
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123!",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"][0]
    assert "Username can only contain letters, numbers, underscores, and hyphens" in error_detail["msg"]


def test_create_user_missing_required_fields(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec champs requis manquants"""
    # Données incomplètes (password manquant)
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
        # password manquant
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 422  # Validation error
    error_detail = response.json()["detail"]
    assert any("password" in str(field) for field in error_detail)


def test_create_user_optional_fields_omitted(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec champs optionnels omis"""
    user_data = {
        "telegram_id": "123456789",
        "username": "testuser",
        "password": "SecurePass123!",
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True
        # first_name, last_name, site_id omis
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["first_name"] is None
    assert data["last_name"] is None
    assert data["site_id"] is None

    # Vérifier en base
    user = db_session.query(User).filter(User.username == "testuser").first()
    assert user.first_name is None
    assert user.last_name is None
    assert user.site_id is None


def test_create_user_with_all_fields(client: TestClient, db_session: Session):
    """Test de création d'utilisateur avec tous les champs remplis"""
    user_data = {
        "telegram_id": "123456789",
        "username": "completeuser",
        "first_name": "Complete",
        "last_name": "User",
        "password": "CompletePass123!",
        "role": UserRole.ADMIN,
        "status": UserStatus.APPROVED,
        "is_active": True,
        "site_id": "550e8400-e29b-41d4-a716-446655440000"
    }

    response = client.post("/api/v1/users/", json=user_data)

    # Vérifications
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "completeuser"
    assert data["first_name"] == "Complete"
    assert data["last_name"] == "User"
    assert data["role"] == "admin"
    assert data["status"] == "approved"
    assert data["is_active"] is True
    assert data["site_id"] == "550e8400-e29b-41d4-a716-446655440000"

    # Vérifier en base
    user = db_session.query(User).filter(User.username == "completeuser").first()
    assert user.role == UserRole.ADMIN
    assert user.status == UserStatus.APPROVED
    assert str(user.site_id) == "550e8400-e29b-41d4-a716-446655440000"
