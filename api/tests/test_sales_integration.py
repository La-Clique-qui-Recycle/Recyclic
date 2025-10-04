"""
Tests d'intégration pour l'endpoint POST /sales
Story 5.2 - Interface Vente Multi-Modes
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.cash_register import CashRegister
from recyclic_api.core.security import create_access_token


class TestSalesIntegration:
    """Tests d'intégration pour l'endpoint POST /sales"""

    @pytest.fixture
    def client(self):
        """Client de test FastAPI"""
        return TestClient(app)

    @pytest.fixture
    def test_cashier(self, client):
        """Données de test pour un caissier"""
        return {
            "id": uuid.uuid4(),
            "username": "test_cashier",
            "hashed_password": "hashed_password",
            "role": UserRole.CASHIER,
            "status": UserStatus.APPROVED,
            "is_active": True
        }

    @pytest.fixture
    def test_site(self, client):
        """Données de test pour un site"""
        return {
            "id": uuid.uuid4(),
            "name": "Test Site",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "country": "France"
        }

    @pytest.fixture
    def test_cash_register(self, client, test_site):
        """Données de test pour un poste de caisse"""
        return {
            "id": uuid.uuid4(),
            "name": "Test Register",
            "location": "Test Location",
            "site_id": str(test_site["id"]),
            "is_active": True
        }

    @pytest.fixture
    def test_cash_session(self, client, test_cashier, test_site, test_cash_register):
        """Données de test pour une session de caisse"""
        return {
            "id": uuid.uuid4(),
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "register_id": str(test_cash_register["id"]),
            "initial_amount": 100.0,
            "current_amount": 100.0,
            "status": "open",
            "opened_at": datetime.utcnow()
        }

    @pytest.fixture
    def cashier_token(self, test_cashier):
        """Token JWT pour le caissier"""
        return create_access_token(data={"sub": str(test_cashier["id"])})

    def test_create_sale_success(self, client: TestClient, test_cashier, test_site, test_cash_register, test_cash_session, cashier_token, db_session):
        """Test de création d'une vente avec succès"""
        # Créer les données de test en base
        user = User(**test_cashier)
        site = Site(**test_site)
        cash_register = CashRegister(**test_cash_register)
        cash_session = CashSession(**test_cash_session)

        db_session.add(user)
        db_session.add(site)
        db_session.add(cash_register)
        db_session.add(cash_session)
        db_session.commit()

        # Données de la vente
        sale_data = {
            "cash_session_id": str(test_cash_session["id"]),
            "items": [
                {
                    "category": "EEE-1",
                    "quantity": 2,
                    "weight": 1.5,  # Poids en kg
                    "unit_price": 10.0,
                    "total_price": 10.0  # total_price = unit_price (pas de multiplication)
                },
                {
                    "category": "EEE-2",
                    "quantity": 1,
                    "weight": 0.75,  # Poids en kg
                    "unit_price": 5.50,
                    "total_price": 5.50
                }
            ],
            "total_amount": 15.50  # Mis à jour car total = 10.0 + 5.50
        }

        # Créer la vente
        response = client.post(
            "/api/v1/sales/",
            json=sale_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        
        # Vérifications
        assert data["cash_session_id"] == str(test_cash_session["id"])
        assert data["total_amount"] == 15.50
        assert "id" in data
        assert "created_at" in data
        assert len(data["items"]) == 2
        assert data["items"][0]["category"] == "EEE-1"
        assert data["items"][0]["quantity"] == 2
        assert data["items"][0]["weight"] == 1.5

    def test_create_sale_unauthorized(self, client: TestClient, test_cash_session):
        """Test de création d'une vente sans authentification"""
        sale_data = {
            "cash_session_id": str(test_cash_session["id"]),
            "items": [
                {
                    "category": "EEE-1",
                    "quantity": 1,
                    "weight": 1.0,
                    "unit_price": 10.0,
                    "total_price": 10.0
                }
            ],
            "total_amount": 10.0
        }

        response = client.post("/api/v1/sales/", json=sale_data)
        assert response.status_code == 401

    def test_create_sale_invalid_data(self, client: TestClient, cashier_token):
        """Test de création d'une vente avec des données invalides"""
        sale_data = {
            "cash_session_id": "invalid-uuid",
            "items": [
                {
                    "category": "EEE-1",
                    "quantity": -1,  # Quantité négative
                    "weight": -1.0,  # Poids négatif
                    "unit_price": 10.0,
                    "total_price": -10.0
                }
            ],
            "total_amount": -10.0  # Montant négatif
        }

        response = client.post(
            "/api/v1/sales/",
            json=sale_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        assert response.status_code == 422  # Validation error

    def test_get_sales_list(self, client: TestClient, cashier_token):
        """Test de récupération de la liste des ventes"""
        response = client.get(
            "/api/v1/sales/",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
