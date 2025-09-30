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
            "destination": "Recyclage",
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
            "destination": "Test",
        },
    )
    assert r.status_code == 422

    # 6) Update ligne: changer poids et destination
    r = admin_client.put(
        f"/api/v1/reception/lignes/{ligne_id}",
        json={"poids_kg": "2.000", "destination": "Vente"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["poids_kg"] == "2.000"
    assert data["destination"] == "Vente"

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
            "destination": "Test",
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
            "destination": "Don",
        },
    )
    assert r.status_code == 200
    ligne_id = r.json()["id"]

    # Delete OK
    r = admin_client.delete(f"/api/v1/reception/lignes/{ligne_id}")
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"


