# Story (Frontend): Implémentation de la Page Principale avec Ticket Global

**ID:** STORY-B12-P4
**Titre:** Implémentation de la Page Principale de la Caisse avec Ticket Global
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Caissier,  
**Je veux** que la page principale de la caisse affiche la liste des catégories pour démarrer une nouvelle saisie, ainsi qu'un résumé du ticket en cours,  
**Afin de** garder une vue d'ensemble de la vente en cours tout en ajoutant de nouveaux articles.

## Contexte

Cette story crée la page d'accueil du module de caisse, qui sert de point de départ et de point de retour pour chaque cycle de saisie d'article. Elle doit permettre de visualiser le ticket en cours de construction.

## Critères d'Acceptation

1.  La page principale de la caisse est structurée en deux panneaux principaux, inspirés du layout du module de Réception.
    -   **Panneau de Gauche :** Affiche la grille des 14 catégories principales pour démarrer le workflow de saisie.
    -   **Panneau de Droite :** Affiche le "Ticket Global" en cours.
2.  Le **Ticket Global** affiche :
    -   La liste des lignes déjà ajoutées (avec catégorie, sous-catégorie, quantité, poids, prix).
    -   Le total du ticket (somme des prix de chaque ligne).
3.  Chaque ligne dans le Ticket Global a des boutons "Modifier" et "Supprimer".
    -   Un clic sur "Modifier" doit ramener l'utilisateur dans l'assistant de saisie, pré-rempli avec les données de cette ligne, pour permettre la correction.
4.  Un bouton "Valider le ticket" est présent sous le résumé du ticket.
5.  Les deux panneaux (Catégories et Ticket) sont **redimensionnables**, en utilisant la bibliothèque `react-resizable-panels` comme dans le module de Réception.

## Notes Techniques

-   **Dépendance :** Cette story dépend de `STORY-B12-P3`.
-   **Références Techniques :** L'agent DEV doit se baser sur l'implémentation de `frontend/src/pages/Reception/TicketForm.tsx` pour le layout en panneaux redimensionnables et la persistance des préférences de taille dans le `localStorage`.

## Definition of Done

- [ ] La page principale de la caisse est fonctionnelle avec ses deux panneaux.
- [ ] Le Ticket Global affiche correctement les lignes et le total.
- [ ] La modification d'une ligne est fonctionnelle.
- [ ] Les panneaux sont redimensionnables.
- [ ] La story a été validée par le Product Owner.
