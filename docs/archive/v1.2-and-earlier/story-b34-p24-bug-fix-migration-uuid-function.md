# Story b34-p24: Bug: Corriger le TypeError dans le script de migration des permissions

**Statut:** ✅ Terminé et Validé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Bloquant

## 1. Contexte

L'exécution de la migration `9ca74a277c0d_seed_initial_permissions.py` échoue avec une erreur `sqlalchemy.exc.ProgrammingError: (psycopg2.ProgrammingError) can't adapt type 'Function'`. L'analyse des logs a montré que le script essaie d'insérer un objet fonction `sa.func.gen_random_uuid()` dans la base de données au lieu d'une valeur de type UUID.

## 2. Description du Bug

- **Fichier concerné :** `api/migrations/versions/9ca74a277c0d_seed_initial_permissions.py`
- **Erreur :** L'utilisation de `sa.func.gen_random_uuid()` dans un `op.bulk_insert` n'est pas compatible avec le pilote de la base de données.

## 3. Critères d'Acceptation

1.  Le script de migration DOIT être modifié pour générer les UUIDs en utilisant le module `uuid` de Python avant de les insérer.
2.  La commande `alembic upgrade head` DOIT s'exécuter sans erreur sur un environnement où cette migration n'a pas encore été appliquée.
3.  Après exécution, les 6 permissions DOIVENT être présentes dans la table `permissions` de la base de données.

## 4. Solution Technique Détaillée

**Fichier à modifier :** `api/migrations/versions/9ca74a277c0d_seed_initial_permissions.py`

**Modification à apporter :**

1.  Ajouter `import uuid` en haut du fichier.
2.  Remplacer chaque `sa.func.gen_random_uuid()` par `str(uuid.uuid4())`.

**Code Corrigé (Attendu) :**
```python
# ... en haut du fichier
from alembic import op
import sqlalchemy as sa
import uuid # <--- AJOUTER CET IMPORT

# ...

def upgrade() -> None:
    # ...
    op.bulk_insert(permissions_table, [
        {
            'id': str(uuid.uuid4()), # <--- MODIFICATION
            'name': 'caisse.access',
            'description': 'Donne accès au module de Caisse.'
        },
        {
            'id': str(uuid.uuid4()), # <--- MODIFICATION
            'name': 'reception.access',
            'description': 'Donne accès au module de Réception.'
        },
        # ... et ainsi de suite pour les 4 autres permissions ...
    ])

# ...
```

## 5. Prérequis de Test

- L'agent devra d'abord faire un "downgrade" de la base de données pour annuler la tentative de migration précédente (`alembic downgrade -1`), puis relancer l'upgrade (`alembic upgrade head`) pour vérifier que la version corrigée fonctionne.
