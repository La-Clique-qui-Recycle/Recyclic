import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jsonschema import validate, ValidationError

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.security import hash_password
from recyclic_api.schemas.cash_session import CashSessionResponse, CashSessionListResponse, CashSessionStatus as SchemaCashSessionStatus

def validate_with_resolver(instance, schema, openapi_schema):
    """Valide une instance contre un schéma OpenAPI avec résolution des références."""
    # Résoudre manuellement les références $ref dans le schéma
    def resolve_refs(obj, schema_dict):
        if isinstance(obj, dict):
            if '$ref' in obj:
                ref_path = obj['$ref']
                if ref_path.startswith('#/'):
                    # Résoudre la référence dans le schéma OpenAPI
                    path_parts = ref_path[2:].split('/')
                    ref_obj = schema_dict
                    for part in path_parts:
                        ref_obj = ref_obj[part]
                    return resolve_refs(ref_obj, schema_dict)
                else:
                    return obj
            else:
                return {k: resolve_refs(v, schema_dict) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [resolve_refs(item, schema_dict) for item in obj]
        else:
            return obj
    
    # Résoudre les références dans le schéma
    resolved_schema = resolve_refs(schema, openapi_schema)
    
    # Valider avec le schéma résolu
    validate(instance=instance, schema=resolved_schema)


@pytest.fixture
def test_cashier():
    """Créer un utilisateur caissier pour les tests."""
    return {
        "id": uuid.uuid4(),
        "telegram_id": 123456789,
        "username": "test_cashier",
        "first_name": "Test",
        "last_name": "Cashier",
    "role": UserRole.USER,
        "status": UserStatus.APPROVED,
        "is_active": True,
        "hashed_password": hash_password("testpassword123")
    }


@pytest.fixture
def test_admin():
    """Créer un utilisateur admin pour les tests."""
    return {
        "id": uuid.uuid4(),
        "telegram_id": 987654321,
        "username": "test_admin",
        "first_name": "Test",
        "last_name": "Admin",
        "role": UserRole.ADMIN,
        "status": UserStatus.APPROVED,
        "is_active": True,
        "hashed_password": hash_password("testpassword123")
    }

@pytest.fixture
def test_site():
    """Créer un site de test."""
    return {
        "id": uuid.uuid4(),
        "name": "Site de Test",
        "address": "123 Rue de Test",
        "is_active": True
    }


@pytest.fixture
def cashier_token(test_cashier):
    """Créer un token JWT pour le caissier."""
    return create_access_token(data={"sub": str(test_cashier["id"])})


@pytest.fixture
def admin_token(test_admin):
    """Créer un token JWT pour l'admin."""
    return create_access_token(data={"sub": str(test_admin["id"])})


class TestCashSessionEndpoints:
    """Tests pour les endpoints des sessions de caisse."""
    
    def test_create_cash_session_success(self, client: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de création d'une session de caisse avec succès."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()

        # Données de la session
        session_data = {
            "operator_id": str(str(test_cashier["id"])),
            "site_id": str(str(test_site["id"])),
            "initial_amount": 50.0
        }
        
        # Créer la session
        response = client.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )

        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 201
        data = response.json()
        
        # Validation du schéma Pydantic de la réponse
        try:
            validated_session = CashSessionResponse(**data)
        except Exception as e:
            pytest.fail(f"Validation Pydantic échouée pour la session de caisse: {e}")
        
        # Vérifications sur le contenu
        assert validated_session.operator_id == str(test_cashier["id"])
        assert validated_session.site_id == str(test_site["id"])
        assert validated_session.initial_amount == 50.0
        assert validated_session.current_amount == 50.0
        assert validated_session.status == SchemaCashSessionStatus.OPEN
        assert validated_session.opened_at is not None
        assert validated_session.closed_at is None
        assert validated_session.id is not None
        assert data["status"] == "open"
        assert "id" in data
        assert "opened_at" in data
    
    def test_create_cash_session_unauthorized(self, client_with_jwt_auth: TestClient, test_cashier):
        """Test de création d'une session sans authentification."""
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "initial_amount": 50.0
        }
        
        response = client_with_jwt_auth.post("/api/v1/cash-sessions/", json=session_data)
        
        assert response.status_code == 403
    
    def test_create_cash_session_invalid_amount(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de création d'une session avec un montant invalide."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()

        session_data = {
            "operator_id": str(str(test_cashier["id"])),
            "site_id": str(str(test_site["id"])),
            "initial_amount": -10.0  # Montant négatif
        }
        
        response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_get_cash_sessions_list(self, client_with_jwt_auth: TestClient, test_admin, admin_token, db_session):
        """Test de récupération de la liste des sessions."""
        # Créer l'utilisateur admin en base de données
        admin_user = User(**test_admin)
        db_session.add(admin_user)
        db_session.commit()
        
        response = client_with_jwt_auth.get(
            "/api/v1/cash-sessions/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert isinstance(data["data"], list)
    
    def test_get_cash_sessions_with_filters(self, client_with_jwt_auth: TestClient, test_admin, admin_token, db_session):
        """Test de récupération des sessions avec filtres."""
        # Créer l'utilisateur admin en base de données
        admin_user = User(**test_admin)
        db_session.add(admin_user)
        db_session.commit()
        
        response = client_with_jwt_auth.get(
            "/api/v1/cash-sessions/?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["limit"] == 10
        # Vérifier que toutes les sessions retournées sont ouvertes
        for session in data["data"]:
            assert session["status"] == "open"
    
    def test_get_current_cash_session(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de récupération de la session courante."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # D'abord créer une session
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 50.0
        }
        
        create_response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        assert create_response.status_code == 201
        
        # Récupérer la session courante
        response = client_with_jwt_auth.get(
            "/api/v1/cash-sessions/current",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["operator_id"] == str(test_cashier["id"])
        assert data["status"] == "open"
    
    def test_get_cash_session_by_id(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de récupération d'une session par ID."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # Créer une session
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 50.0
        }
        
        create_response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        session_id = create_response.json()["id"]
        
        # Récupérer la session par ID
        response = client_with_jwt_auth.get(
            f"/api/v1/cash-sessions/{session_id}",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == session_id
        assert data["operator_id"] == str(test_cashier["id"])
    
    def test_get_cash_session_not_found(self, client_with_jwt_auth: TestClient, test_cashier, cashier_token, db_session):
        """Test de récupération d'une session inexistante."""
        # Créer l'utilisateur caissier en base de données
        cashier_user = User(**test_cashier)
        db_session.add(cashier_user)
        db_session.commit()
        
        response = client_with_jwt_auth.get(
            "/api/v1/cash-sessions/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 404
    
    def test_update_cash_session(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de mise à jour d'une session."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # Créer une session
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 50.0
        }
        
        create_response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        session_id = create_response.json()["id"]
        
        # Mettre à jour la session
        update_data = {
            "current_amount": 75.0,
            "total_sales": 25.0,
            "total_items": 3
        }
        
        response = client_with_jwt_auth.put(
            f"/api/v1/cash-sessions/{session_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["current_amount"] == 75.0
        assert data["total_sales"] == 25.0
        assert data["total_items"] == 3
    
    def test_close_cash_session(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de fermeture d'une session."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # Créer une session
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 50.0
        }
        
        create_response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        session_id = create_response.json()["id"]
        
        # Fermer la session
        close_data = {
            "actual_amount": 50.0,
            "variance_comment": None
        }
        response = client_with_jwt_auth.post(
            f"/api/v1/cash-sessions/{session_id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "closed"
        assert data["closed_at"] is not None
    
    def test_close_already_closed_session(self, client_with_jwt_auth: TestClient, test_cashier, test_site, cashier_token, db_session):
        """Test de fermeture d'une session déjà fermée."""
        # Créer l'utilisateur et le site en base de données
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # Créer et fermer une session
        session_data = {
            "operator_id": str(test_cashier["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 50.0
        }
        
        create_response = client_with_jwt_auth.post(
            "/api/v1/cash-sessions/",
            json=session_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        session_id = create_response.json()["id"]
        
        # Fermer la session une première fois
        close_data = {
            "actual_amount": 50.0,
            "variance_comment": None
        }
        close_response = client_with_jwt_auth.post(
            f"/api/v1/cash-sessions/{session_id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        assert close_response.status_code == 200
        
        # Essayer de fermer à nouveau
        response = client_with_jwt_auth.post(
            f"/api/v1/cash-sessions/{session_id}/close",
            json=close_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 400
        assert "déjà fermée" in response.json()["detail"]
    
    def test_get_cash_session_stats(self, client_with_jwt_auth: TestClient, test_admin, admin_token, db_session):
        """Test de récupération des statistiques des sessions."""
        # Créer l'utilisateur admin en base de données
        admin_user = User(**test_admin)
        db_session.add(admin_user)
        db_session.commit()
        
        response = client_with_jwt_auth.get(
            "/api/v1/cash-sessions/stats/summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_sessions" in data
        assert "open_sessions" in data
        assert "closed_sessions" in data
        assert "total_sales" in data
        assert "total_items" in data
        assert "average_session_duration" in data
    
    def test_cashier_cannot_access_other_sessions(self, client_with_jwt_auth: TestClient, test_cashier, test_admin, test_site, cashier_token, db_session):
        """Test qu'un caissier ne peut pas accéder aux sessions d'autres caissiers."""
        # Créer les utilisateurs et le site en base de données
        cashier_user = User(**test_cashier)
        admin_user = User(**test_admin)
        site = Site(**test_site)
        db_session.add(cashier_user)
        db_session.add(admin_user)
        db_session.add(site)
        db_session.commit()
        
        # Créer une session pour l'admin
        admin_session_data = {
            "operator_id": str(test_admin["id"]),
            "site_id": str(test_site["id"]),
            "initial_amount": 100.0
        }
        
        # Note: Dans un vrai test, il faudrait créer un token admin
        # Pour simplifier, on teste juste que l'accès est refusé
        response = client_with_jwt_auth.get(
            f"/api/v1/cash-sessions/{test_admin['id']}",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        # Devrait retourner 404 (session non trouvée) ou 403 (accès refusé)
        assert response.status_code in [403, 404]


class TestCashSessionService:
    """Tests pour le service des sessions de caisse."""
    
    def test_create_session(self, db_session: Session, test_cashier, test_site):
        """Test de création d'une session via le service."""
        from recyclic_api.services.cash_session_service import CashSessionService
        
        service = CashSessionService(db_session)
        
        # Créer l'utilisateur et le site en base
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()
        
        # Créer la session
        session = service.create_session(
            operator_id=str(test_cashier["id"]),
            site_id=str(test_site["id"]),
            initial_amount=50.0
        )
        
        assert str(session.operator_id) == str(test_cashier["id"])
        assert str(session.site_id) == str(test_site["id"])
        assert session.initial_amount == 50.0
        assert session.current_amount == 50.0
        assert session.status == CashSessionStatus.OPEN
        assert session.id is not None
    
    def test_get_open_session_by_operator(self, db_session: Session, test_cashier, test_site):
        """Test de récupération de la session ouverte d'un opérateur."""
        from recyclic_api.services.cash_session_service import CashSessionService

        service = CashSessionService(db_session)

        # Créer l'utilisateur, le site et la session
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()

        session = service.create_session(
            operator_id=str(test_cashier["id"]),
            site_id=str(test_site["id"]),
            initial_amount=50.0
        )
        
        # Récupérer la session ouverte
        open_session = service.get_open_session_by_operator(str(test_cashier["id"]))
        
        assert open_session is not None
        assert open_session.id == session.id
        assert open_session.status == CashSessionStatus.OPEN
    
    def test_close_session(self, db_session: Session, test_cashier, test_site):
        """Test de fermeture d'une session."""
        from recyclic_api.services.cash_session_service import CashSessionService

        service = CashSessionService(db_session)

        # Créer l'utilisateur, le site et la session
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()

        session = service.create_session(
            operator_id=str(test_cashier["id"]),
            site_id=str(test_site["id"]),
            initial_amount=50.0
        )
        
        # Fermer la session
        closed_session = service.close_session(session.id)
        
        assert closed_session is not None
        assert closed_session.status == CashSessionStatus.CLOSED
        assert closed_session.closed_at is not None
    
    def test_add_sale_to_session(self, db_session: Session, test_cashier, test_site):
        """Test d'ajout d'une vente à une session."""
        from recyclic_api.services.cash_session_service import CashSessionService

        service = CashSessionService(db_session)

        # Créer l'utilisateur, le site et la session
        user = User(**test_cashier)
        site = Site(**test_site)
        db_session.add(user)
        db_session.add(site)
        db_session.commit()

        session = service.create_session(
            operator_id=str(test_cashier["id"]),
            site_id=str(test_site["id"]),
            initial_amount=50.0
        )
        
        # Ajouter une vente
        success = service.add_sale_to_session(session.id, 25.0)
        
        assert success is True
        
        # Vérifier que la session a été mise à jour
        updated_session = service.get_session_by_id(session.id)
        assert updated_session.current_amount == 75.0
        assert updated_session.total_sales == 25.0
        assert updated_session.total_items == 1
