# Instructions pour Agent Dev : Nettoyage Database et Résolution Conflits Schema

## Contexte du Projet
Tu interviens sur **Recyclic**, une plateforme PWA de recyclage avec API FastAPI + Frontend React.

## Situation Actuelle
- **Story 3.2** : ✅ TERMINÉE (API admin + interface gestion utilisateurs)
- **Tests Frontend** : ✅ 141/141 passent
- **Tests API** : ❌ 30 erreurs dues à conflits de schéma DB
- **Problème principal** : Enum `userrole` existe déjà → échec migrations Alembic

## Ta Mission
**Nettoyer la base de données de test pour que les tests API passent à 100%**

## Étapes à Suivre

### 1. Analyse du Problème
```bash
cd api
python -m pytest --tb=short -v
# Tu verras : "psycopg2.errors.DuplicateObject: type "userrole" already exists"
```

### 2. Diagnostic Database
```bash
# Vérifier l'état des migrations
alembic current
alembic history

# Vérifier la DB de test
# Connexion : postgresql://recyclic_user:recyclic_secure_password_2024@localhost:5432/recyclic_test_db
```

### 3. Solutions Possibles (dans l'ordre de préférence)

#### Option A: Reset Migration Clean
```bash
# Supprimer la DB de test complètement
dropdb recyclic_test_db
createdb recyclic_test_db

# Réexécuter les tests (ils recréeront le schéma proprement)
python -m pytest
```

#### Option B: Fix Manuel des Enums
```sql
-- Se connecter à recyclic_test_db
DROP TYPE IF EXISTS userrole CASCADE;
DROP TYPE IF EXISTS userstatus CASCADE;

-- Réexécuter les migrations
alembic upgrade head
```

#### Option C: Fix Migration Alembic
```bash
# Revenir à la migration précédente
alembic downgrade -1

# Réappliquer
alembic upgrade head
```

### 4. Validation
```bash
# Tests doivent tous passer
python -m pytest --tb=short
# Attendre : "XX passed, 0 failed, 0 errors"
```

## Points d'Attention

### Configuration DB
- **URL Test** : `postgresql://recyclic_user:recyclic_secure_password_2024@localhost:5432/recyclic_test_db`
- **Fichier** : `api/tests/conftest.py` ligne ~20
- **Docker** : Services PostgreSQL/Redis doivent tourner

### Fichiers Clés à Connaître
- `api/tests/conftest.py` - Setup DB de test
- `migrations/versions/0000_initial_schema.py` - Migration initiale
- `api/src/recyclic_api/models/user.py` - Modèle User avec enums

### Enums Expected
```python
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super-admin"

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
```

## Success Criteria
- [ ] `python -m pytest` → 0 errors, 0 failed
- [ ] Tests API admin passent tous (test_admin_endpoints.py)
- [ ] Tests E2E admin passent tous (test_admin_e2e.py)
- [ ] Aucun conflit d'enum dans les logs

## Si Ça Ne Marche Pas

### Debug Steps
1. Vérifier Docker : `docker-compose ps`
2. Vérifier connectivité : `api/tests/test_postgres_connectivity.py`
3. Vérifier migrations : `alembic show -v`
4. Check logs PostgreSQL dans Docker

### Demander de l'Aide Si
- Les migrations Alembic sont corrompues
- Il manque des permissions DB
- Les tests continuent à échouer après nettoyage

## Notes Importantes
- **NE TOUCHE PAS** aux fichiers de Story 3.2 (ils sont corrects)
- **NE MODIFIE PAS** les migrations existantes sans raison
- **FOCUS UNIQUEMENT** sur le nettoyage DB/résolution conflits
- La story 3.2 est READY FOR REVIEW une fois les tests passants

## Commandes de Vérification Finale
```bash
# Frontend (doit déjà passer)
cd frontend && npm test

# API (ton objectif)
cd api && python -m pytest --tb=short

# Linting (doit déjà passer)
cd frontend && npm run lint
```

**Objectif** : Tous verts ✅

## Contact
Si tu as des questions ou des blocages techniques, demande des clarifications sur les conflits de migrations spécifiques que tu rencontres.

---
*Instructions générées le 2025-01-27 par James (Dev Agent) pour résolution des conflits de schéma de base de données.*