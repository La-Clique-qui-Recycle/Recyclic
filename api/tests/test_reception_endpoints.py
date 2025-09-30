import os
import uuid
import pytest

os.environ["TESTING"] = "true"


def test_open_requires_auth(client):
    # l'API doit répondre 401/403 si non authentifié
    r = client.post("/api/v1/reception/postes/open")
    assert r.status_code in (401, 403)


def test_reception_happy_path(admin_client):
    # 1) Ouvrir un poste
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data and data["status"] == "opened"
    poste_id = data["id"]

    # 2) Créer un ticket sur le poste
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200
    ticket_id = r.json()["id"]

    # 3) Clôturer le ticket
    r = admin_client.post(f"/api/v1/reception/tickets/{ticket_id}/close")
    assert r.status_code == 200
    assert r.json()["status"] == "closed"

    # 4) Fermer le poste (plus de tickets ouverts)
    r = admin_client.post(f"/api/v1/reception/postes/{poste_id}/close")
    assert r.status_code == 200
    assert r.json()["status"] == "closed"


def test_close_poste_with_open_ticket_conflict(admin_client):
    # Ouvrir un poste
    r = admin_client.post("/api/v1/reception/postes/open")
    assert r.status_code == 200
    poste_id = r.json()["id"]

    # Créer un ticket (reste ouvert)
    r = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
    assert r.status_code == 200

    # Tenter de fermer le poste → 409
    r = admin_client.post(f"/api/v1/reception/postes/{poste_id}/close")
    assert r.status_code == 409


def test_404_unknown_ids(admin_client):
    unknown_id = str(uuid.uuid4())

    # Fermer un poste inconnu → 404
    r = admin_client.post(f"/api/v1/reception/postes/{unknown_id}/close")
    assert r.status_code == 404

    # Clôturer un ticket inconnu → 404
    r = admin_client.post(f"/api/v1/reception/tickets/{unknown_id}/close")
    assert r.status_code == 404


