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
