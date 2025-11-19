---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.730604
original_path: docs/stories/story-bug-b10-ticket-crash.md
---

# Story (Bug): Correction Page Blanche sur le Ticket de Caisse

**ID:** STORY-BUG-B10-TICKET-CRASH
**Titre:** Correction du Bug Critique d'Affichage du Ticket de Caisse (Page Blanche)
**Epic:** Refonte du Workflow de Caisse
**Priorité:** P0 (Critique)
**Statut:** Approuvée

---

## User Story

**En tant que** Caissier,
**Je veux** que l'interface de caisse s'affiche correctement sans erreur,
**Afin de** pouvoir enregistrer des ventes.

## Contexte

Suite aux modifications de la story `STORY-B10-P1` (logique du poids), l'interface de caisse (`/cash-register/sale`) affiche une page blanche. La console du navigateur indique une erreur `TypeError: Cannot read properties of undefined (reading 'toFixed')` dans le composant `Ticket.tsx`. C'est une régression critique qui bloque toute utilisation de la caisse.

## Acceptance Criteria

1.  La page `/cash-register/sale` s'affiche et est de nouveau fonctionnelle.
2.  L'erreur `TypeError` dans la console est résolue.
3.  Le ticket de caisse affiche correctement les lignes de vente avec la nouvelle structure de données (utilisant le champ `price` et non un ancien champ `total`).

## Tasks / Subtasks

- [ ] **Investigation :**
    - [ ] Confirmer que l'erreur se produit à la ligne 253 du fichier `frontend/src/components/business/Ticket.tsx`.
    - [ ] Analyser la structure de données des lignes de vente (`sale items`) qui sont passées à ce composant pour identifier le champ qui est `undefined`.
- [ ] **Correction :**
    - [ ] Modifier le composant `Ticket.tsx` pour qu'il utilise le champ de données correct (probablement `item.price`) pour l'affichage, au lieu de l'ancien champ qui n'existe plus.
- [ ] **Validation & Prévention :**
    - [ ] Ajouter un test unitaire ou d'intégration sur le composant `Ticket.tsx` qui lui passe un exemple de ligne de vente et vérifie qu'il s'affiche correctement sans erreur. Ce test doit prévenir cette régression à l'avenir.

## Dev Notes

-   **Cause Racine Probable :** La story `STORY-B10-P1` a modifié la logique de calcul du total d'une ligne de vente. Le composant `Ticket.tsx` n'a probablement pas été mis à jour pour refléter ce changement et tente d'accéder à un champ de données qui n'est plus fourni.
-   **Urgence :** Ce bug est bloquant. Sa résolution est la priorité absolue.

## Definition of Done

- [ ] L'interface de caisse est de nouveau fonctionnelle.
- [ ] Un test de non-régression a été ajouté pour le composant `Ticket.tsx`.
- [ ] La story a été validée par un agent QA.