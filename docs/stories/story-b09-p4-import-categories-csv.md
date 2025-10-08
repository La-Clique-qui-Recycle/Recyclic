# Story (Fonctionnalité): Import de la Hiérarchie des Catégories par CSV

**ID:** STORY-B09-P4
**Titre:** Import de la Hiérarchie des Catégories par CSV
**Epic:** Gestion Centralisée des Catégories de Produits
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** pouvoir importer la structure complète des catégories et sous-catégories depuis un fichier CSV,  
**Afin de** pouvoir configurer rapidement et en masse la taxonomie des produits.

## Contexte

Cette fonctionnalité complète la gestion manuelle des catégories en offrant une solution d'import en masse, essentielle pour la configuration initiale du système ou pour des mises à jour importantes.

## Critères d'Acceptation

### 1. Backend

-   Un nouvel endpoint `POST /api/v1/categories/import/analyze` est créé. Il est protégé pour les `SUPER_ADMIN`.
    -   Il accepte un fichier CSV avec les colonnes : `Catégorie racine`, `Sous-catégorie`, `Prix minimum (€)`, `Prix maximum (€)`.
    -   Il analyse le fichier, valide les données, et retourne un rapport de prévisualisation (nombre de catégories/sous-catégories à créer/mettre à jour, et les erreurs éventuelles).
-   Un nouvel endpoint `POST /api/v1/categories/import/execute` est créé. Il accepte un ID de session d'import et exécute la création/mise à jour des catégories de manière transactionnelle.
-   La logique de l'API gère la création des catégories racines si elles n'existent pas, puis la création/mise à jour des sous-catégories en les liant à leur parent.

### 2. Frontend

-   Sur la page `/admin/categories`, un bouton "Importer des Catégories" est ajouté, visible uniquement pour les `SUPER_ADMIN`.
-   Ce bouton déclenche le workflow d'import en deux étapes (analyse puis confirmation) que nous avons défini pour les autres modules d'import.
-   Un lien permet de télécharger un modèle CSV avec les 4 colonnes requises.

## Notes Techniques

-   **Logique d'Import :** Le backend doit d'abord traiter toutes les "Catégories racines" pour s'assurer qu'elles existent en base de données avant de traiter les lignes de sous-catégories qui en dépendent.
-   **Comportement "Upsert" :** L'import doit se comporter comme un "upsert" : si une catégorie/sous-catégorie existe déjà, elle est mise à jour ; sinon, elle est créée.

## Definition of Done

- [x] Les endpoints d'analyse et d'exécution pour l'import des catégories sont fonctionnels et sécurisés.
- [x] L'interface d'import est fonctionnelle sur la page de gestion des catégories.
- [x] La logique de création/mise à jour de la hiérarchie des catégories est correcte.
- [ ] La story a été validée par le Product Owner.

---

Dev Agent Record

- Files changed:
  - `api/src/recyclic_api/services/category_import_service.py`
  - `api/src/recyclic_api/api/api_v1/endpoints/categories.py`
  - `api/src/recyclic_api/schemas/category.py`
  - `api/tests/test_categories_import.py`
  - `frontend/src/services/categoryService.ts`
  - `frontend/src/pages/Admin/Categories.tsx`

- Notes:
  - Ajout du service d'import CSV (analyze/execute, Redis TTL 30 min)
  - Endpoints: `GET /categories/import/template`, `POST /categories/import/analyze`, `POST /categories/import/execute`
  - UI d'import ajoutée sur `/admin/categories` avec workflow analyse → exécution
