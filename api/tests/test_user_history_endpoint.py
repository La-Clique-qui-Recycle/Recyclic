"""
Tests d'intégration pour l'endpoint d'historique utilisateur
Story 5.4.2 - Backend - API de l'Historique Utilisateur
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.sale import Sale
from recyclic_api.models.deposit import Deposit, DepositStatus, EEECategory
from recyclic_api.models.site import Site
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.security import hash_password


@pytest.fixture
def test_admin_user(db_session: Session):
    """Créer un utilisateur administrateur pour les tests"""
    admin_user = User(
        id=uuid.uuid4(),
        telegram_id=123456789,
        username="admin_test",
        hashed_password=hash_password("admin"),
        first_name="Admin",
        last_name="Test",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    return admin_user


@pytest.fixture
def test_user(db_session: Session):
    """Créer un utilisateur de test pour l'historique"""
    user = User(
        id=uuid.uuid4(),
        telegram_id=987654321,
        username="test_user",
        hashed_password=hash_password("userpwd"),
        first_name="Test",
        last_name="User",
    role=UserRole.USER,
        status=UserStatus.APPROVED,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_site(db_session: Session):
    """Créer un site de test"""
    site = Site(
        id=uuid.uuid4(),
        name="Site Test",
        address="123 Test Street",
        is_active=True
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site


@pytest.fixture
def admin_token(test_admin_user: User):
    """Créer un token JWT pour l'administrateur"""
    return create_access_token(data={"sub": str(test_admin_user.id)})


@pytest.fixture
def sample_user_history_data(db_session: Session, test_user: User, test_admin_user: User, test_site: Site):
    """Créer des données d'historique pour les tests"""
    
    # 1. Événement d'administration - Changement de statut
    status_history = UserStatusHistory(
        id=uuid.uuid4(),
        user_id=test_user.id,
        changed_by_admin_id=test_admin_user.id,
        old_status=False,
        new_status=True,
        change_date=datetime.utcnow() - timedelta(days=5),
        reason="Activation du compte"
    )
    db_session.add(status_history)
    
    # 2. Session de caisse ouverte
    cash_session = CashSession(
        id=uuid.uuid4(),
        operator_id=test_user.id,
        site_id=test_site.id,
        initial_amount=100.0,
        current_amount=100.0,
        status=CashSessionStatus.OPEN,
        opened_at=datetime.utcnow() - timedelta(days=3),
        total_sales=0.0,
        total_items=0
    )
    db_session.add(cash_session)
    db_session.commit()
    db_session.refresh(cash_session)
    
    # 3. Vente dans la session
    sale = Sale(
        id=uuid.uuid4(),
        cash_session_id=cash_session.id,
        total_amount=25.50,
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db_session.add(sale)
    
    # 4. Dépôt d'objet
    deposit = Deposit(
        id=uuid.uuid4(),
        user_id=test_user.id,
        site_id=test_site.id,
        status=DepositStatus.COMPLETED,
        category=EEECategory.IT_EQUIPMENT,
        eee_category=EEECategory.IT_EQUIPMENT,
        weight=2.5,
        description="Ordinateur portable",
        confidence_score=0.95,
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db_session.add(deposit)
    
    # 5. Fermeture de session de caisse
    cash_session.status = CashSessionStatus.CLOSED
    cash_session.closed_at = datetime.utcnow() - timedelta(hours=12)
    cash_session.total_sales = 25.50
    cash_session.total_items = 1
    cash_session.current_amount = 125.50
    
    db_session.commit()
    
    return {
        "user": test_user,
        "admin": test_admin_user,
        "site": test_site,
        "status_history": status_history,
        "cash_session": cash_session,
        "sale": sale,
        "deposit": deposit
    }


class TestUserHistoryEndpoint:
    """Tests pour l'endpoint GET /api/v1/admin/users/{user_id}/history"""
    
    def test_get_user_history_success(self, client: TestClient, admin_token: str, sample_user_history_data: dict):
        """Test de récupération réussie de l'historique utilisateur"""
        user_id = str(sample_user_history_data["user"].id)
        
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier la structure de la réponse
        assert "user_id" in data
        assert "events" in data
        assert "total_count" in data
        assert "page" in data
        assert "limit" in data
        assert "has_next" in data
        assert "has_prev" in data
        
        # Vérifier que tous les événements sont présents
        assert data["total_count"] == 5  # 1 admin + 2 cash session + 1 sale + 1 deposit
        assert len(data["events"]) == 5
        
        # Vérifier les types d'événements
        event_types = [event["event_type"] for event in data["events"]]
        assert "ADMINISTRATION" in event_types
        assert "SESSION CAISSE" in event_types
        assert "VENTE" in event_types
        assert "DEPOT" in event_types
        
        # Vérifier que les événements sont triés par date (plus récent en premier)
        dates = [datetime.fromisoformat(event["date"].replace("Z", "+00:00")) for event in data["events"]]
        assert dates == sorted(dates, reverse=True)
    
    def test_get_user_history_with_filters(self, client: TestClient, admin_token: str, sample_user_history_data: dict):
        """Test des filtres de l'historique utilisateur"""
        user_id = str(sample_user_history_data["user"].id)
        
        # Test filtre par type d'événement
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            params={"event_type": "ADMINISTRATION"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 1
        assert len(data["events"]) == 1
        assert data["events"][0]["event_type"] == "ADMINISTRATION"
        
        # Test filtre par date
        date_from = (datetime.utcnow() - timedelta(days=2)).isoformat()
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            params={"date_from": date_from},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Devrait inclure les événements des 2 derniers jours
        assert data["total_count"] >= 2
    
    def test_get_user_history_pagination(self, client: TestClient, admin_token: str, sample_user_history_data: dict):
        """Test de la pagination de l'historique utilisateur"""
        user_id = str(sample_user_history_data["user"].id)
        
        # Test première page
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            params={"limit": 2, "skip": 0},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["events"]) == 2
        assert data["page"] == 1
        assert data["limit"] == 2
        assert data["has_next"] is True
        assert data["has_prev"] is False
        
        # Test deuxième page
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            params={"limit": 2, "skip": 2},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["events"]) == 2
        assert data["page"] == 2
        assert data["has_prev"] is True
    
    def test_get_user_history_user_not_found(self, client: TestClient, admin_token: str):
        """Test avec un utilisateur inexistant"""
        fake_user_id = str(uuid.uuid4())
        
        response = client.get(
            f"/api/v1/admin/users/{fake_user_id}/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "Utilisateur avec l'ID" in data["detail"]
    
    def test_get_user_history_unauthorized(self, client: TestClient, sample_user_history_data: dict):
        """Test sans authentification"""
        user_id = str(sample_user_history_data["user"].id)
        
        response = client.get(f"/api/v1/admin/users/{user_id}/history")
        
        assert response.status_code == 401
    
    def test_get_user_history_invalid_user_id(self, client: TestClient, admin_token: str):
        """Test avec un ID utilisateur invalide"""
        response = client.get(
            "/api/v1/admin/users/invalid-uuid/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404
    
    def test_get_user_history_empty_history(self, client: TestClient, admin_token: str, test_user: User):
        """Test avec un utilisateur sans historique"""
        user_id = str(test_user.id)
        
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert len(data["events"]) == 0
        assert data["has_next"] is False
        assert data["has_prev"] is False
    
    def test_get_user_history_event_metadata(self, client: TestClient, admin_token: str, sample_user_history_data: dict):
        """Test des métadonnées des événements"""
        user_id = str(sample_user_history_data["user"].id)
        
        response = client.get(
            f"/api/v1/admin/users/{user_id}/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Vérifier les métadonnées des différents types d'événements
        for event in data["events"]:
            assert "metadata" in event
            metadata = event["metadata"]
            
            if event["event_type"] == "ADMINISTRATION":
                assert "old_status" in metadata
                assert "new_status" in metadata
                assert "reason" in metadata
                assert "changed_by_admin_id" in metadata
            
            elif event["event_type"] == "SESSION CAISSE":
                assert "session_id" in metadata
                assert "status" in metadata
                assert "initial_amount" in metadata
            
            elif event["event_type"] == "VENTE":
                assert "sale_id" in metadata
                assert "total_amount" in metadata
                assert "cash_session_id" in metadata
            
            elif event["event_type"] == "DEPOT":
                assert "deposit_id" in metadata
                assert "status" in metadata
                assert "category" in metadata or "eee_category" in metadata
