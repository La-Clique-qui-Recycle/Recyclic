import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.site import Site
from recyclic_api.models.user import UserRole

client = TestClient(app)


def test_user_can_list_sites(user_client, db_session):
    """Test qu'un utilisateur avec le rôle USER peut lister les sites."""
    
    # Créer quelques sites de test
    site1 = Site(
        name="Site Test 1",
        address="123 Rue Test",
        is_active=True
    )
    site2 = Site(
        name="Site Test 2", 
        address="456 Avenue Test",
        is_active=True
    )
    db_session.add_all([site1, site2])
    db_session.commit()
    
    # Tester l'accès avec un compte USER
    response = user_client.get("/api/v1/sites/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    sites = response.json()
    assert isinstance(sites, list)
    assert len(sites) >= 2
    
    # Vérifier que les sites sont bien retournés
    site_names = [site["name"] for site in sites]
    assert "Site Test 1" in site_names
    assert "Site Test 2" in site_names


def test_user_can_list_sites_with_only_active_filter(user_client, db_session):
    """Test qu'un utilisateur peut lister les sites avec le filtre only_active."""
    
    # Créer des sites actifs et inactifs
    active_site = Site(
        name="Site Actif",
        address="123 Rue Active",
        is_active=True
    )
    inactive_site = Site(
        name="Site Inactif",
        address="456 Rue Inactive", 
        is_active=False
    )
    db_session.add_all([active_site, inactive_site])
    db_session.commit()
    
    # Tester avec only_active=True
    response = user_client.get("/api/v1/sites/?only_active=true")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    sites = response.json()
    assert isinstance(sites, list)
    
    # Vérifier que seuls les sites actifs sont retournés
    for site in sites:
        assert site["is_active"] is True


def test_user_can_list_sites_with_pagination(user_client, db_session):
    """Test qu'un utilisateur peut utiliser la pagination pour lister les sites."""
    
    # Créer plusieurs sites
    sites = []
    for i in range(5):
        site = Site(
            name=f"Site {i+1}",
            address=f"Adresse {i+1}",
            is_active=True
        )
        sites.append(site)
    db_session.add_all(sites)
    db_session.commit()
    
    # Tester la pagination
    response = user_client.get("/api/v1/sites/?skip=0&limit=3")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    sites_data = response.json()
    assert isinstance(sites_data, list)
    assert len(sites_data) <= 3  # Limite respectée


def test_user_cannot_access_admin_site_operations(user_client, db_session):
    """Test qu'un utilisateur ne peut pas accéder aux opérations d'administration des sites."""
    
    # Créer un site de test
    site = Site(
        name="Site Test",
        address="123 Rue Test",
        is_active=True
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    
    # Tester l'accès à un site spécifique (devrait être bloqué pour les USER)
    response = user_client.get(f"/api/v1/sites/{site.id}")
    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
    
    # Tester la création d'un site (devrait être bloqué)
    site_data = {
        "name": "Nouveau Site",
        "address": "Nouvelle Adresse"
    }
    response = user_client.post("/api/v1/sites/", json=site_data)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
    
    # Tester la mise à jour d'un site (devrait être bloqué)
    update_data = {"name": "Site Modifié"}
    response = user_client.patch(f"/api/v1/sites/{site.id}", json=update_data)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
    
    # Tester la suppression d'un site (devrait être bloqué)
    response = user_client.delete(f"/api/v1/sites/{site.id}")
    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
