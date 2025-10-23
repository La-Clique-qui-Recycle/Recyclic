# Story b34-p23: Bug: Corriger la dépendance de la migration des permissions

**Statut:** ✅ Terminé et Validé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Bloquant

## 1. Contexte

La migration créée dans la story `b34-p22` pour insérer les permissions initiales (`9ca74a277c0d_seed_initial_permissions.py`) a été incorrectement liée à l'historique des migrations. Elle pointe vers une révision obsolète, créant une "fourche" (multiple heads) dans l'historique Alembic, ce qui bloquera tous les futurs déploiements.

## 2. Description du Bug

- **Fichier concerné :** `api/migrations/versions/9ca74a277c0d_seed_initial_permissions.py`
- **Erreur :** La variable `down_revision` a la mauvaise valeur.
- **Valeur Actuelle (Incorrecte) :** `'07d1d205a8c6'`
- **Valeur Attendue (Correcte) :** `'f93987027864'` (qui est l'ID de la migration la plus récente avant celle-ci).

## 3. Critères d'Acceptation

1.  Dans le fichier `api/migrations/versions/9ca74a277c0d_seed_initial_permissions.py`, la valeur de la variable `down_revision` DOIT être changée pour `'f93987027864'`.
2.  La commande `alembic check` (ou `alembic heads`) DOIT s'exécuter sans erreur et ne montrer qu'une seule "tête" de migration.

## 4. Solution Technique Détaillée

**Fichier à modifier :** `api/migrations/versions/9ca74a277c0d_seed_initial_permissions.py`

**Ligne à modifier :**

**Code Actuel (Incorrect) :**
```python
down_revision = '07d1d205a8c6'
```

**Code Corrigé (Attendu) :**
```python
down_revision = 'f93987027864'
```

C'est la seule modification requise.

## 5. Prérequis de Test

- L'agent doit exécuter la commande `alembic heads` depuis le répertoire `api/` et confirmer que la sortie indique une seule révision (la plus récente, `9ca74a277c0d`).
