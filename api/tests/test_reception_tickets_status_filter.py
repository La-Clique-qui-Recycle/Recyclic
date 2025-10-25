"""
Tests pour l'endpoint GET /v1/reception/tickets avec filtre de statut
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.reception import PosteReception, PosteReceptionStatus, TicketDepot, TicketDepotStatus
from recyclic_api.core.security import hash_password


class TestReceptionTicketsStatusFilter:
    """Tests pour le filtre de statut sur l'endpoint GET /v1/reception/tickets"""

    def test_get_tickets_without_status_filter(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne tous les tickets quand aucun filtre de statut n'est fourni."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer un poste de réception
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status=PosteReceptionStatus.OPENED.value
        )
        db_session.add(poste)
        db_session.commit()

        # Créer des tickets avec différents statuts
        ticket_opened = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.OPENED.value
        )
        ticket_closed = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.CLOSED.value
        )
        db_session.add(ticket_opened)
        db_session.add(ticket_closed)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint sans filtre
        response = client.get("/api/v1/reception/tickets")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier que les deux tickets sont retournés
        assert data["total"] == 2
        assert len(data["tickets"]) == 2
        
        # Vérifier que les tickets ont les bons statuts
        statuses = [ticket["status"] for ticket in data["tickets"]]
        assert "opened" in statuses
        assert "closed" in statuses

    def test_get_tickets_with_status_filter_opened(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne uniquement les tickets ouverts avec le filtre status=opened."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer un poste de réception
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status=PosteReceptionStatus.OPENED.value
        )
        db_session.add(poste)
        db_session.commit()

        # Créer des tickets avec différents statuts
        ticket_opened = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.OPENED.value
        )
        ticket_closed = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.CLOSED.value
        )
        db_session.add(ticket_opened)
        db_session.add(ticket_closed)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint avec filtre status=opened
        response = client.get("/api/v1/reception/tickets?status=opened")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier qu'un seul ticket est retourné
        assert data["total"] == 1
        assert len(data["tickets"]) == 1
        
        # Vérifier que le ticket retourné est bien ouvert
        ticket = data["tickets"][0]
        assert ticket["status"] == "opened"
        assert ticket["id"] == str(ticket_opened.id)

    def test_get_tickets_with_status_filter_closed(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne uniquement les tickets fermés avec le filtre status=closed."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer un poste de réception
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status=PosteReceptionStatus.OPENED.value
        )
        db_session.add(poste)
        db_session.commit()

        # Créer des tickets avec différents statuts
        ticket_opened = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.OPENED.value
        )
        ticket_closed = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.CLOSED.value
        )
        db_session.add(ticket_opened)
        db_session.add(ticket_closed)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint avec filtre status=closed
        response = client.get("/api/v1/reception/tickets?status=closed")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier qu'un seul ticket est retourné
        assert data["total"] == 1
        assert len(data["tickets"]) == 1
        
        # Vérifier que le ticket retourné est bien fermé
        ticket = data["tickets"][0]
        assert ticket["status"] == "closed"
        assert ticket["id"] == str(ticket_closed.id)

    def test_get_tickets_with_invalid_status_filter(self, client: TestClient, db_session: Session):
        """Test que l'endpoint retourne une liste vide avec un statut invalide."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer un poste de réception
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status=PosteReceptionStatus.OPENED.value
        )
        db_session.add(poste)
        db_session.commit()

        # Créer un ticket ouvert
        ticket_opened = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.OPENED.value
        )
        db_session.add(ticket_opened)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint avec un statut invalide
        response = client.get("/api/v1/reception/tickets?status=invalid_status")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier qu'aucun ticket n'est retourné
        assert data["total"] == 0
        assert len(data["tickets"]) == 0

    def test_get_tickets_requires_authentication(self, client: TestClient):
        """Test que l'endpoint nécessite une authentification."""
        response = client.get("/api/v1/reception/tickets")
        assert response.status_code == 401

    def test_get_tickets_with_pagination_and_status_filter(self, client: TestClient, db_session: Session):
        """Test que la pagination fonctionne correctement avec le filtre de statut."""
        # Créer un utilisateur de test
        user = User(
            id=uuid4(),
            username="test@example.com",
            hashed_password=hash_password("testpassword"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Créer un poste de réception
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status=PosteReceptionStatus.OPENED.value
        )
        db_session.add(poste)
        db_session.commit()

        # Créer plusieurs tickets ouverts
        for i in range(5):
            ticket = TicketDepot(
                id=uuid4(),
                poste_id=poste.id,
                benevole_user_id=user.id,
                status=TicketDepotStatus.OPENED.value
            )
            db_session.add(ticket)
        db_session.commit()

        # Authentifier l'utilisateur
        login_response = client.post("/api/v1/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        # Appeler l'endpoint avec pagination et filtre
        response = client.get("/api/v1/reception/tickets?status=opened&page=1&per_page=3")

        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier la pagination
        assert data["total"] == 5
        assert len(data["tickets"]) == 3
        assert data["page"] == 1
        assert data["per_page"] == 3
        assert data["total_pages"] == 2
        
        # Vérifier que tous les tickets retournés sont ouverts
        for ticket in data["tickets"]:
            assert ticket["status"] == "opened"
