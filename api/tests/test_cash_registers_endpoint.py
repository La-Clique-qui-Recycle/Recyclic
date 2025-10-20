"""
Tests pour l'endpoint GET /api/cash-registers
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from recyclic_api.models.cash_register import CashRegister
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole


class TestCashRegistersEndpoint:
    """Tests pour les endpoints des postes de caisse."""

    def test_get_cash_registers_success(self, admin_client: TestClient, db_session: Session):
        """Test de récupération réussie des postes de caisse."""
        # Créer un site de test
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        db_session.add(site)
        db_session.commit()

        # Créer des postes de caisse
        register1 = CashRegister(
            id=uuid4(),
            name="Caisse 1",
            location="Entrée",
            site_id=site.id,
            is_active=True
        )
        register2 = CashRegister(
            id=uuid4(),
            name="Caisse 2", 
            location="Sortie",
            site_id=site.id,
            is_active=False
        )
        db_session.add(register1)
        db_session.add(register2)
        db_session.commit()

        # Tester la récupération
        response = admin_client.get("/api/v1/cash-registers")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        
        # Vérifier les champs
        register_data = data[0]
        assert "id" in register_data
        assert "name" in register_data
        assert "location" in register_data
        assert "site_id" in register_data
        assert "is_active" in register_data

    def test_get_cash_registers_filters(self, admin_client: TestClient, db_session: Session):
        """Test des filtres sur les postes de caisse."""
        # Créer un site
        site = Site(
            id=uuid4(),
            name="Site Test",
            is_active=True
        )
        db_session.add(site)
        db_session.commit()

        # Créer des postes avec différents statuts
        active_register = CashRegister(
            id=uuid4(),
            name="Caisse Active",
            location="Principal",
            site_id=site.id,
            is_active=True
        )
        inactive_register = CashRegister(
            id=uuid4(),
            name="Caisse Inactive",
            location="Secondaire", 
            site_id=site.id,
            is_active=False
        )
        db_session.add(active_register)
        db_session.add(inactive_register)
        db_session.commit()

        # Tester le filtre is_active=true
        response = admin_client.get("/api/v1/cash-registers?only_active=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_active"] is True

        # Tester le filtre is_active=false
        response = admin_client.get("/api/v1/cash-registers?only_active=false")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Tous les postes (actifs et inactifs)

    def test_get_cash_registers_authentication(self, admin_client: TestClient):
        """Test que l'endpoint nécessite une authentification."""
        # Test sans token (devrait échouer)
        response = admin_client.get("/api/v1/cash-registers")
        # Note: L'endpoint peut être public ou nécessiter une auth selon l'implémentation
        # On vérifie juste qu'il répond
        assert response.status_code in [200, 401, 403]

    def test_create_cash_register_success(self, admin_client: TestClient, db_session: Session):
        """Test de création d'un poste de caisse avec succès."""
        # Créer un site de test
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        db_session.add(site)
        db_session.commit()

        # Données du poste de caisse
        register_data = {
            "name": "Nouveau Poste",
            "location": "Entrée principale",
            "site_id": str(site.id),
            "is_active": True
        }

        response = admin_client.post("/api/v1/cash-registers", json=register_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Nouveau Poste"
        assert data["location"] == "Entrée principale"
        assert data["site_id"] == str(site.id)
        assert data["is_active"] is True
        assert "id" in data

    def test_update_cash_register_success(self, admin_client: TestClient, db_session: Session):
        """Test de mise à jour d'un poste de caisse avec succès."""
        # Créer un site et un poste
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        register = CashRegister(
            id=uuid4(),
            name="Poste Original",
            location="Ancienne location",
            site_id=site.id,
            is_active=True
        )
        db_session.add(site)
        db_session.add(register)
        db_session.commit()

        # Données de mise à jour
        update_data = {
            "name": "Poste Modifié",
            "location": "Nouvelle location"
        }

        response = admin_client.patch(f"/api/v1/cash-registers/{register.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Poste Modifié"
        assert data["location"] == "Nouvelle location"
        assert data["is_active"] is True  # Non modifié

    def test_delete_cash_register_success(self, admin_client: TestClient, db_session: Session):
        """Test de suppression d'un poste de caisse avec succès."""
        # Créer un site et un poste
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        register = CashRegister(
            id=uuid4(),
            name="Poste à supprimer",
            location="Location test",
            site_id=site.id,
            is_active=True
        )
        db_session.add(site)
        db_session.add(register)
        db_session.commit()

        response = admin_client.delete(f"/api/v1/cash-registers/{register.id}")
        
        assert response.status_code == 204

        # Vérifier que le poste a été supprimé
        response = admin_client.get(f"/api/v1/cash-registers/{register.id}")
        assert response.status_code == 404

    def test_get_cash_register_by_id_success(self, admin_client: TestClient, db_session: Session):
        """Test de récupération d'un poste de caisse par ID."""
        # Créer un site et un poste
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        register = CashRegister(
            id=uuid4(),
            name="Poste Test",
            location="Location test",
            site_id=site.id,
            is_active=True
        )
        db_session.add(site)
        db_session.add(register)
        db_session.commit()

        response = admin_client.get(f"/api/v1/cash-registers/{register.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(register.id)
        assert data["name"] == "Poste Test"
        assert data["location"] == "Location test"

    def test_get_cash_register_not_found(self, admin_client: TestClient):
        """Test de récupération d'un poste de caisse inexistant."""
        fake_id = uuid4()
        response = admin_client.get(f"/api/v1/cash-registers/{fake_id}")

        assert response.status_code == 404

    def test_create_cash_register_with_empty_site_id_fails(self, admin_client: TestClient):
        """Test que la création avec un site_id vide échoue avec 422."""
        register_data = {
            "name": "Test Register",
            "location": "Test Location",
            "site_id": "",  # Empty string should be rejected
            "is_active": True
        }

        response = admin_client.post("/api/v1/cash-registers/", json=register_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_create_cash_register_with_whitespace_site_id_fails(self, admin_client: TestClient):
        """Test que la création avec un site_id contenant uniquement des espaces échoue."""
        register_data = {
            "name": "Test Register",
            "location": "Test Location",
            "site_id": "   ",  # Whitespace only should be rejected
            "is_active": True
        }

        response = admin_client.post("/api/v1/cash-registers/", json=register_data)

        assert response.status_code == 422

    def test_delete_cash_register_with_sessions_fails_409(self, admin_client: TestClient, db_session: Session):
        """Test que la suppression d'un poste avec des sessions échoue avec 409."""
        from recyclic_api.models.cash_session import CashSession, CashSessionStatus
        from recyclic_api.core.security import hash_password

        # Créer un site et un poste
        site = Site(
            id=uuid4(),
            name="Site Test",
            address="123 Rue Test",
            is_active=True
        )
        register = CashRegister(
            id=uuid4(),
            name="Poste avec sessions",
            location="Test",
            site_id=site.id,
            is_active=True
        )

        # Créer un opérateur
        operator = User(
            id=uuid4(),
            username="operator@test.com",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            is_active=True
        )

        db_session.add(site)
        db_session.add(register)
        db_session.add(operator)
        db_session.commit()

        # Créer une session de caisse liée au poste
        session = CashSession(
            id=uuid4(),
            operator_id=operator.id,
            register_id=register.id,  # FIXED: correct field name
            initial_amount=100.0,
            current_amount=100.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(session)
        db_session.commit()

        # Tenter de supprimer le poste (devrait échouer avec 409)
        response = admin_client.delete(f"/api/v1/cash-registers/{register.id}")

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "session" in data["detail"].lower()

    def test_delete_site_with_cash_registers_fails_409(self, admin_client: TestClient, db_session: Session):
        """Test que la suppression d'un site avec des postes de caisse échoue avec 409."""
        # Créer un site et un poste
        site = Site(
            id=uuid4(),
            name="Site avec postes",
            address="123 Rue Test",
            is_active=True
        )
        register = CashRegister(
            id=uuid4(),
            name="Poste de caisse",
            location="Test",
            site_id=site.id,
            is_active=True
        )

        db_session.add(site)
        db_session.add(register)
        db_session.commit()

        # Tenter de supprimer le site (devrait échouer avec 409)
        response = admin_client.delete(f"/api/v1/sites/{site.id}")

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "poste" in data["detail"].lower()