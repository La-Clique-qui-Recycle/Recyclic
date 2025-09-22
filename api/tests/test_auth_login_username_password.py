"""
Tests for the updated username/password authentication endpoint
Story auth.B - Backend CLI adaptation
"""

import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from jsonschema import validate, ValidationError

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password

OPENAPI_SCHEMA_PATH = Path(__file__).parent.parent / "openapi.json"

@pytest.fixture
def openapi_schema():
    """Charge le schéma OpenAPI depuis le fichier openapi.json."""
    with open(OPENAPI_SCHEMA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

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


class TestAuthLoginUsernamePassword:
    """Tests for the POST /api/v1/auth/login endpoint with username/password"""

    def test_login_success_valid_credentials(self, client: TestClient, db_session: Session, openapi_schema):
        """Test successful login with valid username and password"""
        # Create a fresh client for this test to avoid rate limiting conflicts        
        # Create test user with hashed password
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="testuser1",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Test login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser1",
                "password": "testpassword123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        
        # Validation du schéma OpenAPI de la réponse
        login_schema = openapi_schema["paths"]["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
        try:
            validate_with_resolver(data, login_schema, openapi_schema)
        except ValidationError as e:
            pytest.fail(f"Validation OpenAPI échouée pour la réponse de login: {e}")
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser1"
        assert data["user"]["role"] == "user"
        assert data["user"]["is_active"] is True

    def test_login_failure_invalid_username(self, client: TestClient, db_session: Session):
        """Test login failure with non-existent username"""        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "password123"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_failure_invalid_password(self, client: TestClient, db_session: Session):
        """Test login failure with invalid password"""        
        # Create test user
        hashed_password = hash_password("correctpassword")
        test_user = User(
            username="testuser2",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Test with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser2",
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_failure_inactive_user(self, client: TestClient, db_session: Session):
        """Test login failure with inactive user"""        
        # Create inactive user
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="inactiveuser",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False
        )
        db_session.add(test_user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "inactiveuser",
                "password": "testpassword123"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Identifiants invalides ou utilisateur inactif" in data["detail"]

    def test_login_validation_error_missing_username(self, client: TestClient):
        """Test validation error with missing username"""        
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "password123"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_validation_error_missing_password(self, client: TestClient):
        """Test validation error with missing password"""        
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_validation_error_empty_credentials(self, client: TestClient):
        """Test validation error with empty credentials"""        
        response = client.post(
            "/api/v1/auth/login",
            json={}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_success_admin_user(self, client: TestClient, db_session: Session):
        """Test successful login with admin user"""        
        hashed_password = hash_password("adminpass123")
        admin_user = User(
            username="adminuser1",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "adminuser1",
                "password": "adminpass123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert "access_token" in data

    def test_login_success_super_admin_user(self, client: TestClient, db_session: Session):
        """Test successful login with super-admin user"""        
        hashed_password = hash_password("superadminpass123")
        super_admin = User(
            username="superadmin1",
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(super_admin)
        db_session.commit()
        db_session.refresh(super_admin)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "superadmin1",
                "password": "superadminpass123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "super-admin"
        assert "access_token" in data

    def test_jwt_token_structure(self, client: TestClient, db_session: Session):
        """Test JWT token structure"""        
        hashed_password = hash_password("tokentest123")
        test_user = User(
            username="jwtuser1",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "jwtuser1",
                "password": "tokentest123"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Verify token is a non-empty string
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

        # JWT should contain dots (structure: header.payload.signature)
        assert "." in data["access_token"]
        assert data["access_token"].count(".") == 2

    def test_password_case_sensitivity(self, client: TestClient, db_session: Session):
        """Test that password authentication is case-sensitive"""        
        hashed_password = hash_password("CaseSensitive123")
        test_user = User(
            username="caseuser1",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Test with correct case
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "caseuser1",
                "password": "CaseSensitive123"
            }
        )
        assert response.status_code == 200

        # Test with wrong case
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "caseuser1",
                "password": "casesensitive123"
            }
        )
        assert response.status_code == 401
