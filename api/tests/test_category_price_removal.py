import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.models.category import Category
from recyclic_api.models.user import UserRole

client = TestClient(app)


def test_create_subcategory_removes_parent_price(admin_client, db_session):
    """Test que la création d'une sous-catégorie supprime automatiquement les prix du parent."""
    
    # Créer une catégorie parent avec des prix
    parent_category = Category(
        name="Catégorie Parent",
        is_active=True,
        parent_id=None,
        price=10.0,
        max_price=50.0
    )
    db_session.add(parent_category)
    db_session.commit()
    db_session.refresh(parent_category)
    
    # Vérifier que le parent a des prix
    assert parent_category.price == 10.0
    assert parent_category.max_price == 50.0
    
    # Créer une sous-catégorie
    subcategory_data = {
        "name": "Sous-catégorie",
        "parent_id": str(parent_category.id),
        "price": 5.0,
        "max_price": 25.0
    }
    
    response = admin_client.post("/api/v1/categories/", json=subcategory_data)
    assert response.status_code == 201
    
    # Vérifier que la sous-catégorie a été créée
    subcategory = response.json()
    assert subcategory["name"] == "Sous-catégorie"
    assert subcategory["parent_id"] == str(parent_category.id)
    
    # Vérifier que les prix du parent ont été supprimés
    db_session.refresh(parent_category)
    assert parent_category.price is None
    assert parent_category.max_price is None


def test_update_category_parent_removes_parent_price(admin_client, db_session):
    """Test que la modification d'une catégorie pour la rendre enfant supprime les prix du parent."""
    
    # Créer deux catégories indépendantes avec des prix
    parent_category = Category(
        name="Catégorie Parent",
        is_active=True,
        parent_id=None,
        price=15.0,
        max_price=75.0
    )
    child_category = Category(
        name="Catégorie Enfant",
        is_active=True,
        parent_id=None,
        price=8.0,
        max_price=40.0
    )
    db_session.add_all([parent_category, child_category])
    db_session.commit()
    db_session.refresh(parent_category)
    db_session.refresh(child_category)
    
    # Vérifier que le parent a des prix
    assert parent_category.price == 15.0
    assert parent_category.max_price == 75.0
    
    # Modifier l'enfant pour le rendre enfant du parent
    update_data = {
        "parent_id": str(parent_category.id)
    }
    
    response = admin_client.put(f"/api/v1/categories/{child_category.id}", json=update_data)
    assert response.status_code == 200
    
    # Vérifier que les prix du parent ont été supprimés
    db_session.refresh(parent_category)
    assert parent_category.price is None
    assert parent_category.max_price is None
    
    # Vérifier que l'enfant a bien le bon parent
    updated_child = response.json()
    assert updated_child["parent_id"] == str(parent_category.id)


def test_create_subcategory_without_parent_price_works_normally(admin_client, db_session):
    """Test que la création d'une sous-catégorie fonctionne normalement si le parent n'a pas de prix."""
    
    # Créer une catégorie parent sans prix
    parent_category = Category(
        name="Catégorie Parent Sans Prix",
        is_active=True,
        parent_id=None,
        price=None,
        max_price=None
    )
    db_session.add(parent_category)
    db_session.commit()
    db_session.refresh(parent_category)
    
    # Créer une sous-catégorie
    subcategory_data = {
        "name": "Sous-catégorie",
        "parent_id": str(parent_category.id),
        "price": 5.0,
        "max_price": 25.0
    }
    
    response = admin_client.post("/api/v1/categories/", json=subcategory_data)
    assert response.status_code == 201
    
    # Vérifier que la sous-catégorie a été créée
    subcategory = response.json()
    assert subcategory["name"] == "Sous-catégorie"
    assert subcategory["parent_id"] == str(parent_category.id)
    assert subcategory["price"] == 5.0
    assert subcategory["max_price"] == 25.0
    
    # Vérifier que le parent n'a toujours pas de prix (pas de changement)
    db_session.refresh(parent_category)
    assert parent_category.price is None
    assert parent_category.max_price is None
