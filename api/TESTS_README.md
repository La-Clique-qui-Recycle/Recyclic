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

### Fixtures disponibles

- `client` : Client FastAPI pour les tests d'API
- `mock_redis` : Mock Redis pour les tests unitaires

### Marqueurs pytest

- `integration_db` : Tests nécessitant PostgreSQL/Redis réels

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
