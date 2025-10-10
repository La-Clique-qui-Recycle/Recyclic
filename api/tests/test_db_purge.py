"""
Tests pour l'endpoint de purge des données transactionnelles.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.reception_ticket import ReceptionTicket
from recyclic_api.models.reception_line import ReceptionLine
from recyclic_api.core.security import hash_password

client = TestClient(app)


@pytest.fixture
def super_admin_user(db_session: Session):
    """Créer un utilisateur Super-Admin pour les tests."""
    user = User(
        username="superadmin@test.com",
        hashed_password=hash_password("testpassword"),
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        first_name="Super",
        last_name="Admin"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def regular_admin_user(db_session: Session):
    """Créer un utilisateur Admin normal pour les tests."""
    user = User(
        username="admin@test.com",
        hashed_password=hash_password("testpassword"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        first_name="Regular",
        last_name="Admin"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def sample_transactional_data(db_session: Session):
    """Créer des données transactionnelles de test."""
    # Créer une session de caisse
    cash_session = CashSession(
        opening_amount=100.0,
        closing_amount=150.0,
        status="closed"
    )
    db_session.add(cash_session)
    db_session.flush()
    
    # Créer une vente
    sale = Sale(
        cash_session_id=cash_session.id,
        total_amount=50.0,
        payment_method="cash"
    )
    db_session.add(sale)
    db_session.flush()
    
    # Créer des lignes de vente
    sale_item = SaleItem(
        sale_id=sale.id,
        item_name="Test Item",
        quantity=1,
        unit_price=50.0,
        total_price=50.0
    )
    db_session.add(sale_item)
    
    # Créer un ticket de réception
    reception_ticket = ReceptionTicket(
        status="closed"
    )
    db_session.add(reception_ticket)
    db_session.flush()
    
    # Créer des lignes de réception
    reception_line = ReceptionLine(
        ticket_id=reception_ticket.id,
        category_id=1,
        weight_kg=2.5,
        destination="recycling"
    )
    db_session.add(reception_line)
    
    db_session.commit()
    
    return {
        "cash_session": cash_session,
        "sale": sale,
        "sale_item": sale_item,
        "reception_ticket": reception_ticket,
        "reception_line": reception_line
    }


class TestDatabasePurge:
    """Tests pour l'endpoint de purge des données transactionnelles."""
    
    def test_purge_requires_super_admin_role(self, db_session: Session, regular_admin_user: User):
        """Test que seuls les Super-Admins peuvent accéder à l'endpoint de purge."""
        # Créer un token pour un admin normal
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(regular_admin_user.id)})
        
        response = client.post(
            "/api/v1/admin/db/purge-transactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]
    
    def test_purge_requires_authentication(self):
        """Test que l'authentification est requise."""
        response = client.post("/api/v1/admin/db/purge-transactions")
        assert response.status_code == 401
    
    def test_purge_success_with_super_admin(self, db_session: Session, super_admin_user: User, sample_transactional_data):
        """Test que la purge fonctionne avec un Super-Admin."""
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(super_admin_user.id)})
        
        # Vérifier que les données existent avant la purge
        assert db_session.query(Sale).count() > 0
        assert db_session.query(SaleItem).count() > 0
        assert db_session.query(CashSession).count() > 0
        assert db_session.query(ReceptionTicket).count() > 0
        assert db_session.query(ReceptionLine).count() > 0
        
        response = client.post(
            "/api/v1/admin/db/purge-transactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier la structure de la réponse
        assert "message" in data
        assert "deleted_records" in data
        assert "timestamp" in data
        
        # Vérifier que les données ont été supprimées
        assert db_session.query(Sale).count() == 0
        assert db_session.query(SaleItem).count() == 0
        assert db_session.query(CashSession).count() == 0
        assert db_session.query(ReceptionTicket).count() == 0
        assert db_session.query(ReceptionLine).count() == 0
        
        # Vérifier que les utilisateurs n'ont pas été supprimés
        assert db_session.query(User).count() > 0
    
    def test_purge_preserves_configuration_tables(self, db_session: Session, super_admin_user: User):
        """Test que les tables de configuration ne sont pas affectées par la purge."""
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(super_admin_user.id)})
        
        # Compter les utilisateurs avant la purge
        user_count_before = db_session.query(User).count()
        
        response = client.post(
            "/api/v1/admin/db/purge-transactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        
        # Vérifier que les utilisateurs sont toujours là
        user_count_after = db_session.query(User).count()
        assert user_count_after == user_count_before
    
    def test_purge_handles_empty_database(self, db_session: Session, super_admin_user: User):
        """Test que la purge fonctionne même avec une base de données vide."""
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(super_admin_user.id)})
        
        response = client.post(
            "/api/v1/admin/db/purge-transactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier que tous les compteurs sont à 0
        for table, count in data["deleted_records"].items():
            assert count == 0
    
    def test_purge_transaction_rollback_on_error(self, db_session: Session, super_admin_user: User):
        """Test que la purge fait un rollback en cas d'erreur."""
        from recyclic_api.core.auth import create_access_token
        token = create_access_token(data={"sub": str(super_admin_user.id)})
        
        # Créer des données de test
        cash_session = CashSession(opening_amount=100.0, status="open")
        db_session.add(cash_session)
        db_session.commit()
        
        initial_count = db_session.query(CashSession).count()
        
        # Mocker une erreur SQL pour simuler un échec
        with patch.object(db_session, 'execute', side_effect=Exception("Database error")):
            response = client.post(
                "/api/v1/admin/db/purge-transactions",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert response.status_code == 500
            
            # Vérifier que les données sont toujours là (rollback effectué)
            final_count = db_session.query(CashSession).count()
            assert final_count == initial_count
