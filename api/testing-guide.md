# Guide des Tests Backend (API)

**Auteur:** Bob (Scrum Master)
**Date:** 2025-09-18
**Objectif:** Fournir une source de vérité unique pour lancer et écrire les tests du backend FastAPI.

## 📜 Stratégie Architecturale
Avant de contribuer, il est impératif de lire la **Charte de Stratégie de Test** principale du projet qui définit quel type de test écrire et quand.

-> [Consulter la Charte de Stratégie de Test](../../docs/testing-strategy.md)

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

## 1.1. Comment Lancer les Migrations Alembic (Méthode Recommandée)

Le projet utilise un service Docker Compose dédié pour les migrations Alembic afin d'éviter les problèmes de configuration complexe.

### Lancer les Migrations

Ouvrez un terminal à la racine du projet et exécutez la commande suivante :

```bash
docker-compose run --rm api-migrations alembic upgrade head
```

**Que fait cette commande ?**
-   Elle construit automatiquement l'image `recyclic-api-migrations` si nécessaire.
-   Elle démarre un conteneur **éphémère** basé sur cette image dédiée.
-   Elle utilise une configuration Alembic optimisée pour Docker.
-   Elle applique toutes les migrations en attente à la base de données.
-   `--rm` : Le conteneur est automatiquement supprimé après l'exécution.

### Notes Importantes sur les Migrations

-   **Service dédié :** Utilisez toujours `api-migrations` au lieu de `api` pour les migrations.
-   **Configuration fixe :** L'image `api-migrations` contient une configuration Alembic pré-configurée pour se connecter au service `postgres` Docker.
-   **Variables d'environnement :** Toutes les variables PostgreSQL nécessaires sont automatiquement injectées.
-   **Dépendances :** Le service attend que PostgreSQL soit démarré et sain avant d'exécuter les migrations.

### Commandes de Diagnostic des Migrations

Pour diagnostiquer les problèmes de migration, utilisez les commandes suivantes :

```bash
# Vérifier le nombre de têtes (doit être 1)
docker-compose run --rm api-migrations alembic heads

# Voir l'historique détaillé des migrations
docker-compose run --rm api-migrations alembic history -v

# Vérifier la révision actuelle de la base de données
docker-compose run --rm api-migrations alembic current

# Voir le plan d'upgrade sans l'exécuter
docker-compose run --rm api-migrations alembic upgrade head --sql
```

**Problèmes courants et solutions :**

1. **"Multiple head revisions are present"** : Plusieurs branches de migration existent. Contactez l'équipe de développement.
2. **"Can't locate revision"** : Une révision est manquante ou corrompue. Vérifiez que tous les fichiers de migration sont présents dans `api/migrations/versions/`.
3. **"Target database is not up to date"** : Exécutez `alembic upgrade head` pour mettre à jour.

### Lancer un Fichier de Test Spécifique

Pour débugger, vous pouvez lancer un seul fichier :

```bash
docker-compose run --rm api-tests python -m pytest tests/nom_du_fichier.py
```

## 1.1. Gestion de la Base de Données de Test

Pour les tests backend, une base de données de test dédiée (`recyclic_test`) est utilisée. Elle doit être créée manuellement avant de lancer les tests.

**Commandes pour créer/recréer la base de données de test :**

```bash
# 1. Supprimer la base de données existante (si elle existe)
docker-compose exec postgres psql -U recyclic -c "DROP DATABASE IF EXISTS recyclic_test;"

# 2. Créer une nouvelle base de données de test
docker-compose exec postgres psql -U recyclic -c "CREATE DATABASE recyclic_test;"
```

**Note sur les migrations :** Actuellement, il peut y avoir des problèmes avec les migrations Alembic lors du lancement des tests. Pour les contourner, utilisez l'option `-k "not migration"` avec `pytest` :

```bash
docker-compose run --rm api-tests python -m pytest tests/ -k "not migration" -v
```

---

## 2. Architecture et Standards de Test

### Fixtures Pytest (`conftest.py`)

Le fichier `api/tests/conftest.py` est le cœur de notre configuration de test. Il fournit des "fixtures" réutilisables.

-   **`db_session` :** C'est la fixture la plus importante. **Tout test qui interagit avec la base de données DOIT l'inclure dans ses arguments.** Elle fournit une session de base de données propre et isolée pour chaque test et annule automatiquement toutes les modifications à la fin.

-   **`client` :** Fournit une instance du `TestClient` de FastAPI pour faire des requêtes à l'API.

-   **`admin_client` :** C'est la méthode **préférée** pour tester les endpoints nécessitant des privilèges administrateur. Cette fixture retourne un `TestClient` pré-authentifié avec un token d'administrateur valide.

    **Exemple d'utilisation :**
    ```python
    def test_admin_endpoint(admin_client):
        response = admin_client.get("/api/v1/admin/some-protected-route")
        assert response.status_code == 200
    ```

### Standards d'Écriture

1.  **Isolation :** Grâce à la fixture `db_session`, les tests sont isolés. N'ajoutez pas de logique de nettoyage manuelle dans vos tests.

2.  **Validation Pydantic :** Les tests d'intégration doivent valider la structure des réponses de l'API en utilisant les schémas Pydantic.

3.  **Assertions de Contenu :** Ne vous contentez pas de vérifier le statut HTTP 200. Ajoutez des `assert` pour vérifier que le *contenu* de la réponse est correct.

4.  **Authentification :** Pour tester un endpoint sécurisé, utilisez une fixture qui fournit un client avec un token JWT valide (voir `async_client` dans `conftest.py` comme exemple).

5.  **Création d'utilisateurs de test :** Lors de la création d'utilisateurs de test, il est **obligatoire** de fournir un `hashed_password` car la colonne est non-nullable.

    **❌ Incorrect :**
    ```python
    user = User(
        id=uuid4(),
        username="test@example.com",
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    # Erreur : hashed_password est requis
    ```

    **✅ Correct :**
    ```python
    from recyclic_api.core.security import hash_password

    user = User(
        id=uuid4(),
        username="test@example.com",
        hashed_password=hash_password("testpassword"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    ```

    **Note :** La fonction de hachage s'appelle `hash_password`, pas `get_password_hash`.

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