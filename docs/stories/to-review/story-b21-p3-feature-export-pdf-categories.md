---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.896006
original_path: docs/stories/story-b21-p3-feature-export-pdf-categories.md
---

# Story (Fonctionnalité): Export PDF et XLS de la Configuration des Catégories

**ID:** STORY-B21-P3
**Titre:** Export PDF et XLS de la Configuration des Catégories
**Epic:** Gestion Centralisée des Catégories de Produits
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** pouvoir exporter la configuration complète des catégories et sous-catégories dans un fichier PDF bien mis en page ou dans un fichier XLS,  
**Afin de** pouvoir imprimer, archiver, partager ou retraiter facilement ces données.

## Contexte

Cette fonctionnalité ajoute une capacité de reporting essentielle à la gestion des catégories, permettant d'avoir une vue d'ensemble claire et portable de la configuration actuelle du système, dans le format le plus adapté au besoin.

## Critères d'Acceptation

### 1. Partie Backend

-   Un nouvel endpoint API `GET /api/v1/categories/export` est créé. Il accepte un paramètre de query `format` qui peut être `pdf` ou `xls`.
-   Cet endpoint est protégé et accessible uniquement par les rôles `SUPER_ADMIN`.
-   Si `format=pdf` :
    -   Le backend utilise une bibliothèque pour générer un document PDF.
    -   **Mise en Page du PDF :** La mise en page gère intelligemment les sauts de page pour éviter qu'une catégorie racine et ses sous-catégories ne soient coupées entre deux pages.
    -   Le PDF contient un en-tête (logo, titre), la date de l'export, un tableau hiérarchique des catégories (Nom, Prix Min, Prix Max), et un pied de page (numéro de page).
-   Si `format=xls` :
    -   Le backend utilise une bibliothèque (ex: `openpyxl`) pour générer un fichier Excel (`.xlsx`).
    -   Le fichier Excel contient une feuille de calcul avec les colonnes : `ID_Categorie_Parente`, `Nom_Categorie`, `Prix_Minimum`, `Prix_Maximum`, `Info`, `Image_URL`.
-   L'API retourne le fichier généré avec le bon Content-Type.

### 2. Partie Frontend

-   Sur la page de "Gestion des Catégories" (`/admin/categories`), le bouton "Exporter" est maintenant un menu déroulant ou un groupe de boutons permettant de choisir entre "Exporter en PDF" et "Exporter en XLS".
-   Un clic sur l'une des options déclenche l'appel à l'endpoint `GET /api/v1/categories/export?format=...` et lance le téléchargement du fichier correspondant.

## Notes Techniques

-   **Bibliothèques :** L'agent DEV devra intégrer des bibliothèques pour la génération de PDF (ex: `reportlab`) et de fichiers Excel (ex: `openpyxl`).
-   **Sauts de Page PDF :** La bibliothèque PDF choisie doit permettre de contrôler les sauts de page (ex: en utilisant des `KeepTogether` ou en calculant la hauteur des blocs).

## Definition of Done

- [ ] L'endpoint d'export est fonctionnel pour les formats PDF et XLS.
- [ ] Le fichier PDF a une mise en page professionnelle avec une gestion correcte des sauts de page.
- [ ] Le fichier XLS est correctement formaté.
- [ ] L'interface permet de choisir le format d'export.
- [ ] La story a été validée par le Product Owner.

---

## QA Results

**Gate:** CONCERNS

**Rationale (résumé):**
- Backend: Endpoint présent avec 2 routes (`/api/v1/categories/actions/export` et `/api/v1/categories/export`). Service `CategoryExportService` implémente PDF (ReportLab) et Excel (openpyxl).
- Frontend: UI d’export présente dans `Admin/Categories.tsx` avec menu PDF/XLS et appels via `categoryService.exportToPdf/Excel`.
- Tests backend existent (`api/tests/test_category_export.py`) mais non exécutés dans l’environnement local actuel (python manquant). La conformité réelle (authz SUPER_ADMIN, types MIME, contenu PDF/XLS) doit être validée par exécution CI/Docker.
- Petit risque de duplication d’endpoint (`actions/export` et `export`) à vérifier côté routing et documentation.

**Must-test avant PASS:**
- AuthZ: accès restreint à `SUPER_ADMIN`; non-authentifié/role insuffisant → 401/403.
- Paramètres: `format=pdf|xls`; invalid → 400; sans param → 422.
- PDF: en-tête/logo/date, table hiérarchique, pieds de page, sauts de page cohérents (catégorie + enfants non coupés) sur 3+ pages.
- XLS: entêtes exactes, hiérarchie linéarisée correcte, prix min/max présents si définis, cellules formatées.
- Frontend: bouton Exporter (menu), téléchargement effectif des deux formats, nommage fichier correct, gestion erreurs (toast) si 4xx/5xx.

**Conseils techniques:**
- Centraliser l’endpoint public unique sous `/api/v1/categories/actions/export` et déprécier l’autre s’il est redondant.
- Ajouter tests backend pour cas base vide (PDF/XLS) et gros volume (performances/sauts de page).
- Vérifier locale/format monétaire (fr-FR) dans le rendu PDF/XLS.

**Evidence:**
- Backend endpoint: `api/src/recyclic_api/api/api_v1/endpoints/categories.py`
- Service export: `api/src/recyclic_api/services/category_export_service.py`
- Tests backend: `api/tests/test_category_export.py`
- UI: `frontend/src/pages/Admin/Categories.tsx`, service `frontend/src/services/categoryService.ts`

Décision: Gate CONCERNS en attente d’exécution des tests backend (via Docker/CI) et validation PDF/XLS.
