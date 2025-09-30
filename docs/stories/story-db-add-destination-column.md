# Story: DB - Ajout de la Colonne Destination

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
