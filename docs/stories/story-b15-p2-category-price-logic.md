# Story (Backend): Affiner la Logique de Prix des Catégories

**ID:** STORY-B15-P2-CATEGORY-PRICE-LOGIC
**Titre:** Affiner la Logique de Prix sur les Catégories "Feuilles"
**Epic:** Améliorations des Workflows
**Priorité:** P1 (Critique)
**Statut:** Done

---

## User Story

**En tant que** Développeur,
**Je veux** implémenter une règle de validation qui assure que seuls les articles sur des catégories "finales" (sans enfants) peuvent avoir un prix,
**Afin de** garantir une structure de tarification cohérente et d'éviter les ambiguïtés dans le workflow de caisse.

## Acceptance Criteria

1.  La règle de validation backend est modifiée : un prix (`price` ou `max_price`) ne peut être défini sur une catégorie que si cette dernière **n'a pas d'enfants**.
2.  Inversement, il est impossible d'ajouter une sous-catégorie (un enfant) à une catégorie qui a déjà un prix défini.
3.  Dans l'interface d'administration, les champs de prix dans le formulaire de création/modification sont désactivés si la catégorie en cours d'édition a déjà des sous-catégories.

## Tasks / Subtasks

- [x] **Backend :**
    - [x] Dans le service `category_service.py`, remplacer l'ancienne logique de validation par la nouvelle :
        -   Lors de la mise à jour d'une catégorie pour y ajouter un prix, vérifier qu'elle n'a pas d'enfants (`children`).
        -   Lors de la création/modification d'une catégorie pour lui assigner un parent, vérifier que ce parent n'a pas de prix défini.
    - [x] Mettre à jour les tests d'intégration pour valider ces nouveaux scénarios.
- [x] **Frontend :**
    - [x] Dans le composant `CategoryForm.tsx`, modifier la logique qui désactive les champs de prix. Ils doivent être désactivés si `category.children` existe et n'est pas vide.

## Dev Notes

-   Cette story corrige et remplace la logique de validation précédente qui était basée sur `parent_id`.
-   Cette nouvelle règle est la "source de vérité" qui dictera le comportement de la caisse : seule la sélection d'une catégorie "feuille" (sans enfants) est une action terminale.

## Dev Agent Record

### Agent Model Used
- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes
- Backend validation logic updated in `category_service.py`:
  - Prevents adding children to categories with prices defined
  - Prevents setting prices on categories that have children
- 5 new integration tests added to validate the new rules
- All backend tests passing successfully
- Frontend `CategoryForm.tsx` updated to:
  - Load category children and check if category can have prices
  - Disable price fields when category has children
  - Show helpful messages explaining why fields are disabled
- New method added to `categoryService.ts`: `getCategoryChildren()`

### File List
- `api/src/recyclic_api/services/category_service.py` (modified)
- `api/tests/api/test_categories_endpoint.py` (modified - added 5 new tests, removed deprecated tests)
- `frontend/src/components/business/CategoryForm.tsx` (modified)
- `frontend/src/services/categoryService.ts` (modified)

### Change Log
- 2025-10-07: Implementation of "leaf categories only" price validation logic
- Replaced old validation (prices only on subcategories) with new validation (prices only on categories without children)

## Definition of Done

- [x] La nouvelle logique de validation des prix sur les catégories "feuilles" est fonctionnelle et testée.
- [x] L'interface d'administration reflète cette nouvelle règle.
- [ ] La story a été validée par un agent QA.

## QA Results

**Gate Decision:** PASS ✅

**Implementation Status:** DONE
**Tests Status:** DONE

**Summary:**
L'implémentation de la logique de prix des catégories "feuilles" est complète et fonctionnelle. Tous les critères d'acceptation ont été respectés avec une architecture robuste et des tests complets.

**Validations Effectuées:**
- ✅ **Backend validation**: Logique de validation dans `category_service.py` (lignes 187-205) vérifie l'absence d'enfants avant autorisation de prix
- ✅ **Tests d'intégration**: 5 nouveaux tests d'intégration dans `test_categories_endpoint.py` couvrent tous les scénarios de validation
- ✅ **Frontend adapté**: `CategoryForm.tsx` avec logique `canHavePrice = !hasChildren`, champs désactivés et messages explicatifs
- ✅ **Service frontend**: Méthode `getCategoryChildren()` ajoutée dans `categoryService.ts`
- ✅ **Tests validés**: Tests d'intégration passent avec succès (status 200)

**Risques Identifiés:**
- **Migration des données**: Vérifier que les catégories existantes avec prix n'ont pas d'enfants avant déploiement
- **Cohérence métier**: La logique "leaf categories only" est maintenant la source de vérité

**Recommandations:**
- Ajouter un script de migration pour vérifier/alerter sur les catégories existantes avec prix ET enfants
- Considérer l'ajout d'un indicateur visuel dans l'interface pour identifier rapidement les catégories "feuilles"
- Documentation de la nouvelle règle métier pour les utilisateurs administrateurs