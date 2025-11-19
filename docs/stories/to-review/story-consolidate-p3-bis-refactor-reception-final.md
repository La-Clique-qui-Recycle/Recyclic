---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:15.003673
original_path: docs/stories/story-consolidate-p3-bis-refactor-reception-final.md
---

# Story (Refactoring): Finalisation de la Migration des Catégories dans la Réception

**ID:** STORY-CONSOLIDATE-P3-BIS
**Titre:** Finalisation de la Migration des Catégories dans le Module Réception
**Epic:** Finalisation de la Migration vers les Catégories Unifiées
**Priorité:** P0 (Critique)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** que le module de Réception utilise exclusivement le champ `category_id`,
**Afin de** finaliser sa migration vers le nouveau système de catégories et de corriger les bugs qui en découlent.

## Contexte

Une investigation a révélé que le module de Réception (`TicketForm.tsx`) a été incomplètement migré. Bien qu'il récupère les catégories depuis le nouveau store, il continue d'envoyer et de lire un champ `dom_category_id` (hérité de l'ancien système) au lieu du nouveau champ `category_id`. Cela cause des erreurs et des incohérences de données.

## Acceptance Criteria

1.  Lors de l'ajout ou de la modification d'une ligne de ticket dans le module de Réception, le payload envoyé à l'API utilise le champ `category_id`.
2.  Lors de l'affichage d'un ticket de réception, le nom de la catégorie est récupéré en utilisant la correspondance avec `category_id`.
3.  Toutes les références à `dom_category_id` sont supprimées du fichier `TicketForm.tsx` et de ses dépendances.
4.  Le module de Réception est de nouveau 100% fonctionnel.

## Tasks / Subtasks

- [ ] **Refactoring `TicketForm.tsx` :**
    - [ ] Dans les fonctions `handleAddLine` et `handleUpdateLine`, remplacer le champ `dom_category_id` par `category_id` dans l'objet envoyé à l'API.
    - [ ] Dans la fonction `handleEditLine`, s'assurer de peupler l'état avec `line.category_id`.
    - [ ] Dans la partie JSX qui affiche le ticket (`DrawerContent`), modifier la logique d'affichage pour trouver le nom de la catégorie en utilisant `line.category_id`.
- [ ] **Vérification Backend :** Confirmer que l'endpoint de l'API de réception attend bien un champ `category_id` (ce qui devrait être le cas suite à la story `STORY-CONSOLIDATE-P3`).
- [ ] **Tests :**
    - [ ] Mettre à jour les tests existants pour `TicketForm.tsx` pour qu'ils utilisent et vérifient `category_id`.
    - [ ] Effectuer un test manuel complet du flux de réception pour valider la correction.

## Dev Notes

-   Cette story corrige une régression introduite par une migration incomplète. Elle est critique pour la stabilité du module de Réception.
-   Le travail est très ciblé sur le fichier `frontend/src/pages/Reception/TicketForm.tsx`.

## Definition of Done

- [ ] Le module de Réception utilise exclusivement `category_id`.
- [ ] Le flux de création et d'édition de ticket de réception est entièrement fonctionnel.
- [ ] La story a été validée par un agent QA.