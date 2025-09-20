# Tests Backend - Recyclic

## 🧪 Guide de Test pour les Agents

### Exécution des Tests

#### Méthode Recommandée (Service Dédié)
```bash
# Démarrer les services requis
docker-compose up -d postgres redis

# Exécuter tous les tests
docker-compose run --rm api-tests

# Exécuter des tests spécifiques
docker-compose run --rm api python -m pytest tests/test_specific.py -v
```

#### Méthode Alternative (Conteneur Éphémère)
```bash
docker-compose run --rm \
  -e TESTING=true \
  -e ENVIRONMENT=test \
  -e TEST_DATABASE_URL="postgresql://recyclic:recyclic_secure_password_2024@postgres:5432/recyclic_test" \
  api python -m pytest -v --tb=short --maxfail=5
```

### Architecture de Test

- **Base de données :** PostgreSQL dédiée (`recyclic_test`)
- **Cache :** Redis pour les tests
- **Isolation :** Conteneur éphémère pour chaque exécution
- **Fixtures :** `db_engine` et `db_session` pour la gestion des tables

### Fixtures Disponibles

#### `db_engine`
```python
@pytest.fixture(scope="function")
def db_engine():
    """Créé un moteur de base de données de test et les tables"""
    # Crée automatiquement toutes les tables SQLAlchemy
```

#### `db_session`
```python
@pytest.fixture(scope="function")
def db_session(db_engine):
    """Fournit une session de base de données de test"""
    # Session isolée pour chaque test
```

### Problèmes Connus

#### ⚠️ Tests qui échouent (5 tests)
Ces tests n'utilisent pas la fixture `db_engine` et échouent avec "relation does not exist" :

- `test_auth_logging.py` (5 tests)
- `test_auth_login_endpoint.py` (2 tests)

**Solution :** Ajouter `db_engine` ou `db_session` aux fixtures du test :
```python
def test_example(db_engine, db_session):
    # Le test aura accès aux tables créées automatiquement
```

### Configuration

#### Variables d'Environnement
- `TESTING=true` - Active le mode test
- `ENVIRONMENT=test` - Environnement de test
- `TEST_DATABASE_URL` - URL de la base de données de test

#### Fichiers de Configuration
- `pytest.ini` - Configuration pytest
- `conftest.py` - Fixtures et setup global
- `docker-compose.yml` - Service `api-tests`

### Statut Actuel

- **Tests qui passent :** 35/45 (78%)
- **Tests qui échouent :** 5/45 (problème de fixtures)
- **Tests ignorés :** 1/45 (async non supporté)

### Documentation Complète

- **Guide de stabilisation :** `api/TESTS_STABILIZATION_GUIDE.md`
- **Story complète :** `docs/stories/story-debt-stabilize-tests.md`
- **Script de test :** `api/run_tests.sh`

### Pour les Agents

Si vous devez corriger les 5 tests restants :

1. **Identifier le test qui échoue** avec "relation does not exist"
2. **Ajouter la fixture appropriée** :
   - `db_engine` pour créer les tables
   - `db_session` pour les opérations de base de données
3. **Vérifier que le test passe** avec `docker-compose run --rm api-tests`

Exemple de correction :
```python
# AVANT (échoue)
def test_user_creation():
    user = User(username="test")
    # Erreur : table 'users' does not exist

# APRÈS (passe)
def test_user_creation(db_engine, db_session):
    user = User(username="test")
    db_session.add(user)
    db_session.commit()
    # ✅ Fonctionne car les tables sont créées
```
