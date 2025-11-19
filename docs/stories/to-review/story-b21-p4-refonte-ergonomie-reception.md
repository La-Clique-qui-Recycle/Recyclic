---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.976139
original_path: docs/stories/story-b21-p4-refonte-ergonomie-reception.md
---

# Story (Raffinements UI): Refonte Ergonomique de l'Interface de Réception

**ID:** STORY-B21-P4
**Titre:** Refonte Ergonomique de l'Interface de Réception
**Epic:** Refondation de l'Expérience Utilisateur et de l'Architecture Frontend
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** utilisateur,  
**Je veux** une interface de saisie pour la réception qui soit mieux organisée, plus compacte et plus intuitive,  
**Afin de** pouvoir enregistrer les dépôts de matière plus rapidement et avec moins d'efforts.

## Contexte

L'interface de réception actuelle (`TicketForm.tsx`) souffre de problèmes de layout : les boutons de catégories sont trop petits et le pavé numérique est trop grand, ce qui oblige à scroller. Cette story vise à réorganiser complètement la page en s'inspirant des meilleures pratiques et de la cohérence avec le module de Caisse.

## Critères d'Acceptation

1.  **Nouveau Layout en 3 Colonnes :** La page est réorganisée en un layout à 3 colonnes redimensionnables (en utilisant `react-resizable-panels`) :
    -   **Colonne de Gauche :** Affiche la grille des catégories. La largeur par défaut est augmentée pour que les boutons soient plus grands et plus lisibles.
    -   **Colonne du Milieu (Le "Poste de Travail") :** Contient, de haut en bas : le champ d'affichage du poids, le pavé numérique, le sélecteur de destination, le champ de notes, et le bouton "Ajouter l'objet".
    -   **Colonne de Droite :** Affiche le résumé du ticket en cours (similaire au module de Caisse).

2.  **Fil d'Ariane :** Un fil d'Ariane discret est ajouté en haut de la colonne du milieu pour rappeler la catégorie et la sous-catégorie actuellement sélectionnées.

3.  **Optimisation Verticale :** L'espacement et la taille des composants dans la colonne du milieu sont optimisés pour que tous les contrôles soient visibles sans avoir à scroller sur un écran de tablette standard.

## Notes Techniques

-   **Fichier principal à modifier :** `frontend/src/pages/Reception/TicketForm.tsx`.
-   **Référence de Layout :** L'agent DEV doit s'inspirer de l'implémentation existante de `react-resizable-panels` sur cette même page, mais en réorganisant le contenu des panneaux.
-   **Cohérence :** Le design des composants (boutons, champs de saisie) doit rester cohérent avec le reste de l'application.

## Definition of Done

- [ ] Le nouveau layout à 3 colonnes est implémenté.
- [ ] Le fil d'Ariane est présent et fonctionnel.
- [ ] L'optimisation verticale est effective et le scroll n'est plus nécessaire.
- [ ] La story a été validée par le Product Owner.
