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

