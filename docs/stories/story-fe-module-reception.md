# Story: FE - Module de Réception Unifié

**User Story**
En tant que bénévole,
Je veux accéder à un module de réception simple et direct,
Afin d'enregistrer les dépôts rapidement, sans étapes intermédiaires.

**Story Context**

*   **Dépendances :** `story-be-api-postes-tickets.md` et `story-be-api-lignes-depot.md`. Toutes les API backend doivent être prêtes.
*   **Raison d'être :** Crée l'interface utilisateur complète pour le MVP de la réception, en suivant le parcours utilisateur optimisé défini avec l'agent UX.
*   **Technologie :** React.

**Critères d'Acceptation**

1.  Un bouton/lien "Réception" doit être ajouté au menu de navigation principal de l'application.
2.  Au premier clic sur ce lien, l'application doit **automatiquement** appeler l'API `POST /api/v1/reception/postes/open` en arrière-plan pour créer une session de poste.
3.  L'utilisateur est immédiatement dirigé vers la page principale du module (ex: `/reception`).
4.  Cette page affiche un bouton "Créer un nouveau ticket".
5.  Un clic sur "Nouveau Ticket" appelle l'API `POST /api/v1/reception/tickets` et affiche la vue de saisie du ticket (sur la même page ou via une modale).
6.  La vue de saisie du ticket contient :
    *   Les informations du ticket (ID, etc.).
    *   Sélectionner une catégorie via une grille de 14 boutons (les catégories L1).
    *   Saisir un poids via un pavé numérique.
    *   Choisir une destination (MAGASIN, RECYCLAGE, DECHETERIE).
    *   Valider l'ajout.
    *   Une liste des lignes déjà ajoutées au ticket.
    *   Un bouton "Clôturer le ticket".
7.  Un bouton "Fermer le poste" doit être présent et visible sur l'interface principale du module de réception. Il appelle l'API `POST /api/v1/reception/postes/{poste_id}/close`.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/fe-module-reception`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.
*   **Implémentation :**
    *   Utiliser un Contexte React (`ReceptionContext`) est fortement recommandé pour gérer l'état du poste (ID du poste, statut) à travers tout le module.
    *   Le design final sera fourni par l'agent UX.

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Création d'un nouveau module largement isolé.
*   **Rollback :** Masquer le bouton "Réception" dans le menu principal.
