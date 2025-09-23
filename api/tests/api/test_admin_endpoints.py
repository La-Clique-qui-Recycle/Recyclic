"""Tests pour les endpoints d'administration"""
import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.auth import create_access_token


@pytest.fixture
def admin_user(db_session: Session):
    """Créer un utilisateur admin pour les tests."""
    admin = User(
        username="admin_test",
        email="admin@test.com",
        hashed_password="hashed_password",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    return admin


@pytest.fixture
def admin_token(admin_user: User):
    """Créer un token JWT pour l'admin."""
    return create_access_token(data={"sub": str(admin_user.id)})


@pytest.fixture
def normal_user(db_session: Session):
    """Créer un utilisateur normal pour les tests."""
    user = User(
        username="test_user",
        email="user@test.com",
        hashed_password="hashed_password",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.mark.asyncio
async def test_get_users_success(async_client: AsyncClient, admin_token: str):
    """Test que l'endpoint liste les utilisateurs"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_users_with_filters(async_client: AsyncClient, admin_token: str):
    """Test des filtres sur la liste des utilisateurs"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test filtre par rôle
    response = await async_client.get("/api/v1/admin/users?role=user", headers=headers)
    assert response.status_code == 200

    # Test filtre par statut
    response = await async_client.get("/api/v1/admin/users?status=approved", headers=headers)
    assert response.status_code == 200

    # Test pagination
    response = await async_client.get("/api/v1/admin/users?skip=0&limit=10", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_user_role_user_not_found(async_client: AsyncClient, admin_token: str):
    """Test modification de rôle d'un utilisateur inexistant"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.put(
        "/api/v1/admin/users/nonexistent/role",
        json={"role": "admin"},
        headers=headers
    )
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_user_role_invalid_role(async_client: AsyncClient, admin_token: str):
    """Test modification avec un rôle invalide"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "invalid_role"},
        headers=headers
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_update_user_role_valid_role(async_client: AsyncClient, admin_token: str):
    """Test modification avec un rôle valide (même si l'utilisateur n'existe pas)"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "admin"},
        headers=headers
    )
    # Devrait retourner 404 car l'utilisateur n'existe pas, mais la validation du rôle passe
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


@pytest.mark.asyncio
async def test_admin_endpoints_structure(async_client: AsyncClient, admin_token: str):
    """Test que les endpoints admin sont bien structurés"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /admin/users
    response = await async_client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200

    # Test PUT /admin/users/{id}/role
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "user"},
        headers=headers
    )
    # Devrait retourner 404 car l'utilisateur n'existe pas, mais l'endpoint fonctionne
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_user_profile_success(async_client: AsyncClient, admin_token: str, normal_user: User):
    """Test de la mise à jour réussie du profil utilisateur."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "username": "updated_username",
        "role": "admin",
        "status": "pending"
    }
    response = await async_client.put(
        f"/api/v1/admin/users/{normal_user.id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"
    assert data["username"] == "updated_username"
    assert data["role"] == "admin"
    assert data["status"] == "pending"

@pytest.mark.asyncio
async def test_trigger_reset_password_no_email(async_client: AsyncClient, admin_token: str, db_session: Session):
    """Test de la réinitialisation pour un utilisateur sans e-mail."""
    user_no_email = User(
        username="no_email_user",
        hashed_password="a_password",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(user_no_email)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.post(
        f"/api/v1/admin/users/{user_no_email.id}/reset-password",
        headers=headers
    )
    assert response.status_code == 400
    assert "pas d'adresse e-mail" in response.json()["detail"]
