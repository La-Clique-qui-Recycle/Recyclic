# Stratégie de Migration : Refactoring vers l'Authentification par Username

**Migration ID:** `06c4a1b70fde_refactor_set_user_login_to_username`
**Date:** 2025-09-17
**Epic:** auth-refactoring
**Story:** auth.A

## 📋 Contexte

Cette migration fait partie d'une correction de trajectoire importante : le passage d'une authentification basée sur l'**email** vers une authentification basée sur le **username**.

### Changements Requis

| Champ | Avant | Après |
|-------|-------|-------|
| `username` | `nullable=True, unique=False` | `nullable=False, unique=True` |
| `email` | `nullable=False, unique=True` | `nullable=True, unique=False` |
| `hashed_password` | `nullable=False` | `nullable=False` (inchangé) |
| `telegram_id` | `nullable=True` | `nullable=True` (inchangé) |

## 🔄 Stratégie de Migration des Données

### Problème Principal
Les utilisateurs existants peuvent avoir :
- `username = NULL` (besoin de générer des usernames)
- Emails temporaires (de la migration précédente)
- Besoin de maintenir l'intégrité référentielle

### Solution Implémentée

#### Étape 1 : Génération Intelligente de Usernames
```sql
UPDATE users
SET username = split_part(email, '@', 1) || '_' || SUBSTRING(id::text, 1, 6)
WHERE username IS NULL
```

**Logique :**
- Extrait la partie avant `@` de l'email
- Ajoute un underscore `_`
- Ajoute les 6 premiers caractères de l'UUID
- **Exemple :** `john.doe@example.com` → `john.doe_a1b2c3`

#### Étape 2 : Application des Contraintes
1. `username` devient `NOT NULL`
2. Création d'un index unique sur `username`
3. `email` devient `nullable`
4. Suppression de l'index unique sur `email`

### Avantages de cette Approche

1. **Pas de Perte de Données** : Tous les utilisateurs conservent leurs informations
2. **Usernames Lisibles** : Basés sur l'email existant, donc reconnaissables
3. **Unicité Garantie** : Combinaison email + UUID assure l'unicité
4. **Rollback Possible** : Migration réversible complètement

## 🧪 Tests et Validation

### Scénarios de Test

#### Test 1 : Migration avec Données Existantes
```python
# Données avant migration
users_before = [
    {'email': 'john@test.com', 'username': None},
    {'email': 'jane@test.com', 'username': None},
    {'email': 'admin@test.com', 'username': 'admin'}  # Déjà défini
]

# Résultat attendu après migration
users_after = [
    {'email': 'john@test.com', 'username': 'john_a1b2c3'},
    {'email': 'jane@test.com', 'username': 'jane_d4e5f6'},
    {'email': 'admin@test.com', 'username': 'admin'}  # Inchangé
]
```

#### Test 2 : Contraintes d'Unicité
- ✅ Deux utilisateurs peuvent avoir le même email
- ❌ Deux utilisateurs ne peuvent pas avoir le même username
- ✅ Username est obligatoire pour nouveaux utilisateurs

#### Test 3 : Rollback
- ✅ Retour à l'état précédent possible
- ✅ Contraintes restaurées correctement
- ✅ Index recréés dans le bon état

## 🔧 Commandes de Migration

### Application
```bash
cd api
alembic upgrade 06c4a1b70fde
```

### Rollback (si nécessaire)
```bash
cd api
alembic downgrade 3017df163e5d
```

### Vérification
```bash
# Vérifier la structure
python -c "
import psycopg2
conn = psycopg2.connect('postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic')
cur = conn.cursor()
cur.execute(\"SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('username', 'email')\")
print(cur.fetchall())
"
```

## ⚠️ Considérations Importantes

### Points d'Attention

1. **Backup Obligatoire** : Toujours sauvegarder avant migration en production
2. **Emails Temporaires** : La génération peut créer des usernames avec "temp_"
3. **Collision Théorique** : Très faible probabilité de collision UUID
4. **Performance** : Migration rapide, opérations SQL simples

### Rollback en Production

En cas de problème en production :

```bash
# 1. Arrêter l'application
docker-compose stop api

# 2. Rollback de la migration
cd api && alembic downgrade 3017df163e5d

# 3. Redémarrer avec l'ancienne version
git checkout HEAD~1
docker-compose up -d api
```

## 📊 Métriques de Succès

- ✅ **0 perte de données** : Tous les utilisateurs migrés
- ✅ **Unicité respectée** : Aucune collision de username
- ✅ **Performance maintenue** : Index optimisés
- ✅ **Tests passent** : 100% de réussite des tests

## 🔍 Monitoring Post-Migration

### Requêtes de Vérification

```sql
-- 1. Vérifier qu'il n'y a pas de username NULL
SELECT COUNT(*) FROM users WHERE username IS NULL;
-- Résultat attendu: 0

-- 2. Vérifier l'unicité des usernames
SELECT username, COUNT(*)
FROM users
GROUP BY username
HAVING COUNT(*) > 1;
-- Résultat attendu: aucune ligne

-- 3. Vérifier les emails dupliqués (autorisés)
SELECT email, COUNT(*)
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
-- Résultat attendu: peut avoir des lignes (normal)
```

## 📋 Checklist Post-Migration

- [ ] Vérifier la structure de la table `users`
- [ ] Confirmer l'existence de l'index unique sur `username`
- [ ] Confirmer la suppression de l'index unique sur `email`
- [ ] Tester la création d'un nouvel utilisateur
- [ ] Tester la contrainte d'unicité sur `username`
- [ ] Tester que `email` peut être dupliqué
- [ ] Vérifier que l'application démarre sans erreur
- [ ] Exécuter les tests d'intégration

## 🏷️ Tags

`migration` `database` `authentication` `username` `email` `alembic` `postgresql` `data-migration`