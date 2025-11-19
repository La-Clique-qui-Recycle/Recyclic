---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.702400
original_path: docs/stories/story-tech-debt-b12-a11y-tests.md
---

# Story (Dette Technique): Amélioration Accessibilité et Tests E2E Caisse

**ID:** STORY-TECH-DEBT-B12-A11Y-TESTS
**Titre:** Amélioration de l'Accessibilité et des Tests d'Intégration de la Caisse
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Moyenne)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** améliorer l'accessibilité de l'interface de caisse et ajouter des tests de bout en bout,
**Afin de** rendre l'application utilisable par tous et de garantir la robustesse du flux de vente complet.

## Acceptance Criteria

1.  L'ensemble de l'interface de caisse, y compris l'assistant de saisie et le ticket, est entièrement navigable en utilisant uniquement le clavier.
2.  Les éléments interactifs (boutons, champs de saisie, etc.) possèdent des labels ARIA appropriés pour être correctement interprétés par les lecteurs d'écran.
3.  Un test d'intégration de bout en bout (E2E) est créé et valide le scénario complet : sélection d'une catégorie, saisie d'un poids/prix, ajout au ticket, et finalisation de la vente.

## Tasks / Subtasks

- [ ] **Accessibilité (Navigation Clavier) :**
    - [ ] Revoir tous les composants de l'interface de caisse (`SaleWizard.tsx`, `Ticket.tsx`, etc.).
    - [ ] S'assurer que l'ordre de tabulation (`tabindex`) est logique et que tous les éléments interactifs sont atteignables et activables via le clavier (ex: `Enter`, `Space`).
    - [ ] **(Nouveau B15)** Implémenter la navigation au clavier sur l'écran de finalisation de la caisse et sur la sélection hiérarchique en réception.
- [ ] **Accessibilité (ARIA) :**
    - [ ] Ajouter des attributs `aria-label`, `aria-labelledby`, ou `role` pertinents sur les boutons, champs et conteneurs pour décrire leur fonction aux technologies d'assistance.
    - [ ] **(Nouveau B15)** Ajouter les labels ARIA manquants sur l'écran de finalisation et la sélection hiérarchique.
- [ ] **Tests de Bout en Bout (E2E) :**
    - [ ] Créer un nouveau fichier de test E2E (ex: avec Playwright).
    - [ ] Écrire un scénario de test qui simule une vente complète, de la sélection de la catégorie à la finalisation, en vérifiant que chaque étape fonctionne comme attendu.
    - [ ] **(Nouveau B13/B14)** Étendre le test E2E de la Caisse pour valider la saisie dans une plage de prix et l'utilisation de différents moyens de paiement.
    - [ ] **(Nouveau B15)** Ajouter un test E2E pour le parcours de navigation dans la hiérarchie des catégories en réception.

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B12-P4`.
-   L'accessibilité (a11y) est une exigence de qualité importante pour les applications modernes.
-   Les tests E2E sont plus lents mais essentiels pour valider l'intégration correcte de tous les composants d'un flux utilisateur critique.

## Definition of Done

- [ ] L'interface de caisse est accessible au clavier et via les lecteurs d'écran.
- [ ] Un test E2E valide le flux de vente complet.
- [ ] La story a été validée par un agent QA.