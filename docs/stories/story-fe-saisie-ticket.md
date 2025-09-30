# Story: FE - Écran de Saisie de Ticket

**User Story**
En tant que bénévole,
Je veux une interface simple et rapide pour ajouter des lignes d'objets à un ticket,
Afin d'enregistrer les dépôts efficacement.

**Story Context**

*   **Dépendance :** `story-be-api-lignes-depot.md`. Les API pour gérer les lignes doivent exister.
*   **Raison d'être :** C'est l'écran principal où se déroule la majorité du travail de saisie.
*   **Technologie :** React.

**Critères d'Acceptation**

1.  Une nouvelle route (ex: `/reception/ticket/:ticketId`) doit être créée pour afficher cet écran.
2.  L'écran doit afficher les informations du ticket (ID, heure de création).
3.  Un bouton "Ajouter une ligne" doit être visible.
4.  Un clic sur ce bouton doit ouvrir une modale ou un formulaire permettant de :
    *   Sélectionner une catégorie via une grille de 14 boutons (les catégories L1).
    *   Saisir un poids via un pavé numérique.
    *   Valider l'ajout.
5.  La validation doit appeler l'API `POST /api/v1/reception/lignes`.
6.  Les lignes ajoutées doivent s'afficher dans une liste sur l'écran principal du ticket.
7.  Chaque ligne de la liste doit avoir un bouton pour la modifier ou la supprimer (appelant les API `PUT` et `DELETE` correspondantes).
8.  Un bouton "Clôturer le ticket" doit être visible et appeler l'API `POST /api/v1/reception/tickets/{ticket_id}/close`.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/fe-saisie-ticket`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.
*   **Implémentation :**
    *   Créer un nouveau composant "page" (ex: `TicketPage.jsx`).
    *   L'ID du ticket sera récupéré depuis les paramètres de l'URL.
    *   Le design de cet écran sera fourni par l'agent UX.

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Création d'une nouvelle page.
*   **Rollback :** La page ne sera pas accessible si la redirection depuis l'accueil n'est pas faite.
