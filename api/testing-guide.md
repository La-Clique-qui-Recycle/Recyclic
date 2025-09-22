# Guide des Tests Backend (API)

**Auteur:** Bob (Scrum Master)
**Date:** 2025-09-18
**Objectif:** Fournir une source de vérité unique pour lancer et écrire les tests du backend FastAPI.

---

## 1. Comment Lancer les Tests (Méthode Recommandée)

Le projet est configuré avec un service Docker Compose dédié aux tests pour garantir un environnement propre et isolé.

**Prérequis :** Docker Desktop doit être en cours d'exécution.

### Lancer la Suite Complète

Ouvrez un terminal à la racine du projet et exécutez la commande suivante :

```bash
docker-compose run --rm api-tests
```

**Que fait cette commande ?**
-   Elle démarre un conteneur **éphémère** basé sur l'image de l'API.
-   Elle utilise les variables d'environnement définies dans `docker-compose.yml` (ex: `TESTING=true`).
-   Elle lance `pytest` à l'intérieur du conteneur.
-   `--rm` : Le conteneur est automatiquement supprimé après l'exécution des tests, laissant votre système propre.

### Lancer un Fichier de Test Spécifique

Pour débugger, vous pouvez lancer un seul fichier :

```bash
docker-compose run --rm api-tests python -m pytest tests/nom_du_fichier.py
```

---

## 2. Architecture et Standards de Test

### Fixtures Pytest (`conftest.py`)

Le fichier `api/tests/conftest.py` est le cœur de notre configuration de test. Il fournit des "fixtures" réutilisables.

-   **`db_session` :** C'est la fixture la plus importante. **Tout test qui interagit avec la base de données DOIT l'inclure dans ses arguments.** Elle fournit une session de base de données propre et isolée pour chaque test et annule automatiquement toutes les modifications à la fin.

-   **`client` :** Fournit une instance du `TestClient` de FastAPI pour faire des requêtes à l'API.

### Standards d'Écriture

1.  **Isolation :** Grâce à la fixture `db_session`, les tests sont isolés. N'ajoutez pas de logique de nettoyage manuelle dans vos tests.

2.  **Validation Pydantic :** Les tests d'intégration doivent valider la structure des réponses de l'API en utilisant les schémas Pydantic.

3.  **Assertions de Contenu :** Ne vous contentez pas de vérifier le statut HTTP 200. Ajoutez des `assert` pour vérifier que le *contenu* de la réponse est correct.

4.  **Authentification :** Pour tester un endpoint sécurisé, utilisez une fixture qui fournit un client avec un token JWT valide (voir `async_client` dans `conftest.py` comme exemple).

---

## 3. Validation de Contrat API avec OpenAPI

### Objectif

La validation de contrat API garantit que les réponses de l'API respectent exactement la spécification OpenAPI définie dans `openapi.json`. Cela permet de détecter les régressions et de maintenir la cohérence du contrat API.

### Implémentation

#### 1. Dépendances

La validation utilise la bibliothèque `jsonschema` :

```python
from jsonschema import validate, ValidationError
```

#### 2. Configuration

```python
import json
from pathlib import Path

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
```

#### 3. Validation dans les Tests

Pour valider une réponse API contre le schéma OpenAPI :

```python
def test_endpoint_with_validation(self, client, openapi_schema):
    """Test avec validation OpenAPI."""
    response = client.get("/api/v1/endpoint/")
    
    assert response.status_code == 200
    data = response.json()
    
    # Validation du schéma OpenAPI de la réponse
    endpoint_schema = openapi_schema["paths"]["/api/v1/endpoint/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    try:
        validate_with_resolver(data, endpoint_schema, openapi_schema)
    except ValidationError as e:
        pytest.fail(f"Validation OpenAPI échouée: {e}")
    
    # Assertions de contenu spécifiques
    assert data["field"] == "expected_value"
```

### Fichiers de Test Dédiés

- `test_openapi_validation.py` : Tests dédiés à la validation des schémas OpenAPI
- Tests existants modifiés : `test_cash_sessions.py`, `test_auth_login_username_password.py`

### Avantages

- **Détection de régressions** : Les changements d'API sont détectés automatiquement
- **Conformité du contrat** : Garantit que l'API respecte sa spécification
- **Maintenance facilitée** : Les tests échouent si le schéma OpenAPI change