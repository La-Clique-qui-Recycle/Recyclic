import os
import uuid

os.environ["TESTING"] = "true"


def test_lines_crud_and_rules(admin_client):
    # 1) Ouvrir un poste
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]

    # 2) Créer un ticket
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    # 3) Récupérer une dom_category existante via SQL direct fixture util (fallback minimal)
    # On utilise un endpoint existant si disponible plus tard; ici test DB minimaliste dans d'autres tests
    # Pour rester simple ici, on appelle la base directement via un helper fourni par la fixture admin_client
    # Si la fixture n'expose pas de connexion, on skip si 404
    from sqlalchemy import create_engine, text
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        dom_category_id = conn.execute(text("SELECT id FROM dom_category ORDER BY label LIMIT 1")).scalar()
    assert dom_category_id, "Aucune dom_category trouvée pour le test"

    # 4) Ajouter une ligne valide
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "1.250",
            "destination": "RECYCLAGE",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ticket_id"] == ticket_id
    ligne_id = data["id"]

    # 5) Règle métier: poids_kg > 0
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "0",
            "destination": "MAGASIN",
        },
    )
    assert r.status_code == 422

    # 6) Update ligne: changer poids et destination
    r = admin_client.put(
        f"/api/v1/reception/lignes/{ligne_id}",
        json={"poids_kg": "2.000", "destination": "MAGASIN"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["poids_kg"] == "2.000"
    assert data["destination"] == "MAGASIN"

    # 7) Fermer le ticket
    r = admin_client.post(f"/api/v1/reception/tickets/{ticket_id}/close")
    assert r.status_code == 200

    # 8) Règle: impossible d'ajouter/modifier/supprimer si ticket fermé → 409
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "1.000",
            "destination": "RECYCLAGE",
        },
    )
    assert r.status_code == 409

    r = admin_client.put(
        f"/api/v1/reception/lignes/{ligne_id}",
        json={"poids_kg": "1.500"},
    )
    assert r.status_code == 409

    r = admin_client.delete(f"/api/v1/reception/lignes/{ligne_id}")
    assert r.status_code == 409


def test_delete_line_when_ticket_open(admin_client):
    # Setup poste + ticket + catégorie + ligne
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    from sqlalchemy import create_engine, text
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        dom_category_id = conn.execute(text("SELECT id FROM dom_category ORDER BY label LIMIT 1")).scalar()
    assert dom_category_id

    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "3.333",
            "destination": "MAGASIN",
        },
    )
    assert r.status_code == 200
    ligne_id = r.json()["id"]

    # Delete OK
    r = admin_client.delete(f"/api/v1/reception/lignes/{ligne_id}")
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"


def test_404_invalid_dom_category_id(admin_client):
    """Test 404 pour dom_category_id invalide (POST/PUT)."""
    # Setup poste + ticket
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    # POST avec dom_category_id invalide → 404
    invalid_category_id = "00000000-0000-0000-0000-000000000000"
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": invalid_category_id,
            "poids_kg": "1.000",
            "destination": "DECHETERIE",
        },
    )
    assert r.status_code == 404

    # Créer une ligne valide d'abord
    from sqlalchemy import create_engine, text
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        dom_category_id = conn.execute(text("SELECT id FROM dom_category ORDER BY label LIMIT 1")).scalar()
    assert dom_category_id

    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "1.000",
            "destination": "DECHETERIE",
        },
    )
    assert r.status_code == 200
    ligne_id = r.json()["id"]

    # PUT avec dom_category_id invalide → 404
    r = admin_client.put(
        f"/api/v1/reception/lignes/{ligne_id}",
        json={"dom_category_id": invalid_category_id},
    )
    assert r.status_code == 404


def test_update_notes_and_dom_category_id_happy_path(admin_client):
    """Test update notes et dom_category_id (chemin heureux)."""
    # Setup poste + ticket
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    # Récupérer deux catégories différentes
    from sqlalchemy import create_engine, text
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        categories = conn.execute(text("SELECT id FROM dom_category ORDER BY label LIMIT 2")).fetchall()
    assert len(categories) >= 2
    category1_id = str(categories[0][0])
    category2_id = str(categories[1][0])

    # Créer une ligne
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": category1_id,
            "poids_kg": "1.000",
            "destination": "DECHETERIE",
            "notes": "Note initiale",
        },
    )
    assert r.status_code == 200
    ligne_id = r.json()["id"]

    # Update notes et dom_category_id
    r = admin_client.put(
        f"/api/v1/reception/lignes/{ligne_id}",
        json={
            "dom_category_id": category2_id,
            "notes": "Note mise à jour",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["dom_category_id"] == category2_id
    assert data["notes"] == "Note mise à jour"
    assert data["poids_kg"] == "1.000"  # Inchangé
    assert data["destination"] == "DECHETERIE"  # Inchangé


def test_invalid_destination_enum_values(admin_client):
    """Test validation des valeurs ENUM destination invalides."""
    # Setup poste + ticket
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    # Récupérer une catégorie
    from sqlalchemy import create_engine, text
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        dom_category_id = conn.execute(text("SELECT id FROM dom_category ORDER BY label LIMIT 1")).scalar()
    assert dom_category_id

    # Test valeur ENUM invalide → 422
    r = admin_client.post(
        "/api/v1/reception/lignes",
        json={
            "ticket_id": ticket_id,
            "dom_category_id": str(dom_category_id),
            "poids_kg": "1.000",
            "destination": "INVALID_DESTINATION",
        },
    )
    assert r.status_code == 422
    assert "destination" in str(r.json())


