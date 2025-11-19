# Story: DB - Ajout de la Colonne Destination

**Statut: Terminé**

**User Story**
En tant que système,
Je veux que les lignes de dépôt aient une destination,
Afin de pouvoir trier les objets entre le magasin, le recyclage et la déchèterie.

**Story Context**

*   **Dépendance :** `story-db-reception-schema.md`. La table `ligne_depot` doit exister.
*   **Raison d'être :** Ajoute le champ critique `destination` qui a été identifié comme manquant pour le MVP. C'est un prérequis pour la story de l'API des lignes.
*   **Technologie :** PostgreSQL, SQLAlchemy, Alembic.

**Critères d'Acceptation**

1.  Une nouvelle migration Alembic doit être créée.
2.  La migration doit ajouter une colonne `destination` à la table `ligne_depot`.
3.  Le type de la colonne doit être un `Enum` avec les valeurs possibles : `MAGASIN`, `RECYCLAGE`, `DECHETERIE`.
4.  La colonne ne doit pas autoriser de valeur nulle (`nullable=False`).
5.  La migration doit être réversible.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/db-add-destination-column`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.

**Dev Agent Record**

**Agent Model Used:** Claude Sonnet 4 (dev agent)

**Debug Log References:**
- Migration ENUM: `api/migrations/versions/9a2b3c4d5e6f_add_destination_to_ligne_depot.py`
- Modèle SQLAlchemy: `api/src/recyclic_api/models/ligne_depot.py`
- Schémas Pydantic: `api/src/recyclic_api/schemas/reception.py`
- Service: `api/src/recyclic_api/services/reception_service.py`
- Tests corrigés: `api/tests/test_reception_crud_relations.py`

**Completion Notes List:**
- ✅ Migration Alembic créée avec ENUM PostgreSQL `destinationenum` (MAGASIN|RECYCLAGE|DECHETERIE)
- ✅ Colonne `destination` ajoutée à `ligne_depot` avec `nullable=False`
- ✅ Migration réversible (drop colonne puis drop type ENUM)
- ✅ Modèle SQLAlchemy `LigneDepot` mis à jour avec `Destination` Enum
- ✅ Schémas Pydantic `CreateLigneRequest`, `UpdateLigneRequest`, `LigneResponse` mis à jour
- ✅ Service `ReceptionService` adapté pour conversion Enum
- ✅ Tests endpoints et CRUD adaptés aux valeurs Enum
- ✅ Bug test `test_crud_relations_reception_minimal` corrigé (champs `role` et `status` manquants)

**File List:**
- `api/migrations/versions/9a2b3c4d5e6f_add_destination_to_ligne_depot.py` (créé)
- `api/src/recyclic_api/models/ligne_depot.py` (modifié)
- `api/src/recyclic_api/schemas/reception.py` (modifié)
- `api/src/recyclic_api/services/reception_service.py` (modifié)
- `api/src/recyclic_api/models/__init__.py` (modifié - export Destination)
- `api/tests/test_reception_crud_relations.py` (modifié)
- `api/tests/test_reception_lines_endpoints.py` (modifié)

**Change Log:**
- 2025-09-30: Implémentation complète de la colonne destination ENUM non-null
- 2025-09-30: Correction bug test CRUD (champs obligatoires users)
- 2025-09-30: Tous les tests passent (4/4 endpoints, 3/3 CRUD)

**Status:** Ready for Review

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellente implémentation respectant tous les critères d'acceptation. La migration Alembic est bien structurée et réversible. L'intégration de la colonne destination dans les modèles SQLAlchemy et Pydantic est cohérente. Les tests couvrent bien les cas d'usage principaux et les règles métier.

### Refactoring Performed

- **File**: `api/src/recyclic_api/schemas/reception.py`
  - **Change**: Suppression de la duplication de l'Enum `Destination`, import depuis `recyclic_api.models.ligne_depot`
  - **Why**: Élimination de la violation du principe DRY et réduction du risque d'incohérence
  - **How**: Centralisation de la définition de l'Enum dans le modèle SQLAlchemy

- **File**: `api/tests/test_reception_lines_endpoints.py`
  - **Change**: Ajout du test `test_invalid_destination_enum_values` pour valider les valeurs ENUM invalides
  - **Why**: Amélioration de la couverture de test pour les cas d'erreur
  - **How**: Test des codes d'erreur 422 pour les valeurs ENUM non autorisées

### Compliance Check

- Coding Standards: ✓ Conformité complète aux standards Python (type hints, docstrings, patterns)
- Project Structure: ✓ Respect de l'architecture Repository/Service
- Testing Strategy: ✓ Tests appropriés selon la stratégie (Fixtures-DB pour endpoints CRUD)
- All ACs Met: ✓ Tous les critères d'acceptation implémentés et testés

### Improvements Checklist

- [x] Refactorisé l'Enum Destination pour éliminer la duplication (schemas/reception.py)
- [x] Ajouté test de validation des valeurs ENUM invalides (test_reception_lines_endpoints.py)
- [ ] Considérer extraction des tests SQL bruts vers fixtures ORM (test_reception_crud_relations.py)
- [ ] Implémenter les tests TODO dans test_reception_crud_relations.py

### Security Review

Aucun impact sécurité identifié. L'ajout d'une colonne ENUM non-null n'introduit pas de vulnérabilités.

### Performance Considerations

Migration optimisée avec `server_default` pour gérer les données existantes sans impact sur les performances. L'utilisation d'un ENUM PostgreSQL est efficace.

### Files Modified During Review

- `api/src/recyclic_api/schemas/reception.py` (refactoring Enum)
- `api/tests/test_reception_lines_endpoints.py` (ajout test validation ENUM)

### Gate Status

Gate: PASS → docs/qa/gates/epic-mvp-reception-v1.story-db-add-destination-column.yml
Risk profile: Aucun risque identifié
NFR assessment: Toutes les exigences non-fonctionnelles validées

### Recommended Status

✓ Ready for Done
