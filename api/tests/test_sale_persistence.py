"""
Test de persistance des ventes en base de données
Bug Critique: STORY-BUG-B10-SAVE-SALE

Ce test vérifie que les ventes sont correctement enregistrées en base de données.
"""

import pytest
from uuid import uuid4
from sqlalchemy.orm import Session
from datetime import datetime

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.cash_register import CashRegister
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.core.security import hash_password, create_access_token


class TestSalePersistence:
    """Tests de persistance des ventes en base de données"""

    @pytest.fixture
    def setup_test_data(self, db_session: Session):
        """Crée les données de test nécessaires"""
        # Créer un utilisateur
        user_id = uuid4()
        user = User(
            id=user_id,
            username="cashier@test.com",
            hashed_password=hash_password("password123"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)

        # Créer un site
        site_id = uuid4()
        site = Site(
            id=site_id,
            name="Test Site",
            address="123 Test St",
            city="Test City",
            postal_code="12345",
            country="France"
        )
        db_session.add(site)

        # Créer un poste de caisse
        register_id = uuid4()
        cash_register = CashRegister(
            id=register_id,
            name="Caisse 1",
            location="Entrée",
            site_id=site_id,
            is_active=True
        )
        db_session.add(cash_register)

        # Créer une session de caisse
        session_id = uuid4()
        cash_session = CashSession(
            id=session_id,
            operator_id=user_id,
            site_id=site_id,
            register_id=register_id,
            initial_amount=100.0,
            current_amount=100.0,
            status="open",
            opened_at=datetime.utcnow()
        )
        db_session.add(cash_session)

        db_session.commit()

        return {
            "user_id": user_id,
            "site_id": site_id,
            "register_id": register_id,
            "session_id": session_id,
            "token": create_access_token(data={"sub": str(user_id)})
        }

    def test_sale_is_persisted_to_database(self, client, db_session: Session, setup_test_data):
        """
        Test que la création d'une vente via l'API persiste bien les données en base.

        Acceptance Criteria (STORY-B12-P5):
        1. Une requête POST /api/v1/sales/ crée une vente
        2. La vente et ses lignes sont dans la base de données
        3. Les données correspondent à ce qui a été envoyé
        4. Le poids (weight) est enregistré correctement
        5. Le prix (total_price) est enregistré correctement
        6. Le total = somme des total_price (SANS multiplication par le poids)
        """
        # Arrange: Préparer les données de la vente
        sale_data = {
            "cash_session_id": str(setup_test_data["session_id"]),
            "items": [
                {
                    "category": "EEE-1",
                    "quantity": 1,
                    "weight": 2.5,  # Poids en kg
                    "unit_price": 15.0,
                    "total_price": 15.0  # Contribue 15.0 au total (PAS 2.5 * 15.0 = 37.5)
                },
                {
                    "category": "EEE-3",
                    "quantity": 1,
                    "weight": 0.75,  # Poids en kg
                    "unit_price": 8.50,
                    "total_price": 8.50  # Contribue 8.50 au total (PAS 0.75 * 8.50 = 6.375)
                }
            ],
            "total_amount": 23.50  # Total = 15.0 + 8.50 = 23.50 (somme des total_price)
        }

        # Act: Créer la vente via l'API
        response = client.post(
            "/api/v1/sales/",
            json=sale_data,
            headers={"Authorization": f"Bearer {setup_test_data['token']}"}
        )

        # Assert: Vérifier la réponse HTTP
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        response_data = response.json()

        sale_id = response_data["id"]
        assert sale_id is not None

        # Assert: Vérifier que la vente existe en base de données
        db_sale = db_session.query(Sale).filter(Sale.id == sale_id).first()
        assert db_sale is not None, "La vente n'a pas été trouvée en base de données"

        # Vérification critique : le total = somme des prix (sans multiplication par poids)
        assert float(db_sale.total_amount) == 23.50, (
            f"Expected total_amount 23.50 (sum of total_price), got {db_sale.total_amount}. "
            "CRITICAL: total should be sum of prices, NOT sum of (weight * price)"
        )

        assert str(db_sale.cash_session_id) == str(setup_test_data["session_id"])
        assert str(db_sale.operator_id) == str(setup_test_data["user_id"])

        # Assert: Vérifier que les lignes de vente existent en base de données
        db_items = db_session.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()
        assert len(db_items) == 2, f"Expected 2 items, found {len(db_items)}"

        # Vérifier le premier article (poids, prix, total)
        item1 = next((item for item in db_items if item.category == "EEE-1"), None)
        assert item1 is not None, "Item EEE-1 not found in database"
        assert float(item1.weight) == 2.5, f"Item 1: expected weight 2.5, got {item1.weight}"
        assert float(item1.unit_price) == 15.0, f"Item 1: expected unit_price 15.0, got {item1.unit_price}"
        assert float(item1.total_price) == 15.0, (
            f"Item 1: expected total_price 15.0 (same as unit_price), got {item1.total_price}. "
            "Weight should NOT be multiplied into total_price"
        )

        # Vérifier le deuxième article (poids, prix, total)
        item2 = next((item for item in db_items if item.category == "EEE-3"), None)
        assert item2 is not None, "Item EEE-3 not found in database"
        assert float(item2.weight) == 0.75, f"Item 2: expected weight 0.75, got {item2.weight}"
        assert float(item2.unit_price) == 8.50, f"Item 2: expected unit_price 8.50, got {item2.unit_price}"
        assert float(item2.total_price) == 8.50, (
            f"Item 2: expected total_price 8.50 (same as unit_price), got {item2.total_price}. "
            "Weight should NOT be multiplied into total_price"
        )

    def test_sale_fails_without_authentication(self, client, setup_test_data):
        """Test que la création d'une vente échoue sans authentification"""
        sale_data = {
            "cash_session_id": str(setup_test_data["session_id"]),
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

    def test_session_counters_updated_after_sale(self, client, db_session: Session, setup_test_data):
        """
        Test que les compteurs de la session (total_sales, total_items)
        sont mis à jour après chaque vente.
        """
        # Vérifier l'état initial de la session
        initial_session = db_session.query(CashSession).filter(
            CashSession.id == setup_test_data["session_id"]
        ).first()

        assert initial_session is not None
        assert initial_session.total_sales is None or initial_session.total_sales == 0
        assert initial_session.total_items is None or initial_session.total_items == 0

        # Créer une première vente
        sale_data_1 = {
            "cash_session_id": str(setup_test_data["session_id"]),
            "items": [
                {
                    "category": "EEE-1",
                    "quantity": 1,
                    "weight": 2.5,
                    "unit_price": 15.0,
                    "total_price": 15.0
                }
            ],
            "total_amount": 15.0
        }

        response = client.post(
            "/api/v1/sales/",
            json=sale_data_1,
            headers={"Authorization": f"Bearer {setup_test_data['token']}"}
        )
        assert response.status_code == 200

        # Vérifier que les compteurs ont été mis à jour
        db_session.expire_all()  # Force refresh from DB
        session_after_sale1 = db_session.query(CashSession).filter(
            CashSession.id == setup_test_data["session_id"]
        ).first()

        assert float(session_after_sale1.total_sales) == 15.0
        assert session_after_sale1.total_items == 1
        assert float(session_after_sale1.current_amount) == 100.0 + 15.0  # initial + ventes

        # Créer une deuxième vente
        sale_data_2 = {
            "cash_session_id": str(setup_test_data["session_id"]),
            "items": [
                {
                    "category": "EEE-2",
                    "quantity": 1,
                    "weight": 1.0,
                    "unit_price": 8.50,
                    "total_price": 8.50
                }
            ],
            "total_amount": 8.50
        }

        response = client.post(
            "/api/v1/sales/",
            json=sale_data_2,
            headers={"Authorization": f"Bearer {setup_test_data['token']}"}
        )
        assert response.status_code == 200

        # Vérifier les compteurs après la deuxième vente
        db_session.expire_all()
        session_after_sale2 = db_session.query(CashSession).filter(
            CashSession.id == setup_test_data["session_id"]
        ).first()

        assert float(session_after_sale2.total_sales) == 23.50  # 15.0 + 8.50
        assert session_after_sale2.total_items == 2
        assert float(session_after_sale2.current_amount) == 100.0 + 23.50
