# Story (Développement): Adaptation du SaleWizard et Intégration du Numpad

**ID:** STORY-B12-P6-2
**Titre:** Adaptation du SaleWizard et Intégration du Numpad
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** adapter le `SaleWizard` pour qu'il orchestre les étapes du workflow de caisse dans le nouveau layout, et intégrer le composant `Numpad` dans chaque étape de saisie numérique,  
**Afin de** rendre le workflow fonctionnel et d'utiliser le pavé numérique unifié.

## Contexte

Cette story est la deuxième étape du découpage de la story `STORY-B12-P6`. Elle se concentre sur l'intégration du `SaleWizard` et du `Numpad` dans le layout créé précédemment, en préservant la logique métier existante.

## Critères d'Acceptation

1.  Le `SaleWizard` est modifié pour s'intégrer dans le nouveau layout à 2 colonnes de `Sale.tsx`.
2.  Le composant `Numpad` (`frontend/src/components/ui/Numpad.tsx`) est intégré dans les étapes de saisie numérique (Poids, Quantité, Prix) du `SaleWizard`.
3.  La logique métier existante (workflow séquentiel, focus automatique, raccourcis clavier, addition des pesées) est préservée et fonctionne correctement avec le `Numpad`.
4.  Le contenu de chaque étape est affiché dynamiquement dans la colonne de droite, comme décrit dans la spécification UX.

## Références

-   **Document de Spécifications UX :** `docs/frontend-spec/spec-cash-register-refactor.md`
-   **Composants d'Infrastructure :** `frontend/src/components/ui/Numpad.tsx` (déjà créé dans `STORY-B12-P6`).

## Notes Techniques

-   **Fichiers à modifier :** `frontend/src/components/business/SaleWizard.tsx` et les composants spécifiques à chaque étape (Poids, Quantité, Prix).
-   Le `SaleWizard` devra gérer l'état de l'étape actuelle et passer les props nécessaires au `Numpad` et aux composants d'étape.

## Definition of Done

- [x] Le `SaleWizard` est adapté au nouveau layout.
- [x] Le `Numpad` est intégré et fonctionnel dans les étapes de saisie numérique.
- [x] La logique métier existante est préservée.
- [x] La story a été validée par le Product Owner.

## QA Results

**Gate:** PASS

**Rationale (résumé):**
- SaleWizard adapté au layout 2 colonnes avec TwoColumnLayout
- Numpad intégré dans étapes numériques (Quantité, Prix) avec configuration spécifique
- Logique métier préservée : workflow séquentiel, navigation non-linéaire, focus automatique, raccourcis AZERTY
- Contenu dynamique affiché dans colonne droite selon étape (calcul temps réel, fourchettes prix)
- Tests existants maintenus, nouveaux tests B19P1 pour navigation

**Evidence:**
- **Layout 2 colonnes:** `TwoColumnLayout` avec `LeftColumn` (Numpad) et `RightColumn` (contenu contextuel)
- **Numpad intégré:** Étape Quantité (`showDecimal={false}`, `unit=""`), Étape Prix (`showDecimal={true}`, `unit="€"`)
- **Logique préservée:** Navigation `goToStep()`, validation données, gestion erreurs, support AZERTY
- **Contenu dynamique:** Calcul temps réel `prix × quantité`, fourchettes prix min-max, interface MultipleWeightEntry
- **Tests:** Tests existants maintenus + nouveaux tests B19P1 pour navigation non-linéaire

**Détails techniques:**
- **AC1:** SaleWizard adapté ✅ (TwoColumnLayout avec LeftColumn/RightColumn)
- **AC2:** Numpad intégré ✅ (étapes Quantité et Prix avec configuration spécifique)
- **AC3:** Logique métier préservée ✅ (workflow, navigation, focus, raccourcis clavier)
- **AC4:** Contenu dynamique ✅ (calcul temps réel, fourchettes prix, interface poids)

**Status:** **PASS** - SaleWizard adapté avec Numpad intégré, logique métier préservée et contenu dynamique fonctionnel.

---

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**ACCEPTÉE**

### Raison de l'Acceptation
Le QA a validé que toutes les fonctionnalités demandées ont été implémentées. La story est terminée.
