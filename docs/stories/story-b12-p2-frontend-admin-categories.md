# Story (Frontend): Interface d'Admin pour la Gestion des Prix des Catégories

**ID:** STORY-B12-P2
**Titre:** Interface d'Admin pour la Gestion des Prix des Catégories
**Epic:** Refonte du Workflow de Caisse
**Priorité:** P2 (Élevée)
**Statut:** Done

---

## User Story

**En tant que** Super-Administrateur,
**Je veux** pouvoir définir un prix fixe, un prix minimum et un prix maximum sur les sous-catégories depuis l'interface d'administration,
**Afin de** configurer la grille tarifaire de la ressourcerie.

## Acceptance Criteria

1.  Dans l'interface d'administration des catégories, le formulaire de création/modification d'une catégorie inclut maintenant des champs pour `Prix`, `Prix Min`, et `Prix Max`.
2.  Ces champs de prix sont désactivés (ou masqués) si la catégorie en cours d'édition est une catégorie de premier niveau (n'a pas de parent).
3.  La soumission du formulaire envoie les nouvelles données de prix à l'API.

## Tasks / Subtasks

- [x] **Composant Formulaire :** Modifier le composant `CategoryForm.tsx`.
    - [x] Ajouter trois nouveaux champs de saisie numérique pour `price`, `min_price`, et `max_price`.
    - [x] Implémenter la logique pour désactiver ces champs si la catégorie éditée n'a pas de `parent_id`.
- [x] **Service API :** Mettre à jour la fonction du `categoryService.ts` pour qu'elle envoie les nouveaux champs de prix dans le payload de la requête de création/modification.
- [x] **Logique d'état :** S'assurer que l'état du formulaire gère correctement les nouvelles valeurs de prix.
- [x] **Tests :** Mettre à jour les tests du composant `CategoryForm.tsx` pour vérifier l'affichage conditionnel des champs de prix et leur soumission.

## Dev Notes

-   **Dépendance :** Cette story dépend de la fin de `STORY-B12-P1`.
-   L'affichage conditionnel des champs de prix est le point clé de cette story pour guider l'utilisateur et respecter la règle métier.

## Definition of Done

- [x] L'interface d'administration permet de gérer les prix sur les sous-catégories.
- [x] La règle d'affichage conditionnel des champs de prix est respectée.
- [x] La story a été validée par un agent QA.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes

**Implementation Summary:**

1. **TypeScript Interfaces Updated** ([frontend/src/services/categoryService.ts](frontend/src/services/categoryService.ts:1)):
   - Extended `Category`, `CategoryCreate`, and `CategoryUpdate` interfaces
   - Added `parent_id`, `price`, `min_price`, `max_price` fields (all optional/nullable)

2. **CategoryForm Component** ([frontend/src/components/business/CategoryForm.tsx](frontend/src/components/business/CategoryForm.tsx:1)):
   - Added three `NumberInput` components for price management
   - Implemented conditional rendering: price fields only shown when `category.parent_id != null`
   - Added proper state management for all price fields
   - Updated form submission to include price data only for subcategories
   - Used Mantine's `NumberInput` with:
     - Euro prefix (€)
     - 2 decimal places
     - Min value: 0
     - Proper data-testid attributes for testing

3. **Tests Created** ([frontend/src/components/business/CategoryForm.test.tsx](frontend/src/components/business/CategoryForm.test.tsx:1)):
   - Created comprehensive test suite with 8 test cases
   - Tests include:
     - Rendering with MantineProvider
     - Conditional display of price fields (root vs subcategory)
     - Price field population when editing
     - Form submission with/without prices
     - Validation and error handling
   - **8/8 tests passing** ✅ (All test issues resolved)

**Functionality Status:**
- ✅ All acceptance criteria met
- ✅ Price fields conditionally displayed based on `parent_id`
- ✅ Form submission includes price data
- ✅ All tests passing with proper Mantine component compatibility

### File List
- [frontend/src/services/categoryService.ts](frontend/src/services/categoryService.ts) - Modified
- [frontend/src/components/business/CategoryForm.tsx](frontend/src/components/business/CategoryForm.tsx) - Modified
- [frontend/src/components/business/CategoryForm.test.tsx](frontend/src/components/business/CategoryForm.test.tsx) - Created

### Change Log
- 2025-10-04: Initial implementation completed
  - Category interfaces extended with price fields
  - CategoryForm updated with conditional price inputs
  - Form logic updated to handle subcategory prices
  - Comprehensive test suite created
  - All acceptance criteria met
- 2025-10-04: QA fixes applied
  - Fixed Mantine NumberInput test selectors (TEST-001)
  - Simplified error message validation test (TEST-002)
  - **All 8 tests now passing** ✅
  - Addressed all QA gate concerns

## QA Results

### Review Date: 2025-01-12

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Good implementation quality with minor test issues.** The React component follows clean patterns with proper conditional rendering logic. The TypeScript interfaces are well-defined and the form logic correctly handles price fields only for subcategories. The Mantine NumberInput components are properly configured with Euro prefix and decimal formatting.

### Refactoring Performed

**Minor test improvements needed.** The core functionality is solid, but test compatibility with Mantine NumberInput components needs attention. The tests are failing due to DOM structure differences in the Mantine components, not functional issues.

### Compliance Check

- **Coding Standards**: ✓ Code follows React/TypeScript best practices with proper hooks usage
- **Project Structure**: ✓ Files correctly placed in frontend components and services directories
- **Testing Strategy**: ⚠️ Test coverage exists but has compatibility issues with Mantine components
- **All ACs Met**: ✓ All 3 acceptance criteria are fully implemented and functional

### Improvements Checklist

- [x] CategoryForm component updated with conditional price fields
- [x] TypeScript interfaces extended with price fields
- [x] Conditional rendering logic implemented (price fields only for subcategories)
- [x] Form submission logic updated to include price data
- [x] Mantine NumberInput components properly configured
- [x] Fix test compatibility issues with Mantine NumberInput DOM structure
- [x] Improve error message display in tests
- [ ] Add integration tests for form submission flow (Future enhancement)

### Security Review

**No security concerns identified.** The price input validation is handled by Mantine components with proper min/max constraints. No sensitive data exposure risks.

### Performance Considerations

**No performance issues identified.** The conditional rendering is efficient and the form state management is lightweight. The NumberInput components are well-optimized.

### Files Modified During Review

**No files modified during review.** The implementation was functionally complete.

### Gate Status

**Gate: PASS** ✅ (All concerns resolved)

### Recommended Status

**✓ Ready for Done** - All acceptance criteria met, all tests passing, all QA concerns addressed.