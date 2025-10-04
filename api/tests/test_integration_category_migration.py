"""
Tests d'intégration pour la migration vers le nouveau système de catégories.
"""
import pytest
from sqlalchemy.orm import Session
from uuid import uuid4
from decimal import Decimal

from recyclic_api.models import Category, LigneDepot, TicketDepot, PosteReception, User, UserRole, UserStatus
from recyclic_api.models.ligne_depot import Destination
from recyclic_api.services.reception_service import ReceptionService
from recyclic_api.services.stats_service import StatsService


class TestCategoryMigrationIntegration:
    """Tests d'intégration pour valider la migration vers le nouveau système de catégories."""

    def test_reception_service_uses_new_categories(self, db_session: Session):
        """Test que ReceptionService utilise correctement le nouveau système de catégories."""
        # Créer une catégorie
        category = Category(
            id=uuid4(),
            name="Test Integration Category",
            is_active=True
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)

        # Créer un utilisateur
        user = User(
            id=uuid4(),
            username="test@integration.com",
            hashed_password="hashed",
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Créer un poste
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status="opened"
        )
        db_session.add(poste)
        db_session.commit()
        db_session.refresh(poste)

        # Créer un ticket
        ticket = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status="opened"
        )
        db_session.add(ticket)
        db_session.commit()
        db_session.refresh(ticket)

        # Test ReceptionService
        service = ReceptionService(db_session)
        
        # Créer une ligne avec la nouvelle catégorie
        ligne = service.create_ligne(
            ticket_id=ticket.id,
            category_id=category.id,
            poids_kg=Decimal("10.5"),
            destination="MAGASIN",
            notes="Test integration"
        )

        # Vérifier que la ligne est créée avec la bonne catégorie
        assert ligne.category_id == category.id
        assert ligne.category.name == "Test Integration Category"
        assert ligne.poids_kg == Decimal("10.5")

    def test_stats_service_uses_new_categories(self, db_session: Session):
        """Test que StatsService utilise correctement le nouveau système de catégories."""
        # Nettoyer d'abord les données existantes
        db_session.query(LigneDepot).delete()
        db_session.query(TicketDepot).delete()
        db_session.query(PosteReception).delete()
        db_session.query(User).filter(User.username.like("%@integration.com")).delete()
        db_session.query(Category).filter(Category.name.like("Stats Category%")).delete()
        db_session.commit()
        
        # Créer des catégories
        categories = []
        for i in range(3):
            category = Category(
                id=uuid4(),
                name=f"Stats Category {i}",
                is_active=True
            )
            db_session.add(category)
            categories.append(category)
        db_session.commit()

        # Créer un utilisateur
        user = User(
            id=uuid4(),
            username="stats@integration.com",
            hashed_password="hashed",
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Créer un poste
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status="opened"
        )
        db_session.add(poste)
        db_session.commit()
        db_session.refresh(poste)

        # Créer des tickets et lignes avec différentes catégories
        for i, category in enumerate(categories):
            ticket = TicketDepot(
                id=uuid4(),
                poste_id=poste.id,
                benevole_user_id=user.id,
                status="closed"
            )
            db_session.add(ticket)
            db_session.commit()
            db_session.refresh(ticket)

            # Créer des lignes pour chaque catégorie
            for j in range(2):
                ligne = LigneDepot(
                    id=uuid4(),
                    ticket_id=ticket.id,
                    category_id=category.id,
                    poids_kg=Decimal(f"{10.0 + i + j}"),
                    destination=Destination.MAGASIN,
                    notes=f"Test stats {i}-{j}"
                )
                db_session.add(ligne)
        db_session.commit()

        # Test StatsService
        stats_service = StatsService(db_session)
        
        # Test get_reception_summary
        summary = stats_service.get_reception_summary()
        assert summary.total_items == 6  # 3 catégories * 2 lignes
        assert summary.total_weight > 0

        # Test get_reception_by_category
        category_stats = stats_service.get_reception_by_category()
        assert len(category_stats) == 3  # 3 catégories
        
        # Vérifier que les noms des catégories sont corrects
        category_names = [stat.category_name for stat in category_stats]
        assert "Stats Category 0" in category_names
        assert "Stats Category 1" in category_names
        assert "Stats Category 2" in category_names

    def test_api_endpoints_use_new_categories(self, admin_client, db_session: Session):
        """Test que les endpoints API utilisent correctement le nouveau système de catégories."""
        # Créer une catégorie
        category = Category(
            id=uuid4(),
            name="API Test Category",
            is_active=True
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)

        # Créer un poste via API
        response = admin_client.post("/api/v1/reception/postes/open")
        assert response.status_code == 200
        poste_id = response.json()["id"]

        # Créer un ticket via API
        response = admin_client.post("/api/v1/reception/tickets", json={"poste_id": poste_id})
        assert response.status_code == 200
        ticket_id = response.json()["id"]

        # Test création de ligne via API
        response = admin_client.post(
            "/api/v1/reception/lignes",
            json={
                "ticket_id": ticket_id,
                "category_id": str(category.id),
                "poids_kg": "15.5",
                "destination": "MAGASIN",
                "notes": "API test"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["category_id"] == str(category.id)
        assert data["category_label"] == "API Test Category"
        assert data["poids_kg"] == "15.500"

        # Test récupération des catégories via API
        response = admin_client.get("/api/v1/reception/categories")
        assert response.status_code == 200
        categories_data = response.json()
        assert len(categories_data) >= 1
        
        # Vérifier que notre catégorie est dans la liste
        category_found = any(cat["name"] == "API Test Category" for cat in categories_data)
        assert category_found

    def test_data_consistency_after_migration(self, db_session: Session):
        """Test que les données restent cohérentes après la migration."""
        # Nettoyer d'abord les données existantes
        db_session.query(LigneDepot).delete()
        db_session.query(TicketDepot).delete()
        db_session.query(PosteReception).delete()
        db_session.query(User).filter(User.username.like("%@test.com")).delete()
        db_session.query(Category).filter(Category.name.like("Consistency Test%")).delete()
        db_session.commit()
        
        # Créer une catégorie
        category = Category(
            id=uuid4(),
            name="Consistency Test Category",
            is_active=True
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)

        # Créer un utilisateur
        user = User(
            id=uuid4(),
            username="consistency@test.com",
            hashed_password="hashed",
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Créer un poste
        poste = PosteReception(
            id=uuid4(),
            opened_by_user_id=user.id,
            status="opened"
        )
        db_session.add(poste)
        db_session.commit()
        db_session.refresh(poste)

        # Créer un ticket
        ticket = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status="closed"
        )
        db_session.add(ticket)
        db_session.commit()
        db_session.refresh(ticket)

        # Créer plusieurs lignes avec la même catégorie
        total_weight = Decimal("0")
        for i in range(5):
            weight = Decimal(f"{5.0 + i}")
            total_weight += weight
            
            ligne = LigneDepot(
                id=uuid4(),
                ticket_id=ticket.id,
                category_id=category.id,
                poids_kg=weight,
                destination=Destination.MAGASIN,
                notes=f"Consistency test {i}"
            )
            db_session.add(ligne)
        db_session.commit()

        # Vérifier la cohérence des données
        stats_service = StatsService(db_session)
        
        # Test summary
        summary = stats_service.get_reception_summary()
        assert summary.total_items == 5
        assert summary.total_weight == total_weight

        # Test by category
        category_stats = stats_service.get_reception_by_category()
        assert len(category_stats) == 1
        assert category_stats[0].category_name == "Consistency Test Category"
        assert category_stats[0].total_items == 5
        assert category_stats[0].total_weight == total_weight

        # Vérifier que la relation fonctionne dans l'autre sens
        lignes = db_session.query(LigneDepot).filter(LigneDepot.category_id == category.id).all()
        assert len(lignes) == 5
        for ligne in lignes:
            assert ligne.category.name == "Consistency Test Category"
