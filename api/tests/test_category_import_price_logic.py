import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from io import StringIO

from recyclic_api.main import app
from recyclic_api.models.category import Category
from recyclic_api.models.user import UserRole

client = TestClient(app)


def make_csv(content: str) -> StringIO:
    """Helper to create CSV content"""
    return StringIO(content)


def test_import_csv_with_parent_price_conflict(admin_client, db_session):
    """Test que l'import CSV gère correctement les conflits de prix parent/enfant."""
    
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
    
    # Préparer un CSV qui crée une sous-catégorie pour ce parent
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Catégorie Parent,Sous-catégorie,5,25\n"
    )
    files = {"file": ("test.csv", make_csv(csv_data), "text/csv")}
    
    # Analyser l'import
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    result = r1.json()
    
    # Vérifier qu'il y a un avertissement
    assert "warnings" in result
    assert len(result["warnings"]) > 0
    assert "prix qui seront supprimés automatiquement" in result["warnings"][0]
    
    # Exécuter l'import
    r2 = admin_client.post("/api/v1/categories/import/execute", json={
        "session_id": result["session_id"],
        "delete_existing": False
    })
    assert r2.status_code == 200, r2.text
    import_result = r2.json()
    assert import_result["errors"] == []
    assert import_result["imported"] >= 1
    
    # Vérifier que les prix du parent ont été supprimés
    db_session.refresh(parent_category)
    assert parent_category.price is None
    assert parent_category.max_price is None
    
    # Vérifier que la sous-catégorie a été créée avec les bons prix
    subcategory = db_session.query(Category).filter(
        Category.name == "Sous-catégorie",
        Category.parent_id == parent_category.id
    ).first()
    assert subcategory is not None
    assert subcategory.price == 5.0
    assert subcategory.max_price == 25.0


def test_import_csv_with_root_prices_allowed(admin_client, db_session):
    """Test que l'import CSV permet maintenant les prix sur les catégories racines."""
    
    # Préparer un CSV avec des prix sur une catégorie racine
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Catégorie Racine,,10,50\n"
    )
    files = {"file": ("test.csv", make_csv(csv_data), "text/csv")}
    
    # Analyser l'import
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    result = r1.json()
    
    # Vérifier qu'il n'y a pas d'erreurs
    assert result["errors"] == []
    
    # Exécuter l'import
    r2 = admin_client.post("/api/v1/categories/import/execute", json={
        "session_id": result["session_id"],
        "delete_existing": False
    })
    assert r2.status_code == 200, r2.text
    import_result = r2.json()
    assert import_result["errors"] == []
    assert import_result["imported"] >= 1
    
    # Vérifier que la catégorie racine a été créée avec les bons prix
    root_category = db_session.query(Category).filter(
        Category.name == "Catégorie Racine",
        Category.parent_id.is_(None)
    ).first()
    assert root_category is not None
    assert root_category.price == 10.0
    assert root_category.max_price == 50.0


def test_import_csv_mixed_scenario(admin_client, db_session):
    """Test un scénario mixte avec plusieurs catégories."""
    
    # Préparer un CSV complexe
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Électronique,,,,\n"
        "Électronique,Smartphones,200,800\n"
        "Électronique,Ordinateurs,500,2000\n"
        "Vêtements,,,,\n"
        "Vêtements,Hommes,20,100\n"
        "Vêtements,Femmes,25,150\n"
    )
    files = {"file": ("test.csv", make_csv(csv_data), "text/csv")}
    
    # Analyser l'import
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    result = r1.json()
    
    # Vérifier qu'il n'y a pas d'erreurs
    assert result["errors"] == []
    
    # Exécuter l'import
    r2 = admin_client.post("/api/v1/categories/import/execute", json={
        "session_id": result["session_id"],
        "delete_existing": False
    })
    assert r2.status_code == 200, r2.text
    import_result = r2.json()
    assert import_result["errors"] == []
    assert import_result["imported"] >= 4  # Au moins 4 sous-catégories
    
    # Vérifier la structure
    electronique = db_session.query(Category).filter(
        Category.name == "Électronique",
        Category.parent_id.is_(None)
    ).first()
    assert electronique is not None
    assert electronique.price is None  # Pas de prix car a des enfants
    assert electronique.max_price is None
    
    smartphones = db_session.query(Category).filter(
        Category.name == "Smartphones",
        Category.parent_id == electronique.id
    ).first()
    assert smartphones is not None
    assert smartphones.price == 200.0
    assert smartphones.max_price == 800.0
