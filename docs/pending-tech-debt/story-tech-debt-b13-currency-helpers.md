---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.757461
original_path: docs/stories/story-tech-debt-b13-currency-helpers.md
---

# Story (Dette Technique): Centralisation des Utilitaires Monétaires

**ID:** STORY-TECH-DEBT-B13-HELPERS
**Titre:** Centralisation des Utilitaires de Formatage Monétaire
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Basse)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** un ensemble unique de fonctions utilitaires pour formater et arrondir les prix,
**Afin de** garantir la cohérence de l'affichage des montants dans toute l'application et de simplifier la maintenance.

## Acceptance Criteria

1.  Un nouveau fichier utilitaire (ex: `frontend/src/utils/currency.ts`) est créé.
2.  Ce fichier contient des fonctions exportables pour le formatage des prix (ex: `formatPrice(12.3)` -> `"12,30 €"`) et pour les arrondis.
3.  Les composants qui manipulent des prix (ex: dans les modules Caisse et Réception) sont refactorisés pour utiliser ces nouvelles fonctions utilitaires.
4.  Toute logique de formatage dupliquée est supprimée.

## Tasks / Subtasks

- [ ] **Création de l'Utilitaire :**
    - [ ] Créer le fichier `frontend/src/utils/currency.ts`.
    - [ ] Y implémenter une fonction `formatPrice` qui prend un nombre et retourne une chaîne de caractères formatée en euros.
    - [ ] Y ajouter d'autres fonctions utiles si nécessaire (ex: `roundToTwoDecimals`).
- [ ] **Refactoring :**
    - [ ] Identifier tous les composants qui effectuent manuellement un formatage de prix.
    - [ ] Remplacer ces logiques manuelles par des appels à la nouvelle fonction `formatPrice`.
- [ ] **Tests :**
    - [ ] Créer un fichier de test pour `currency.ts` et ajouter des tests unitaires pour valider le bon fonctionnement des fonctions de formatage.

## Dev Notes

-   Cette story est issue des recommandations de QA de l'epic B13.
-   La centralisation de cette logique est une bonne pratique qui évite les incohérences (ex: un endroit qui affiche "12,3 €" et un autre "12.30 EUR") et facilite les changements futurs.

## Definition of Done

- [ ] Les utilitaires monétaires sont centralisés et testés.
- [ ] Les composants concernés utilisent les nouvelles fonctions.
- [ ] La story a été validée par un agent QA.