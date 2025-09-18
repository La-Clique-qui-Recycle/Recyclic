---
story_id: 3.3
epic_id: 3
title: "Ticket Temps Réel & Gestion Erreurs"
status: Ready
---

### User Story

**En tant que** caissier,
**Je veux** voir un ticket de caisse se mettre à jour en temps réel et pouvoir corriger les erreurs de saisie,
**Afin de** pouvoir suivre la vente précisément et rectifier les erreurs facilement.

### Critères d'Acceptation

1.  Un composant "Ticket" est affiché à côté de l'interface de saisie sur la page `/cash-register/sale`.
2.  Chaque article ajouté via l'interface de vente (Story 5.2) apparaît instantanément comme une nouvelle ligne dans le ticket.
3.  Le ticket affiche un total cumulé qui se met à jour en temps réel à chaque ajout d'article.
4.  Chaque ligne du ticket possède un bouton "Modifier" ou "Supprimer".
5.  La suppression d'une ligne la retire du ticket et met à jour le total.
6.  La modification d'une ligne permet de re-saisir la quantité ou le prix de l'article.
7.  Un bouton "Finaliser la vente" est présent sous le ticket.

---

### Dev Notes

#### Contexte

Cette story s'appuie directement sur la Story 5.2. L'état de la vente en cours (`currentSaleItems`) qui est géré dans le `cashSessionStore` sera la source de données pour ce composant "Ticket".

#### Fichiers Cibles

-   **Page de Vente**: `frontend/src/pages/CashRegister/Sale.tsx` (pour intégrer le nouveau composant).
-   **Composant Ticket**: Créer `frontend/src/components/business/Ticket.tsx`.
-   **Store de Caisse**: `frontend/src/stores/cashSessionStore.ts` (pour ajouter les fonctions de modification/suppression d'articles).

---

### Tasks / Subtasks

1.  **(AC: 1)** **Créer le composant `Ticket.tsx`**:
    -   Créer un nouveau composant qui prend en entrée la liste des articles de la vente (`currentSaleItems` du store).
    -   Le composant doit mapper sur cette liste pour afficher chaque article (catégorie, qté, prix).

2.  **(AC: 2, 3)** **Intégrer le Ticket et le total temps réel**:
    -   Dans `Sale.tsx`, intégrer le composant `Ticket`.
    -   Connecter le composant au `cashSessionStore` pour qu'il se mette à jour automatiquement.
    -   Ajouter un calcul du total dans le store ou le composant et l'afficher.

3.  **(AC: 4, 5, 6)** **Implémenter la modification/suppression dans le store**:
    -   Dans `cashSessionStore.ts`, ajouter les fonctions `removeSaleItem(itemId)` et `updateSaleItem(itemId, newQty, newPrice)`.
    -   Ces fonctions doivent modifier le tableau `currentSaleItems` dans l'état du store.

4.  **(AC: 4, 5, 6)** **Connecter les boutons du Ticket**:
    -   Dans le composant `Ticket.tsx`, ajouter les boutons "Modifier" et "Supprimer" sur chaque ligne.
    -   Lier ces boutons aux nouvelles fonctions du `cashSessionStore`.

5.  **(AC: 7)** **Ajouter le bouton de finalisation**:
    -   Ajouter un bouton "Finaliser la vente" qui, pour l'instant, pourra simplement logger la vente en cours dans la console en attendant la Story 3.4.

6.  **Ajouter les Tests**:
    -   Tests unitaires pour le nouveau composant `Ticket.tsx`.
    -   Mettre à jour les tests pour `cashSessionStore.ts` pour couvrir les nouvelles fonctions de modification et de suppression.
