# Story (Dette Technique): Renforcement de la Couverture de Tests du Module Caisse

**ID:** STORY-TECH-DEBT-B10-TESTS
**Titre:** Renforcement de la Couverture de Tests Automatisés du Module Caisse
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** augmenter la couverture de tests automatisés pour le module de caisse,
**Afin de** garantir la non-régression des fonctionnalités critiques et de détecter les bugs plus tôt.

## Acceptance Criteria

1.  Des tests unitaires sont ajoutés pour les fonctions critiques du store de la caisse (`submitSale`, `refreshSession`).
2.  Des tests d'intégration frontend sont ajoutés pour les composants `PinSettings` et `OperatorLockScreen`.
3.  Des tests de régression visuelle sont mis en place pour l'interface de vente principale afin de détecter les changements inattendus.

## Tasks / Subtasks

- [ ] **Tests Unitaires (Store) :**
    - [ ] Écrire des tests pour la fonction `submitSale`, en simulant les réponses API (succès, erreur).
    - [ ] Écrire des tests pour la fonction `refreshSession`.
- [ ] **Tests d'Intégration (Composants) :**
    - [ ] Créer un fichier de test pour `PinSettings.tsx` et tester la logique de validation et de soumission.
    - [ ] Créer un fichier de test pour `OperatorLockScreen.tsx` et tester ses deux modes (liste et PIN).
    - [ ] **(Nouveau B13)** Créer un fichier de test pour la page `AdminDashboard.tsx` afin de valider le fonctionnement des filtres (par date et par opérateur) sur l'historique des sessions.
- [ ] **Tests de Régression Visuelle :**
    - [ ] Intégrer un outil de test de régression visuelle (ex: Playwright, Percy, ou autre) sur la page de vente.
    - [ ] Créer un test de snapshot de référence de l'interface de vente.

## Dev Notes

-   Cette story consolide les recommandations de tests des stories `STORY-B10-P2`, `STORY-B10-P3`, et `STORY-B10-P4`.
-   L'ajout de tests de régression visuelle est particulièrement utile pour les interfaces complexes comme la caisse, où des petits changements de CSS peuvent avoir des impacts inattendus.

## Definition of Done

- [ ] La couverture de tests du store et des composants liés à la caisse est augmentée.
- [ ] Un pipeline de test de régression visuelle est en place pour l'interface de vente.
- [ ] La story a été validée par un agent QA.