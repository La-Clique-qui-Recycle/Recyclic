# Vérification Migration Production - Story 1.1.2

## ⚠️ IMPORTANT : Vérification avant déploiement

### État actuel en production (v1.2.7)

**Migration actuelle probable** : `add_step_metrics_to_cash_session` ou antérieure

### Changements effectués

1. **Migration supprimée** : `d6064c8cf989_add_notes_and_preset_id_to_sales_table.py`
   - Cette migration ajoutait `preset_id` et `notes` à la table `sales`
   - **N'EXISTE PLUS** dans le code

2. **Chaîne de migrations corrigée** :
   ```
   add_step_metrics_to_cash_session
     ↓
   a1b2c3d4e5f6 (preset_buttons table)
     ↓
   story112_preset_notes (preset_id/notes sur sale_items)
   ```

### ⚠️ Scénarios de migration en production

#### Scénario 1 : Production à `add_step_metrics_to_cash_session` ou antérieure ✅ SAFE
- **État** : La migration `d6064c8cf989` n'a JAMAIS été appliquée
- **Action** : `alembic upgrade head` fonctionnera normalement
- **Résultat** : Passage direct de `add_step_metrics_to_cash_session` → `a1b2c3d4e5f6` → `story112_preset_notes`
- **Risque** : AUCUN ✅

#### Scénario 2 : Production à `d6064c8cf989` ⚠️ PROBLÈME POTENTIEL
- **État** : La migration `d6064c8cf989` a été appliquée (colonnes `sales.preset_id` et `sales.notes` existent)
- **Problème** : Alembic va chercher cette migration qui n'existe plus dans le code
- **Erreur attendue** : `Can't locate revision identified by 'd6064c8cf989'`
- **Solution** : Voir section "Solution si problème"

### ✅ Vérifications à faire AVANT déploiement

#### 1. Vérifier l'état actuel en production

```sql
-- Se connecter à la base de production
SELECT version_num FROM alembic_version;
```

**Résultats possibles** :
- `add_step_metrics_to_cash_session` ou antérieure → ✅ SAFE (Scénario 1)
- `d6064c8cf989` → ⚠️ PROBLÈME (Scénario 2)
- `a1b2c3d4e5f6` ou `story112_preset_notes` → ✅ Déjà à jour

#### 2. Vérifier si les colonnes existent en production

```sql
-- Vérifier si les colonnes sales.preset_id et sales.notes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN ('preset_id', 'notes');
```

**Résultats possibles** :
- Aucune colonne → ✅ SAFE (Scénario 1)
- Colonnes présentes → ⚠️ PROBLÈME (Scénario 2)

### 🔧 Solution si problème (Scénario 2)

Si la migration `d6064c8cf989` a été appliquée en production :

#### Option A : Supprimer les colonnes manuellement puis mettre à jour Alembic

```sql
-- 1. Supprimer les colonnes (si elles existent et sont vides)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS fk_sales_preset_id;
ALTER TABLE sales DROP COLUMN IF EXISTS preset_id;
ALTER TABLE sales DROP COLUMN IF EXISTS notes;

-- 2. Mettre à jour l'état Alembic pour pointer vers add_step_metrics_to_cash_session
UPDATE alembic_version SET version_num = 'add_step_metrics_to_cash_session';
```

**Puis** : `alembic upgrade head` fonctionnera normalement

#### Option B : Recréer temporairement la migration (non recommandé)

Si Option A n'est pas possible, recréer temporairement le fichier `d6064c8cf989_add_notes_and_preset_id_to_sales_table.py` pour permettre la migration, puis le supprimer après.

### ✅ Checklist de déploiement

- [ ] Vérifier `SELECT version_num FROM alembic_version;` en production
- [ ] Vérifier si colonnes `sales.preset_id` et `sales.notes` existent
- [ ] Si Scénario 2 : Appliquer Option A avant déploiement
- [ ] Tester `alembic upgrade head` en staging d'abord
- [ ] Vérifier que les migrations s'appliquent correctement
- [ ] Vérifier que l'application fonctionne après migration

### 📝 Notes importantes

1. **Les colonnes `sales.preset_id` et `sales.notes` ne sont plus utilisées** dans le code
2. **Les données sont maintenant sur `sale_items.preset_id` et `sale_items.notes`** (par item)
3. **Aucune perte de données** : Les colonnes `sales` étaient probablement toujours NULL
4. **Le code backend ne référence plus** `Sale.preset_id` ou `Sale.notes`

### 🎯 Résultat attendu après migration

- Base de données : Colonnes `sales.preset_id` et `sales.notes` supprimées
- Base de données : Colonnes `sale_items.preset_id` et `sale_items.notes` présentes
- Code : Fonctionne avec `preset_id` et `notes` uniquement sur `sale_items`
- Migrations : Chaîne linéaire propre sans migration obsolète

