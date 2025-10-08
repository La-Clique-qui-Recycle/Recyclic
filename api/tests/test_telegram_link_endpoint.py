"""
Tests for the Telegram account linking endpoint
Story: API pour la Liaison de Compte Telegram Existant
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from jsonschema import validate, ValidationError

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password

pytestmark = pytest.mark.skip(reason="Telegram retiré du système - tests désactivés")

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

class TestTelegramLinkEndpoint:
    """Tests for the POST /api/v1/users/link-telegram endpoint"""

    def test_link_telegram_success_valid_credentials(self, client: TestClient, db_session: Session, openapi_schema):
        """Test successful Telegram linking with valid credentials"""
        # Create test user with hashed password
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="testuser_telegram",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Test linking
        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "testuser_telegram",
                "password": "testpassword123",
                "telegram_id": "123456789"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Validation du schéma OpenAPI de la réponse
        endpoint_schema = openapi_schema["paths"]["/api/v1/users/link-telegram"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
        try:
            validate_with_resolver(data, endpoint_schema, openapi_schema)
        except ValidationError as e:
            pytest.fail(f"Validation OpenAPI échouée pour la réponse de liaison Telegram: {e}")

        # Assertions de contenu spécifiques
        assert data["message"] == "Compte Telegram lié avec succès"

        # Verify user was updated in database
        updated_user = db_session.query(User).filter(User.id == test_user.id).first()
        assert updated_user.telegram_id == "123456789"

    def test_link_telegram_failure_invalid_credentials(self, client: TestClient, db_session: Session):
        """Test Telegram linking failure with invalid credentials"""
        # Create test user
        hashed_password = hash_password("correctpassword")
        test_user = User(
            username="testuser_invalid",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "testuser_invalid",
                "password": "wrongpassword",
                "telegram_id": "123456789"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "Identifiants invalides" in data["detail"]

        # Verify user was not updated
        updated_user = db_session.query(User).filter(User.id == test_user.id).first()
        assert updated_user.telegram_id is None

    def test_link_telegram_failure_conflict_existing_telegram_id(self, client: TestClient, db_session: Session):
        """Test Telegram linking failure when telegram_id already exists"""
        # Create two test users
        hashed_password1 = hash_password("password1")
        hashed_password2 = hash_password("password2")

        user1 = User(
            username="user1",
            hashed_password=hashed_password1,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True,
            telegram_id="123456789"  # Already has this telegram_id
        )
        user2 = User(
            username="user2",
            hashed_password=hashed_password2,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(user1)
        db_session.add(user2)
        db_session.commit()

        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "user2",
                "password": "password2",
                "telegram_id": "123456789"  # Same as user1
            }
        )

        assert response.status_code == 409
        data = response.json()
        assert "Ce Telegram ID est déjà lié à un autre compte" in data["detail"]

        # Verify user2 was not updated
        updated_user2 = db_session.query(User).filter(User.id == user2.id).first()
        assert updated_user2.telegram_id is None

    def test_link_telegram_failure_inactive_user(self, client: TestClient, db_session: Session):
        """Test Telegram linking failure with inactive user"""
        hashed_password = hash_password("testpassword123")
        inactive_user = User(
            username="inactive_user",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False  # Inactive user
        )
        db_session.add(inactive_user)
        db_session.commit()

        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "inactive_user",
                "password": "testpassword123",
                "telegram_id": "123456789"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "Identifiants invalides" in data["detail"]

    def test_link_telegram_overwrite_existing_telegram_id(self, client: TestClient, db_session: Session):
        """Test that existing telegram_id is overwritten for the same user"""
        hashed_password = hash_password("testpassword123")
        test_user = User(
            username="overwrite_user",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True,
            telegram_id="999999999"  # Existing telegram_id
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Link with new telegram_id
        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "overwrite_user",
                "password": "testpassword123",
                "telegram_id": "123456789"  # New telegram_id
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Compte Telegram lié avec succès"

        # Verify user was updated with new telegram_id
        updated_user = db_session.query(User).filter(User.id == test_user.id).first()
        assert updated_user.telegram_id == "123456789"

    def test_link_telegram_validation_error_missing_fields(self, client: TestClient):
        """Test validation error with missing fields"""
        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "testuser"
                # Missing password and telegram_id
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_link_telegram_validation_error_empty_fields(self, client: TestClient):
        """Test validation error with empty fields"""
        response = client.post(
            "/api/v1/users/link-telegram",
            json={
                "username": "",
                "password": "",
                "telegram_id": ""
            }
        )

        # Avec des champs vides, l'authentification échoue avant la validation Pydantic
        assert response.status_code == 401
        data = response.json()
        assert "Identifiants invalides" in data["detail"]
