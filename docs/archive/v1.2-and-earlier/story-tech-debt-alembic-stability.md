# Story (Dette Technique): Stabilisation des Migrations Alembic

**ID:** STORY-TECH-DEBT-ALEMBIC-STABILITY
**Titre:** Stabilisation Alembic et Alignement du Service de Migrations
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Done

---

## User Story

**En tant que** Développeur,
**Je veux** un système de migration de base de données stable et prévisible,
**Afin de** pouvoir lancer les tests et les déploiements sans erreurs aléatoires et sans intervention manuelle.

## Contexte

L'exécution des tests backend (`api-tests`) et des migrations (`alembic upgrade head`) échoue de manière intermittente avec des erreurs Alembic, notamment "multiple heads" ou "Can't locate revision". Cela est dû à une incohérence entre l'historique des migrations dans le code et l'état de la base de données, bloquant la CI et le développement local.

## Acceptance Criteria

1.  La commande `docker-compose run --rm api-migrations alembic history -v` ne montre qu'une seule tête de révision valide.
2.  La commande `alembic upgrade head` s'exécute sans erreur.
3.  La commande `docker-compose run --rm api-tests` passe la phase de configuration de la base de données et de migration sans erreur.

## Tasks / Subtasks

- [x] **Audit :** Auditer le répertoire `api/migrations/versions` pour identifier les révisions orphelines, dupliquées ou conflictuelles.
- [x] **Réconciliation :**
    - [x] Si nécessaire, créer une nouvelle révision de fusion (`alembic merge heads`) pour résoudre le problème de "multiple heads".
    - [x] Si une révision est manquante, la retrouver dans l'historique git ou la recréer manuellement si elle est simple.
    - [x] En dernier recours, utiliser `alembic stamp` pour forcer l'alignement de la base de données sur un état de révision spécifique.
- [x] **Configuration :** Vérifier que `alembic.ini` et la configuration du service `api-migrations` pointent correctement vers le répertoire des migrations.
- [x] **Documentation :** Mettre à jour le runbook des migrations avec les commandes de diagnostic et de résolution standard (`alembic history`, `alembic heads`, `alembic merge`).

## Dev Notes

-   **Risque :** La manipulation de l'historique Alembic est risquée. Toute opération doit être testée sur une base de données locale avant d'être appliquée à des environnements partagés.
-   **Commandes de Reproduction :**
    -   `docker-compose run --rm api-migrations alembic heads`
    -   `docker-compose run --rm api-migrations alembic upgrade head`
    -   `docker-compose run --rm api-tests`

## Definition of Done

- [x] L'état des migrations est cohérent et reproductible.
- [x] Les commandes de test et de migration s'exécutent sans erreur Alembic.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### Agent Model Used
- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
None

### Completion Notes

#### Problem Analysis

**Initial State:**
Multiple migration heads detected from revision `9a2b3c4d5e6f`, creating branching migration chains:
1. Branch 1: `9a2b3c4d5e6f` → `b1c2d3e4f5a6` (categories table)
2. Branch 2: `9a2b3c4d5e6f` → `d2e3f4g5h6i7` (weight field)
3. Branch 3: `9a2b3c4d5e6f` → `k1l2m3n4o5p6` (data migration - orphaned)

**Root Causes Identified:**
1. **Incorrect parent references**: `d2e3f4g5h6i7` and multiple other migrations incorrectly revising `9a2b3c4d5e6f`
2. **Duplicate table creation**: `g1h2i3j4k5l6` attempted to recreate the `categories` table
3. **Missing constraint drops**: `8dfd79bd357d` tried to drop `dom_category` without first dropping foreign key constraints
4. **Out-of-order operations**: Data migration logic executed before/after dependent table operations

#### Fixes Applied

**1. Fixed Migration Chain** ([d2e3f4g5h6i7_add_weight_to_sale_items.py:14](api/migrations/versions/d2e3f4g5h6i7_add_weight_to_sale_items.py#L14))
```python
# Changed from: down_revision = '9a2b3c4d5e6f'
down_revision = 'b1c2d3e4f5a6'
```

**2. Fixed Parent ID Migration** ([g1h2i3j4k5l6_add_parent_id_to_categories.py:15](api/migrations/versions/g1h2i3j4k5l6_add_parent_id_to_categories.py#L15))
```python
# Changed from: down_revision = 'b1c2d3e4f5a6'
down_revision = 'f4g5h6i7j8k9'
# Removed duplicate table creation code
```

**3. Fixed Data Migration Reference** ([k1l2m3n4o5p6_robust_migrate_dom_category_data.py:4](api/migrations/versions/k1l2m3n4o5p6_robust_migrate_dom_category_data.py#L4))
```python
# Changed docstring from: Revises: 9a2b3c4d5e6f
Revises: g1h2i3j4k5l6
```

**4. Reordered Drop Operations** ([24b194c1b790_add_category_id_to_ligne_depot.py:14](api/migrations/versions/24b194c1b790_add_category_id_to_ligne_depot.py#L14), [8dfd79bd357d_drop_dom_category_tables.py:14](api/migrations/versions/8dfd79bd357d_drop_dom_category_tables.py#L14))
- Changed `24b194c1b790` to revise `k1l2m3n4o5p6` (was `8dfd79bd357d`)
- Changed `8dfd79bd357d` to revise `24b194c1b790` (was `k1l2m3n4o5p6`)
- Added constraint drops before table drops

**5. Fixed Constraint Drops** ([8dfd79bd357d_drop_dom_category_tables.py:22](api/migrations/versions/8dfd79bd357d_drop_dom_category_tables.py#L22))
```python
# Added before table drops:
op.drop_constraint('ligne_depot_dom_category_id_fkey', 'ligne_depot', type_='foreignkey')
op.drop_column('ligne_depot', 'dom_category_id')
```

**6. Fixed Price Fields Chain** ([h2i3j4k5l6m7_add_price_fields_to_categories.py:14](api/migrations/versions/h2i3j4k5l6m7_add_price_fields_to_categories.py#L14))
```python
# Changed from: down_revision = '24b194c1b790'
down_revision = '8dfd79bd357d'
```

#### Final Migration Chain

```
c1891768c506 (initial schema)
└── 7c1a2f4b9c3a (reception schema)
    └── 8f2b7a1d4e6b (seed dom_category L1)
        └── 9a2b3c4d5e6f (add destination)
            └── b1c2d3e4f5a6 (create categories table)
                └── d2e3f4g5h6i7 (add weight to sale_items)
                    └── e3f4g5h6i7j8 (add pin & settings)
                        └── f4g5h6i7j8k9 (add operator to sales)
                            └── g1h2i3j4k5l6 (add parent_id to categories)
                                └── k1l2m3n4o5p6 (migrate dom_category data)
                                    └── 24b194c1b790 (add category_id to ligne_depot)
                                        └── 8dfd79bd357d (drop dom_category tables)
                                            └── h2i3j4k5l6m7 (add price fields)
                                                └── m3npr1c3dr0p (drop min_price) ← HEAD
```

#### Validation Results

✅ **Single Head Confirmed**: `m3npr1c3dr0p`
✅ **Migrations Execute Successfully**: All 14 migrations run from base to head without errors
✅ **Tests Pass**: `api-tests` runs successfully
✅ **No Foreign Key Violations**: Constraint drops properly ordered

### File List
- [api/migrations/versions/d2e3f4g5h6i7_add_weight_to_sale_items.py](api/migrations/versions/d2e3f4g5h6i7_add_weight_to_sale_items.py) (modified)
- [api/migrations/versions/g1h2i3j4k5l6_add_parent_id_to_categories.py](api/migrations/versions/g1h2i3j4k5l6_add_parent_id_to_categories.py) (modified)
- [api/migrations/versions/k1l2m3n4o5p6_robust_migrate_dom_category_data.py](api/migrations/versions/k1l2m3n4o5p6_robust_migrate_dom_category_data.py) (modified)
- [api/migrations/versions/24b194c1b790_add_category_id_to_ligne_depot.py](api/migrations/versions/24b194c1b790_add_category_id_to_ligne_depot.py) (modified)
- [api/migrations/versions/8dfd79bd357d_drop_dom_category_tables.py](api/migrations/versions/8dfd79bd357d_drop_dom_category_tables.py) (modified)
- [api/migrations/versions/h2i3j4k5l6m7_add_price_fields_to_categories.py](api/migrations/versions/h2i3j4k5l6m7_add_price_fields_to_categories.py) (modified)
- [api/testing-guide.md](api/testing-guide.md) (modified - added diagnostic commands)
- [.github/workflows/alembic-check.yml](.github/workflows/alembic-check.yml) (created - QA recommendation)
- [.github/pull_request_template.md](.github/pull_request_template.md) (created - QA recommendation)

### Change Log
- 2025-10-07: Fixed migration chain by correcting `down_revision` values in 6 migration files
- 2025-10-07: Removed duplicate table creation code from `g1h2i3j4k5l6`
- 2025-10-07: Added foreign key constraint drops to `8dfd79bd357d` before table drops
- 2025-10-07: Reordered migrations to ensure data migration happens before table drops
- 2025-10-07: Updated [api/testing-guide.md](api/testing-guide.md) with diagnostic commands section
- 2025-10-07: **QA Fixes**: Created CI workflow [.github/workflows/alembic-check.yml](.github/workflows/alembic-check.yml) to validate single head and test migrations
- 2025-10-07: **QA Fixes**: Created PR template [.github/pull_request_template.md](.github/pull_request_template.md) with migration checklist

### Status
Ready for Done

## QA Results

**Gate**: PASS

**Raison**: Les critères d'acceptation sont démontrés comme satisfaits: une seule tête de révision Alembic est présente, l'exécution `alembic upgrade head` réussit de bout en bout, et la suite `api-tests` passe la phase de migrations sans erreur. Les correctifs appliqués (références `down_revision`, ordre des drops de contraintes, suppression de duplications) rendent la chaîne de migrations linéaire et fiable.

**Éléments de preuve**:
- `alembic heads` → une seule tête: `m3npr1c3dr0p`
- 14 migrations exécutées avec succès de base à head
- `api-tests` OK, aucune violation de clés étrangères détectée

**Risques & Observations**:
- Risque résiduel faible lié aux environnements divergents; mitigé par la vérification systématique des têtes et l'ordre des opérations.

**Recommandations** (améliorations non bloquantes):
- Ajouter un garde CI: vérification `alembic heads` == 1 et `alembic upgrade --sql head` dry-run.
- Documenter dans le PR template un check de cohérence `down_revision` lors de l'ajout d'une migration.

**Mise à jour (validation finale)**:
- 2025-10-07: Workflow CI ajouté: `.github/workflows/alembic-check.yml` (vérifie tête unique, historique, dry-run SQL, upgrade réel sur Postgres CI).
- 2025-10-07: Template PR ajouté: `.github/pull_request_template.md` (checklist migrations complète).
- Commit de référence: `fb7edd90`.
- Décision QA: PASS confirmée (recommandations implémentées, aucun blocant).
