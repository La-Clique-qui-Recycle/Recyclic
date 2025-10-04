"""
Tests pour les endpoints de rapports de réception.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date, timedelta
from uuid import uuid4

from recyclic_api.main import app
from recyclic_api.models import User, UserRole, UserStatus, PosteReception, TicketDepot, LigneDepot, Category
from recyclic_api.models.ligne_depot import Destination


@pytest.fixture
def admin_user(db_session: Session):
    """Créer un utilisateur administrateur pour les tests."""
    user = User(
        id=uuid4(),
        username="admin@test.com",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_user(db_session: Session):
    """Créer un utilisateur super admin pour les tests."""
    user = User(
        id=uuid4(),
        username="superadmin@test.com",
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session: Session):
    """Créer un utilisateur normal pour les tests."""
    user = User(
        id=uuid4(),
        username="user@test.com",
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def category(db_session: Session):
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
def test_data(db_session: Session, admin_user: User, category: Category):
    """Créer des données de test pour les rapports."""
    # Nettoyer d'abord les données existantes pour isoler les tests
    db_session.query(LigneDepot).delete()
    db_session.query(TicketDepot).delete()
    db_session.query(PosteReception).delete()
    db_session.commit()
    
    # Créer un poste de réception
    poste = PosteReception(
        id=uuid4(),
        opened_by_user_id=admin_user.id,
        status="opened"
    )
    db_session.add(poste)
    db_session.commit()
    db_session.refresh(poste)

    # Créer des tickets avec des dates différentes
    base_date = datetime.now() - timedelta(days=5)
    
    tickets = []
    for i in range(3):
        ticket = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=admin_user.id,
            status="closed",
            created_at=base_date + timedelta(days=i),
            closed_at=base_date + timedelta(days=i, hours=1)
        )
        db_session.add(ticket)
        tickets.append(ticket)
    
    db_session.commit()
    for ticket in tickets:
        db_session.refresh(ticket)

    # Créer des lignes de dépôt
    lignes = []
    for i, ticket in enumerate(tickets):
        ligne = LigneDepot(
            id=uuid4(),
            ticket_id=ticket.id,
            category_id=category.id,
            poids_kg=Decimal(f"{10.5 + i}"),
            destination=Destination.MAGASIN,
            notes=f"Test note {i}"
        )
        db_session.add(ligne)
        lignes.append(ligne)
    
    db_session.commit()
    for ligne in lignes:
        db_session.refresh(ligne)

    return {
        "poste": poste,
        "tickets": tickets,
        "lignes": lignes,
        "category": category
    }


def create_auth_headers(user_id: str) -> dict:
    """Créer les headers d'authentification pour un utilisateur."""
    from recyclic_api.core.security import create_access_token
    token = create_access_token(data={"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


class TestReceptionLignesEndpoint:
    """Tests pour l'endpoint GET /api/v1/reception/lignes."""

    def test_get_lignes_requires_admin_role(self, client: TestClient, regular_user: User):
        """Test que l'endpoint nécessite un rôle admin."""
        headers = create_auth_headers(regular_user.id)
        response = client.get("/api/v1/reception/lignes", headers=headers)
        assert response.status_code == 403

    def test_get_lignes_success_admin(self, client: TestClient, admin_user: User, test_data: dict):
        """Test de récupération réussie des lignes avec un admin."""
        headers = create_auth_headers(admin_user.id)
        response = client.get("/api/v1/reception/lignes", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "lignes" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "total_pages" in data
        
        assert len(data["lignes"]) == 3
        assert data["total"] == 3
        assert data["page"] == 1
        assert data["per_page"] == 50

    def test_get_lignes_success_super_admin(self, client: TestClient, super_admin_user: User, test_data: dict):
        """Test de récupération réussie des lignes avec un super admin."""
        headers = create_auth_headers(super_admin_user.id)
        response = client.get("/api/v1/reception/lignes", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["lignes"]) == 3

    def test_get_lignes_pagination(self, client: TestClient, admin_user: User, test_data: dict):
        """Test de la pagination."""
        headers = create_auth_headers(admin_user.id)
        response = client.get("/api/v1/reception/lignes?page=1&per_page=2", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["lignes"]) == 2
        assert data["page"] == 1
        assert data["per_page"] == 2
        assert data["total_pages"] == 2

    def test_get_lignes_filter_by_date(self, client: TestClient, admin_user: User, test_data: dict):
        """Test du filtrage par date."""
        headers = create_auth_headers(admin_user.id)
        
        # Filtrer par date de début (il y a 3 jours, donc devrait inclure les 2 derniers tickets)
        start_date = (datetime.now() - timedelta(days=3)).date()
        response = client.get(
            f"/api/v1/reception/lignes?start_date={start_date}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Devrait retourner au moins 1 ligne (les 2 derniers tickets créés)
        assert len(data["lignes"]) >= 1

    def test_get_lignes_filter_by_category(self, client: TestClient, admin_user: User, test_data: dict):
        """Test du filtrage par catégorie."""
        headers = create_auth_headers(admin_user.id)
        category_id = str(test_data["category"].id)
        
        response = client.get(
            f"/api/v1/reception/lignes?category_id={category_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["lignes"]) == 3
        
        # Vérifier que toutes les lignes ont la bonne catégorie
        for ligne in data["lignes"]:
            assert ligne["category_label"].startswith("Test Category")

    def test_get_lignes_invalid_category_id(self, client: TestClient, admin_user: User):
        """Test avec un ID de catégorie invalide."""
        headers = create_auth_headers(admin_user.id)
        response = client.get(
            "/api/v1/reception/lignes?category_id=invalid-uuid",
            headers=headers
        )
        
        assert response.status_code == 400

    def test_get_lignes_structure(self, client: TestClient, admin_user: User, test_data: dict):
        """Test de la structure de la réponse."""
        headers = create_auth_headers(admin_user.id)
        response = client.get("/api/v1/reception/lignes", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        ligne = data["lignes"][0]
        required_fields = [
            "id", "ticket_id", "poste_id", "benevole_username",
            "category_label", "poids_kg", "destination", "notes", "created_at"
        ]
        
        for field in required_fields:
            assert field in ligne


class TestReceptionLignesExportCSVEndpoint:
    """Tests pour l'endpoint GET /api/v1/reception/lignes/export-csv."""

    def test_export_csv_requires_admin_role(self, client: TestClient, regular_user: User):
        """Test que l'endpoint nécessite un rôle admin."""
        headers = create_auth_headers(regular_user.id)
        response = client.get("/api/v1/reception/lignes/export-csv", headers=headers)
        assert response.status_code == 403

    def test_export_csv_success(self, client: TestClient, admin_user: User, test_data: dict):
        """Test d'export CSV réussi."""
        headers = create_auth_headers(admin_user.id)
        response = client.get("/api/v1/reception/lignes/export-csv", headers=headers)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]
        
        # Vérifier le contenu CSV
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Vérifier l'en-tête
        header = lines[0]
        expected_headers = [
            "ID Ligne", "ID Ticket", "ID Poste", "Bénévole",
            "Catégorie", "Poids (kg)", "Destination", "Notes", "Date de création"
        ]
        for expected_header in expected_headers:
            assert expected_header in header
        
        # Vérifier qu'il y a des données (en-tête + 3 lignes)
        assert len(lines) == 4

    def test_export_csv_with_filters(self, client: TestClient, admin_user: User, test_data: dict):
        """Test d'export CSV avec filtres."""
        headers = create_auth_headers(admin_user.id)
        category_id = str(test_data["category"].id)
        
        response = client.get(
            f"/api/v1/reception/lignes/export-csv?category_id={category_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Devrait toujours avoir l'en-tête + les données filtrées
        assert len(lines) >= 2

    def test_export_csv_filename_generation(self, client: TestClient, admin_user: User, test_data: dict):
        """Test de génération du nom de fichier."""
        headers = create_auth_headers(admin_user.id)
        start_date = "2024-01-01"
        end_date = "2024-01-31"
        category_id = str(test_data["category"].id)
        
        response = client.get(
            f"/api/v1/reception/lignes/export-csv?start_date={start_date}&end_date={end_date}&category_id={category_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        content_disposition = response.headers["content-disposition"]
        
        # Vérifier que le nom de fichier contient les filtres
        assert "rapport_reception" in content_disposition
        assert "depuis_2024-01-01" in content_disposition
        assert "jusqu_2024-01-31" in content_disposition
        assert "categorie_" in content_disposition


class TestReceptionLignesIntegration:
    """Tests d'intégration pour les endpoints de rapports."""

    def test_full_workflow(self, client: TestClient, admin_user: User, test_data: dict):
        """Test du workflow complet : récupération + export."""
        headers = create_auth_headers(admin_user.id)
        
        # 1. Récupérer les lignes
        response = client.get("/api/v1/reception/lignes", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["lignes"]) == 3
        
        # 2. Exporter en CSV
        response = client.get("/api/v1/reception/lignes/export-csv", headers=headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        
        # 3. Vérifier la cohérence des données
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # En-tête + 3 lignes de données
        assert len(lines) == 4
        
        # Vérifier que les données correspondent
        for i, ligne_data in enumerate(data["lignes"]):
            csv_line = lines[i + 1]  # +1 pour skip l'en-tête
            assert str(ligne_data["id"]) in csv_line
            assert ligne_data["benevole_username"] in csv_line
            assert ligne_data["category_label"] in csv_line
