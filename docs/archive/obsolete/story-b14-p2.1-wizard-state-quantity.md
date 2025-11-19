# Story (Frontend): Refonte de la Machine d'État du Wizard et Saisie de la Quantité

**ID:** STORY-B14-P2.1-WIZARD-STATE-QUANTITY
**Titre:** Refonte de la Machine d'État du Wizard et Ajout de la Saisie de Quantité
**Epic:** Évolution du Workflow de Vente en Caisse
**Priorité:** P1 (Critique)
**Statut:** Done

---

## User Story

**En tant que** Développeur Frontend,
**Je veux** refondre la machine d'état de l'assistant de saisie et y intégrer les étapes de sous-catégorie et de quantité,
**Afin de** construire la fondation du nouveau workflow de vente.

## Acceptance Criteria

1.  La machine d'état du composant `SaleWizard.tsx` est étendue pour gérer un flux `Catégorie -> Sous-Catégorie -> Quantité -> Poids -> Prix`.
2.  Après la sélection d'une catégorie principale, l'interface affiche la liste de ses sous-catégories.
3.  Après la sélection d'une sous-catégorie, l'interface affiche un pavé numérique pour la saisie de la quantité.

## Tasks / Subtasks

- [x] **Refonte de la Machine d'État :**
    - [x] Dans `SaleWizard.tsx`, modifier la machine d'état (probablement un `useState` ou `useReducer`) pour gérer les nouvelles étapes : `CATEGORY`, `SUB_CATEGORY`, `QUANTITY`, `WEIGHT`, `PRICE`.
- [x] **Étape Sous-Catégorie :**
    - [x] Implémenter la logique qui, après la sélection d'une catégorie, filtre et affiche ses enfants.
- [x] **Étape Quantité :**
    - [x] Créer ou réutiliser un composant de pavé numérique pour la saisie d'un entier (la quantité).
    - [x] Intégrer cet écran comme une nouvelle étape dans le wizard.
- [x] **Tests :**
    - [x] Mettre à jour les tests existants du `SaleWizard` pour valider les nouvelles transitions d'état (Catégorie -> Sous-Catégorie -> Quantité).

## Dev Notes

-   Cette story pose les bases structurelles du nouveau wizard. La propreté de la machine d'état est cruciale.
-   Les étapes `Poids` et `Prix` ne sont pas à modifier dans cette story, elles seront simplement les étapes suivantes dans la machine d'état.

## Definition of Done

- [x] La nouvelle machine d'état est en place.
- [x] Les étapes de sélection de sous-catégorie et de saisie de quantité sont fonctionnelles.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

**Agent Model Used:** Claude Sonnet 4.5

### Debug Log References
- N/A

### Completion Notes
- ✅ Refactored `WizardStep` type to include `'subcategory'` and `'quantity'` steps
- ✅ Added state variables for `selectedSubcategory` and `quantity` with their validation functions
- ✅ Updated `SaleItemData` interface to include `subcategory?: string` and `quantity: number`
- ✅ Implemented subcategory selection step with filtering by `parent_id`
- ✅ Implemented quantity entry step with integer-only numpad (disabled decimal button)
- ✅ Updated wizard flow to check for subcategories and navigate accordingly
- ✅ Updated all handler functions to include quantity in the item data
- ✅ Added styled components for subcategory display (reused CategoryButton components)
- ✅ Updated mode selector buttons to dynamically show subcategory step when applicable
- ✅ Created comprehensive tests for all new flows (16 tests passing):
  - Category selection with/without subcategories
  - Subcategory selection
  - Quantity entry and validation
  - Weight and price entry with new flow
  - Wizard reset functionality

### File List
- **Modified:** `frontend/src/components/business/SaleWizard.tsx`
- **Modified:** `frontend/src/components/business/SaleWizard.test.tsx`

### Change Log
- Extended state machine from 3 steps to 5 steps (Category → Subcategory → Quantity → Weight → Price)
- Added dynamic step navigation based on category hierarchy
- Implemented comprehensive test coverage for all new transitions
- Ensured backward compatibility with existing workflow

## QA Results

**Gate**: PASS

**Raison**: La machine d'état a été étendue pour intégrer les étapes Sous‑Catégorie et Quantité, avec un flux clair et testé (16 tests verts). Les transitions Category → Subcategory → Quantity → Weight → Price sont vérifiées, la saisie de quantité est entière et validée, et le comportement conditionnel selon la hiérarchie est conforme aux AC.

**Éléments de preuve**:
- `SaleWizard.tsx` modifié: nouveaux steps et état (`selectedSubcategory`, `quantity`), validation adaptée.
- `SaleWizard.test.tsx`: 16 tests couvrant sélection de sous‑catégorie, saisie de quantité, et transitions.
- Flow dynamique: saut de step sous‑catégorie si aucune sous‑catégorie.

**Risques & Observations**:
- Cohérence type: `quantity` entier; veiller à bloquer les décimales côté UI (déjà désactivé).
- UX: vérifier la remise à zéro appropriée lors du reset du wizard.

**Recommandations** (non bloquantes):
- Ajouter un test de non‑régression pour le reset complet (toutes variables d'état).
- Journaliser (debug) le flux des steps en dev pour faciliter le support.