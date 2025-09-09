# Checklist: Validation Tests PostgreSQL/Redis

**Version :** 1.0  
**Date :** 9 septembre 2025  
**Contexte :** Tests d'intégration PostgreSQL/Redis  

## 🔍 Pré-requis

### Environnement
- [ ] Docker Desktop en cours d'exécution
- [ ] WSL2 configuré et accessible
- [ ] Python 3.8+ installé
- [ ] Dépendances installées (`pip install -r requirements.txt`)

### Configuration
- [ ] Fichier `.env` créé avec les bonnes variables
- [ ] Variables d'environnement cohérentes entre Docker et tests
- [ ] Utilisateur de base de données identique (`recyclic`)
- [ ] Mot de passe identique (`recyclic_secure_password_2024`)

## 🚀 Exécution des Tests

### 1. Démarrage des Services
- [ ] `docker-compose up -d postgres redis`
- [ ] Vérifier que PostgreSQL est accessible : `docker-compose exec postgres pg_isready -U recyclic`
- [ ] Vérifier que Redis est accessible : `docker-compose exec redis redis-cli ping`

### 2. Configuration de l'Environnement
- [ ] `export ENVIRONMENT=test_postgres`
- [ ] `export TEST_DATABASE_URL="postgresql+psycopg2://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test"`
- [ ] `export REDIS_URL="redis://localhost:6379/1"`

### 3. Exécution des Tests
- [ ] Tests de connectivité : `python -m pytest tests/test_postgres_connectivity.py -v`
- [ ] Tous les tests passent (4/4)
- [ ] Aucune erreur d'authentification
- [ ] Base de données de test créée automatiquement

## ✅ Validation des Résultats

### Tests Redis
- [ ] `test_redis_connectivity` : ✅ Passe
- [ ] `test_redis_operations` : ✅ Passe

### Tests PostgreSQL
- [ ] `test_postgres_connectivity` : ✅ Passe
- [ ] `test_postgres_database_creation` : ✅ Passe

### Tests API
- [ ] Endpoint racine : Status 200
- [ ] Endpoint health : Status 200, database et redis "connected"
- [ ] Endpoint API v1 : Status 200

## 🚨 Dépannage

### Erreur d'Authentification PostgreSQL
- [ ] Vérifier que l'utilisateur est `recyclic` (pas `postgres`)
- [ ] Vérifier que le mot de passe est `recyclic_secure_password_2024`
- [ ] Vérifier que la base de données est `recyclic_test`

### Erreur de Connexion Redis
- [ ] Vérifier que Redis est accessible : `docker-compose exec redis redis-cli ping`
- [ ] Vérifier l'URL Redis : `redis://localhost:6379/1`

### Pytest ne fonctionne pas
- [ ] Utiliser les tests directs Python comme alternative
- [ ] Vérifier que les variables d'environnement sont exportées
- [ ] Utiliser `python -c "..."` pour tester les connexions

## 📝 Documentation

### Variables d'Environnement Requises
```bash
ENVIRONMENT=test_postgres
TEST_DATABASE_URL=postgresql+psycopg2://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test
REDIS_URL=redis://localhost:6379/1
```

### Commandes de Test
```bash
# Tests de connectivité
python -m pytest tests/test_postgres_connectivity.py -v

# Tests directs Python
python -c "
import os
os.environ['TEST_DATABASE_URL'] = 'postgresql+psycopg2://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test'
os.environ['REDIS_URL'] = 'redis://localhost:6379/1'
# ... tests ...
"
```

## 🎯 Critères de Succès

- [ ] **4 tests passent** (2 Redis + 2 PostgreSQL)
- [ ] **0 échecs**
- [ ] **Aucune erreur d'authentification**
- [ ] **Base de données de test créée automatiquement**
- [ ] **Services Docker accessibles**
- [ ] **Variables d'environnement cohérentes**

## 📊 Métriques de Qualité

- **Temps d'exécution des tests :** < 30 secondes
- **Taux de succès :** 100%
- **Warnings :** Seulement les warnings FastAPI (non critiques)
- **Couverture :** Connexions PostgreSQL et Redis validées

---

**Créé par :** Sarah (Product Owner)  
**Validé par :** Équipe de développement  
**Prochaine révision :** Après correction de la dette technique
