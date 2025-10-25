# Story (Dette Technique): Réparation de la Suite de Tests Frontend

**ID:** STORY-TECH-DEBT-B36-TEST-SUITE-FIX
**Titre:** [TECH-DEBT] Réparation de la Suite de Tests Frontend (307 Tests en Échec)
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée) - Bloque la validation automatique de tout le frontend
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** que la suite de tests frontend (`npm run test:run`) s'exécute complètement et que les tests passent,
**Afin de** pouvoir de nouveau valider la non-régression et la qualité du code frontend de manière automatisée.

## Contexte

Lors de la validation de la story `B36-P2`, il a été découvert que la suite de tests frontend est complètement cassée, avec 307 tests en échec. Ce problème est pré-existant et bloque toute validation automatisée. L'analyse a identifié des causes spécifiques comme des labels d'interface manquants dans les tests et une `TypeError` dans `authStore.logout`.

## Acceptance Criteria

1.  La commande `npm run test:run` s'exécute et tous les tests (ou une très grande majorité) passent avec succès.
2.  Le problème de `TypeError` dans `authStore.logout` lors des tests est résolu.
3.  Les tests qui échouent à cause de labels manquants (ex: `MultipleWeightEntry.test.tsx`) sont corrigés.

## Tasks / Subtasks

- [ ] **Analyse des Échecs :**
    - [ ] Lancer `npm run test:run` et analyser les logs pour catégoriser les erreurs (ex: erreurs de setup, erreurs de logique, erreurs de sélecteur).
- [ ] **Correction `authStore.logout` :**
    - [ ] Investiguer la `TypeError: Cannot read properties of undefined (reading 'headers')` dans `authStore.logout` qui se produit lors des tests.
    - [ ] Corriger la logique ou le mock pour résoudre cette erreur.
- [ ] **Correction des Tests de Composants :**
    - [ ] Modifier les tests qui échouent à cause de sélecteurs invalides (ex: `MultipleWeightEntry.test.tsx`) pour qu'ils ciblent les bons labels ou `data-testid`.
- [ ] **Passe de Correction Générale :**
    - [ ] Parcourir les autres erreurs et appliquer les corrections nécessaires pour faire passer un maximum de tests.

## Dev Notes

-   C'est une tâche de maintenance critique. Sans une suite de tests fiable, nous naviguons à l'aveugle.
-   L'objectif n'est pas nécessairement d'atteindre 100% de tests passants si certains sont fondamentalement obsolètes, mais de restaurer un état où la grande majorité des tests sont verts et fiables.

## Definition of Done

- [ ] La commande `npm run test:run` s'exécute avec succès et la majorité des tests passent.
- [ ] Les problèmes spécifiques identifiés (`authStore.logout`, `MultipleWeightEntry`) sont résolus.
- [ ] La story a été validée par un agent QA.