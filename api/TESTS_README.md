# Tests PostgreSQL/Redis - Recyclic

## Vue d'ensemble

Ce document explique comment exécuter les tests d'intégration de Recyclic avec PostgreSQL et Redis en utilisant Docker Desktop.

## Prérequis

- Docker Desktop installé et en cours d'exécution
- Python 3.8+ installé
- WSL2 (recommandé) ou Windows avec Docker Desktop

## Configuration rapide

### 1. Variables d'environnement

Les tests utilisent les variables d'environnement suivantes :

```bash
export ENVIRONMENT=test_postgres
export TEST_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_test"
export REDIS_URL="redis://localhost:6379/1"
```

### 2. Fichier de configuration

Un fichier `env.test.postgres` est fourni avec la configuration par défaut :

```env
TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_test
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_dev
REDIS_URL=redis://localhost:6379/1
ENVIRONMENT=test_postgres
API_V1_STR=/api/v1
PROJECT_NAME=Recyclic API (Tests Postgres)
```

## Exécution des tests

### Méthode automatique (recommandée)

#### Sur Windows :
```cmd
cd api
test_postgres.bat
```

#### Sur Linux/WSL2 :
```bash
cd api
./test_postgres.sh
```

### Méthode manuelle

#### 1. Démarrer les services
```bash
docker-compose up -d postgres redis
```

#### 2. Attendre que les services soient prêts
```bash
# Vérifier PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Vérifier Redis
docker-compose exec redis redis-cli ping
```

#### 3. Configurer l'environnement
```bash
export ENVIRONMENT=test_postgres
export TEST_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_test"
export REDIS_URL="redis://localhost:6379/1"
```

#### 4. Installer les dépendances
```bash
pip install -e .
pip install -r requirements.txt
```

#### 5. Exécuter les tests
```bash
# Tests de connectivité uniquement
python -m pytest tests/test_postgres_connectivity.py -v

# Tous les tests
python -m pytest -v

# Tests avec marqueurs d'intégration
python -m pytest -m integration_db -v
```

## Structure des tests

### Fichiers de test

- `conftest.py` : Configuration pytest avec gestion PostgreSQL/Redis
- `test_postgres_connectivity.py` : Tests de connectivité spécifiques
- `test_simple.py` : Tests d'imports et configuration
- `test_infrastructure.py` : Tests d'infrastructure API
- `test_admin_e2e.py` : Tests d'intégration E2E pour l'administration
- `test_cash_sessions.py` : Tests des sessions de caisse
- `test_auth_login_endpoint.py` : Tests d'authentification

### Fixtures disponibles

- `client` : Client FastAPI pour les tests d'API
- `mock_redis` : Mock Redis pour les tests unitaires

### Marqueurs pytest

- `integration_db` : Tests nécessitant PostgreSQL/Redis réels

## Standards de test enrichis

### Validation Pydantic obligatoire

**RÈGLE CRITIQUE** : Tous les tests d'intégration doivent valider la structure des réponses API avec les schémas Pydantic correspondants.

#### Exemple de test enrichi :

```python
def test_admin_can_list_users(self, e2e_client: TestClient, admin_headers, test_db):
    """Test : Un admin peut lister les utilisateurs"""
    response = e2e_client.get("/api/v1/admin/users", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Validation du schéma Pydantic pour chaque utilisateur
    for user_data in data:
        try:
            validated_user = UserResponse(**user_data)
            # Vérifications supplémentaires sur le contenu
            assert validated_user.id is not None
            assert validated_user.telegram_id is not None
            assert validated_user.role in [role.value for role in UserRole]
            assert validated_user.status in [status.value for status in UserStatus]
            assert isinstance(validated_user.is_active, bool)
            assert validated_user.created_at is not None
            assert validated_user.updated_at is not None
        except Exception as e:
            pytest.fail(f"Validation Pydantic échouée pour l'utilisateur {user_data}: {e}")
```

### Assertions de contenu obligatoires

Les tests doivent vérifier :
1. **Code de statut HTTP** (comme avant)
2. **Structure des données** via validation Pydantic
3. **Contenu métier** (logique business)

#### Exemples d'assertions de contenu :

```python
# Filtrage par rôle - vérifier que tous les résultats ont le bon rôle
for user_data in data:
    validated_user = UserResponse(**user_data)
    assert validated_user.role == UserRole.USER

# Mise à jour de rôle - vérifier la cohérence des données
response_data = validated_response.data
assert response_data["role"] == new_role
assert "previous_role" in response_data
assert response_data["previous_role"] in [role.value for role in UserRole]
```

### Schémas de validation disponibles

- `UserResponse` : Validation des utilisateurs
- `AdminResponse` : Réponses d'administration
- `CashSessionResponse` : Sessions de caisse
- `LoginResponse` : Réponses d'authentification
- `AuthUser` : Données utilisateur dans les réponses auth

### Gestion des erreurs de validation

Utilisez `pytest.fail()` avec des messages explicites :

```python
try:
    validated_data = SchemaResponse(**data)
    # assertions...
except Exception as e:
    pytest.fail(f"Validation Pydantic échouée pour {data}: {e}")
```

## Gestion de la base de données

### Création automatique

Le système de test :
1. Crée automatiquement la base de données `recyclic_test` si elle n'existe pas
2. Crée toutes les tables via `Base.metadata.create_all()`
3. Nettoie les tables à la fin des tests

### Isolation des tests

- Chaque session de test utilise une base de données dédiée
- Les tables sont recréées pour chaque module de test
- Aucune donnée persistante entre les tests

## Dépannage

### Erreurs de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est accessible
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Vérifier les logs
docker-compose logs postgres
```

### Erreurs de connexion Redis

```bash
# Vérifier que Redis est accessible
docker-compose exec redis redis-cli ping

# Vérifier les logs
docker-compose logs redis
```

### Problèmes de permissions

Sur WSL2, assurez-vous que Docker Desktop est configuré pour utiliser WSL2 :

```bash
# Vérifier la configuration Docker
docker info | grep "Operating System"
```

### Ports occupés

Si les ports 5432 ou 6379 sont occupés :

```bash
# Vérifier les ports utilisés
netstat -an | grep :5432
netstat -an | grep :6379

# Modifier docker-compose.yml si nécessaire
```

## Configuration avancée

### Utilisation d'Alembic en tests

Pour utiliser Alembic au lieu de `create_all()` :

1. Modifier `conftest.py` pour utiliser `alembic upgrade head`
2. Configurer `alembic.ini` avec `TEST_DATABASE_URL`
3. Remplacer `create_schema/drop_schema` par les commandes Alembic

### Tests en parallèle

Pour exécuter les tests en parallèle :

```bash
pip install pytest-xdist
python -m pytest -n auto
```

### Couverture de code

```bash
pip install pytest-cov
python -m pytest --cov=recyclic_api --cov-report=html
```

## Support

Pour toute question ou problème :
- Vérifier les logs Docker : `docker-compose logs`
- Consulter la documentation pytest : https://docs.pytest.org/
- Créer une issue sur le projet GitHub
