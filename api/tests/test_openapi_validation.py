"""
Tests de validation OpenAPI pour les endpoints de l'API Recyclic.

Ces tests valident que les réponses de l'API respectent exactement
la spécification OpenAPI définie dans openapi.json.
"""

import pytest
from fastapi.testclient import TestClient
from jsonschema import validate, ValidationError

from recyclic_api.main import app

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
def client():
    """Client de test FastAPI."""
    return TestClient(app)

class TestOpenAPIValidation:
    """Tests de validation des schémas OpenAPI pour les endpoints principaux."""

    def test_health_endpoint_schema_validation(self, client, openapi_schema):
        """Test de validation du schéma pour l'endpoint de santé."""
        response = client.get("/api/v1/health/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validation du schéma OpenAPI de la réponse
        health_schema = openapi_schema["paths"]["/api/v1/health/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        validate_with_resolver(data, health_schema, openapi_schema)

    def test_users_endpoint_schema_validation(self, client, openapi_schema):
        """Test de validation du schéma pour l'endpoint des utilisateurs."""
        response = client.get("/api/v1/users/")
        
        # L'endpoint peut retourner 200, 401 ou 403 selon l'authentification
        assert response.status_code in [200, 401, 403]
        data = response.json()
        
        # Validation du schéma OpenAPI de la réponse
        if response.status_code == 200:
            users_schema = openapi_schema["paths"]["/api/v1/users/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
            validate_with_resolver(data, users_schema, openapi_schema)
        else:
            # Pour les erreurs, valider la structure standard FastAPI
            assert "detail" in data

    def test_cash_sessions_endpoint_schema_validation(self, client, openapi_schema):
        """Test de validation du schéma pour l'endpoint des sessions de caisse."""
        response = client.get("/api/v1/cash-sessions/")
        
        # L'endpoint peut retourner 200, 401 ou 403 selon l'authentification
        assert response.status_code in [200, 401, 403]
        data = response.json()
        
        # Validation du schéma OpenAPI de la réponse
        if response.status_code == 200:
            cash_sessions_schema = openapi_schema["paths"]["/api/v1/cash-sessions/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
            validate_with_resolver(data, cash_sessions_schema, openapi_schema)
        else:
            # Pour les erreurs, valider la structure standard FastAPI
            assert "detail" in data

    def test_error_response_schema_validation(self, client, openapi_schema):
        """Test de validation du schéma pour les réponses d'erreur."""
        # Tester un endpoint inexistant pour générer une erreur 404
        response = client.get("/api/v1/nonexistent/")
        
        assert response.status_code == 404
        data = response.json()
        
        # Valider la structure d'erreur standard FastAPI
        assert "detail" in data

    def test_openapi_schema_structure(self, openapi_schema):
        """Test de validation de la structure du schéma OpenAPI lui-même."""
        # Vérifier que le schéma OpenAPI a la structure attendue
        assert "openapi" in openapi_schema
        assert "info" in openapi_schema
        assert "paths" in openapi_schema
        assert "components" in openapi_schema
        assert "schemas" in openapi_schema["components"]
        
        # Vérifier que les endpoints principaux sont définis
        assert "/api/v1/health/" in openapi_schema["paths"]
        assert "/api/v1/users/" in openapi_schema["paths"]
        assert "/api/v1/cash-sessions/" in openapi_schema["paths"]

    def test_schema_references_resolution(self, openapi_schema):
        """Test de validation que les références $ref peuvent être résolues."""
        # Tester la résolution d'une référence de schéma
        cash_session_ref = {"$ref": "#/components/schemas/CashSessionResponse"}
        
        # Créer un objet de test valide pour la validation
        test_instance = {
            "operator_id": "test-operator-id",
            "site_id": "test-site-id", 
            "initial_amount": 100.0,
            "id": "test-session-id",
            "current_amount": 100.0,
            "status": "open",
            "opened_at": "2025-01-27T10:00:00Z"
        }
        
        try:
            validate_with_resolver(test_instance, cash_session_ref, openapi_schema)
            # Si on arrive ici, la résolution a fonctionné
            assert True
        except Exception as e:
            pytest.fail(f"Impossible de résoudre les références $ref: {e}")
