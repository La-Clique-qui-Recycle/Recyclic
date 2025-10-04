"""
Tests pour l'historique des tickets de réception.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from decimal import Decimal

from recyclic_api.main import app
from recyclic_api.models import TicketDepot, PosteReception, LigneDepot, Category, User, UserRole, UserStatus
from recyclic_api.models.ligne_depot import Destination


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(db_session):
    """Créer un utilisateur de test."""
    from recyclic_api.core.security import hash_password
    user = User(
        id=uuid4(),
        username="test_user@example.com",
        hashed_password=hash_password("testpassword"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session):
    """Créer un administrateur de test."""
    from recyclic_api.core.security import hash_password
    admin = User(
        id=uuid4(),
        username="admin@example.com",
        hashed_password=hash_password("adminpassword"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def test_poste(db_session, test_user):
    """Créer un poste de réception de test."""
    poste = PosteReception(
        id=uuid4(),
        opened_by_user_id=test_user.id,
        status="opened"
    )
    db_session.add(poste)
    db_session.commit()
    db_session.refresh(poste)
    return poste


@pytest.fixture
def test_category(db_session):
    """Créer une catégorie de test."""
    category_id = uuid4()
    category = Category(
        id=category_id,
        name=f"Test Category {category_id}",
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def test_tickets(db_session, test_poste, test_user, test_category):
    """Créer des tickets de test avec des lignes."""
    # Nettoyer d'abord les données existantes
    db_session.query(LigneDepot).delete()
    db_session.query(TicketDepot).delete()
    db_session.commit()
    
    tickets = []

    for i in range(3):
        ticket = TicketDepot(
            id=uuid4(),
            poste_id=test_poste.id,
            benevole_user_id=test_user.id,
            status="closed" if i > 0 else "opened"
        )
        db_session.add(ticket)
        db_session.flush()  # Pour obtenir l'ID
        
        # Ajouter des lignes au ticket
        for j in range(2):
            ligne = LigneDepot(
                id=uuid4(),
                ticket_id=ticket.id,
                category_id=test_category.id,
                poids_kg=Decimal('1.5'),
                destination=Destination.MAGASIN,
                notes=f"Note {i}-{j}"
            )
            db_session.add(ligne)
        
        tickets.append(ticket)
    
    db_session.commit()
    return tickets


def test_get_tickets_list_success(client, test_tickets, test_user):
    """Test de récupération de la liste des tickets avec succès."""
    # Créer un token pour l'utilisateur
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    response = client.get(
        "/api/v1/reception/tickets",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier la structure de la réponse
    assert "tickets" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert "total_pages" in data
    
    # Vérifier les données des tickets
    assert len(data["tickets"]) == 3
    assert data["total"] == 3
    
    # Vérifier la structure d'un ticket
    ticket = data["tickets"][0]
    assert "id" in ticket
    assert "poste_id" in ticket
    assert "benevole_username" in ticket
    assert "created_at" in ticket
    assert "status" in ticket
    assert "total_lignes" in ticket
    assert "total_poids" in ticket
    
    # Vérifier les totaux
    assert ticket["total_lignes"] == 2
    assert float(ticket["total_poids"]) == 3.0  # 2 lignes * 1.5 kg


def test_get_tickets_list_pagination(client, test_tickets, test_user):
    """Test de pagination de la liste des tickets."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    # Test avec pagination
    response = client.get(
        "/api/v1/reception/tickets?page=1&per_page=2",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["tickets"]) == 2
    assert data["page"] == 1
    assert data["per_page"] == 2
    assert data["total_pages"] == 2


def test_get_tickets_list_unauthorized(client):
    """Test d'accès non autorisé à la liste des tickets."""
    response = client.get("/api/v1/reception/tickets")
    assert response.status_code == 403  # FastAPI retourne 403 pour les routes protégées sans token


def test_get_ticket_detail_success(client, test_tickets, test_user):
    """Test de récupération des détails d'un ticket avec succès."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    ticket_id = str(test_tickets[0].id)
    response = client.get(
        f"/api/v1/reception/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier la structure de la réponse
    assert "id" in data
    assert "poste_id" in data
    assert "benevole_username" in data
    assert "created_at" in data
    assert "status" in data
    assert "lignes" in data
    
    # Vérifier les lignes
    assert len(data["lignes"]) == 2
    
    # Vérifier la structure d'une ligne
    ligne = data["lignes"][0]
    assert "id" in ligne
    assert "ticket_id" in ligne
    assert "category_id" in ligne
    assert "poids_kg" in ligne
    assert "destination" in ligne
    assert "notes" in ligne


def test_get_ticket_detail_not_found(client, test_user):
    """Test de récupération d'un ticket inexistant."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    fake_id = str(uuid4())
    response = client.get(
        f"/api/v1/reception/tickets/{fake_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
    assert "Ticket introuvable" in response.json()["detail"]


def test_get_ticket_detail_unauthorized(client, test_tickets):
    """Test d'accès non autorisé aux détails d'un ticket."""
    ticket_id = str(test_tickets[0].id)
    response = client.get(f"/api/v1/reception/tickets/{ticket_id}")
    assert response.status_code == 403  # FastAPI retourne 403 pour les routes protégées sans token


def test_get_tickets_list_admin_access(client, test_tickets, test_admin):
    """Test d'accès administrateur à la liste des tickets."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_admin.id)})
    
    response = client.get(
        "/api/v1/reception/tickets",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["tickets"]) == 3


def test_get_tickets_list_empty(client, test_user, db_session):
    """Test de récupération de la liste des tickets vide."""
    # Nettoyer d'abord les données existantes
    db_session.query(LigneDepot).delete()
    db_session.query(TicketDepot).delete()
    db_session.commit()
    
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})

    response = client.get(
        "/api/v1/reception/tickets",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["tickets"]) == 0
    assert data["total"] == 0


def test_get_tickets_list_validation_errors(client, test_user):
    """Test de validation des paramètres de pagination."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    # Test avec des paramètres invalides
    response = client.get(
        "/api/v1/reception/tickets?page=0&per_page=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 422  # Validation error


def test_get_tickets_list_large_per_page(client, test_user):
    """Test avec un nombre d'éléments par page trop élevé."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(test_user.id)})
    
    response = client.get(
        "/api/v1/reception/tickets?per_page=200",  # Limite à 100
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 422  # Validation error
