"""Tests pour les endpoints d'administration"""
import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus


@pytest.mark.asyncio
async def test_get_users_success(async_client: AsyncClient):
    """Test que l'endpoint liste les utilisateurs"""
    response = await async_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_users_with_filters(async_client: AsyncClient):
    """Test des filtres sur la liste des utilisateurs"""
    # Test filtre par rôle
    response = await async_client.get("/api/v1/admin/users?role=user")
    assert response.status_code == 200
    
    # Test filtre par statut
    response = await async_client.get("/api/v1/admin/users?status=approved")
    assert response.status_code == 200
    
    # Test pagination
    response = await async_client.get("/api/v1/admin/users?skip=0&limit=10")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_user_role_user_not_found(async_client: AsyncClient):
    """Test modification de rôle d'un utilisateur inexistant"""
    response = await async_client.put(
        "/api/v1/admin/users/nonexistent/role",
        json={"role": "admin"}
    )
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_user_role_invalid_role(async_client: AsyncClient):
    """Test modification avec un rôle invalide"""
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "invalid_role"}
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_update_user_role_valid_role(async_client: AsyncClient):
    """Test modification avec un rôle valide (même si l'utilisateur n'existe pas)"""
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "admin"}
    )
    # Devrait retourner 404 car l'utilisateur n'existe pas, mais la validation du rôle passe
    assert response.status_code == 404
    assert "Utilisateur non trouvé" in response.json()["detail"]


@pytest.mark.asyncio
async def test_admin_endpoints_structure(async_client: AsyncClient):
    """Test que les endpoints admin sont bien structurés"""
    # Test GET /admin/users
    response = await async_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    
    # Test PUT /admin/users/{id}/role
    response = await async_client.put(
        "/api/v1/admin/users/123/role",
        json={"role": "user"}
    )
    # Devrait retourner 404 car l'utilisateur n'existe pas, mais l'endpoint fonctionne
    assert response.status_code == 404
