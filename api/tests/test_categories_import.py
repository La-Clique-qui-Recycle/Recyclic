import io
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from recyclic_api.main import app


client = TestClient(app)


def make_csv(content: str) -> bytes:
    return content.encode("utf-8")


@pytest.mark.parametrize("filename", ["cats.csv"]) 
def test_categories_import_analyze_requires_csv_and_returns_session(monkeypatch, admin_client, filename):
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "EEE - Informatique,Ordinateur portable,5,100\n"
    )

    files = {"file": (filename, make_csv(csv_data), "text/csv")}
    r = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["session_id"]
    assert data["summary"]["total"] == 1


def test_categories_import_execute_flow(admin_client):
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Mobilier,Chaise,,\n"
        "Mobilier,Table,10,50\n"
    )
    files = {"file": ("cats.csv", make_csv(csv_data), "text/csv")}
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    session_id = r1.json()["session_id"]
    assert session_id

    r2 = admin_client.post("/api/v1/categories/import/execute", json={"session_id": session_id})
    assert r2.status_code == 200, r2.text
    result = r2.json()
    assert result["errors"] == []
    # 2 lignes dont 1 sub créée + 1 sub créée → imported >= 1
    assert result["imported"] >= 1


def test_categories_import_template_download(admin_client):
    r = admin_client.get("/api/v1/categories/import/template")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "filename=categories_import_template.csv" in r.headers.get("content-disposition", "")


def test_categories_import_execute_with_delete_existing(admin_client, db_session):
    """Test que l'option delete_existing supprime toutes les catégories existantes avant l'import."""
    from recyclic_api.models.category import Category
    from recyclic_api.models.ligne_depot import LigneDepot
    
    # Créer quelques catégories existantes
    existing_cat1 = Category(name="Catégorie existante 1", is_active=True)
    existing_cat2 = Category(name="Catégorie existante 2", is_active=True)
    db_session.add_all([existing_cat1, existing_cat2])
    db_session.commit()
    
    # Créer quelques lignes de dépôt qui référencent ces catégories
    ligne1 = LigneDepot(
        ticket_id="test-ticket-1",
        category_id=existing_cat1.id,
        poids_kg=1.5,
        destination="reparation"
    )
    ligne2 = LigneDepot(
        ticket_id="test-ticket-2", 
        category_id=existing_cat2.id,
        poids_kg=2.0,
        destination="revente"
    )
    db_session.add_all([ligne1, ligne2])
    db_session.commit()
    
    # Vérifier qu'elles existent
    assert db_session.query(Category).count() == 2
    assert db_session.query(LigneDepot).count() == 2
    
    # Préparer l'import avec delete_existing=True
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Nouvelle catégorie,Sous-catégorie,10,50\n"
    )
    files = {"file": ("cats.csv", make_csv(csv_data), "text/csv")}
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    session_id = r1.json()["session_id"]
    assert session_id
    
    # Exécuter l'import avec delete_existing=True
    r2 = admin_client.post("/api/v1/categories/import/execute", json={
        "session_id": session_id,
        "delete_existing": True
    })
    assert r2.status_code == 200, r2.text
    result = r2.json()
    assert result["errors"] == []
    assert result["imported"] >= 1
    
    # Vérifier que les anciennes catégories et lignes de dépôt ont été supprimées
    # et que seules les nouvelles catégories existent
    remaining_categories = db_session.query(Category).all()
    remaining_lignes = db_session.query(LigneDepot).all()
    category_names = [cat.name for cat in remaining_categories]
    
    # Les anciennes catégories ne doivent plus exister
    assert "Catégorie existante 1" not in category_names
    assert "Catégorie existante 2" not in category_names
    
    # Les lignes de dépôt doivent aussi avoir été supprimées
    assert len(remaining_lignes) == 0
    
    # Les nouvelles catégories doivent exister
    assert "Nouvelle catégorie" in category_names
    assert "Sous-catégorie" in category_names


def test_categories_import_execute_without_delete_existing(admin_client, db_session):
    """Test que sans delete_existing, les catégories existantes sont préservées."""
    from recyclic_api.models.category import Category
    
    # Créer quelques catégories existantes
    existing_cat = Category(name="Catégorie existante", is_active=True)
    db_session.add(existing_cat)
    db_session.commit()
    
    # Vérifier qu'elle existe
    assert db_session.query(Category).count() == 1
    
    # Préparer l'import avec delete_existing=False (par défaut)
    csv_data = (
        "Catégorie racine,Sous-catégorie,Prix minimum (€),Prix maximum (€)\n"
        "Nouvelle catégorie,Sous-catégorie,10,50\n"
    )
    files = {"file": ("cats.csv", make_csv(csv_data), "text/csv")}
    r1 = admin_client.post("/api/v1/categories/import/analyze", files=files)
    assert r1.status_code == 200, r1.text
    session_id = r1.json()["session_id"]
    assert session_id
    
    # Exécuter l'import sans delete_existing
    r2 = admin_client.post("/api/v1/categories/import/execute", json={
        "session_id": session_id,
        "delete_existing": False
    })
    assert r2.status_code == 200, r2.text
    result = r2.json()
    assert result["errors"] == []
    assert result["imported"] >= 1
    
    # Vérifier que l'ancienne catégorie existe toujours
    # et que les nouvelles ont été ajoutées
    remaining_categories = db_session.query(Category).all()
    category_names = [cat.name for cat in remaining_categories]
    
    # L'ancienne catégorie doit toujours exister
    assert "Catégorie existante" in category_names
    
    # Les nouvelles catégories doivent aussi exister
    assert "Nouvelle catégorie" in category_names
    assert "Sous-catégorie" in category_names
    
    # Il doit y avoir au moins 3 catégories (1 existante + 2 nouvelles)
    assert len(remaining_categories) >= 3

