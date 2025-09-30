# Story: FE - Écran d'Accueil et de Gestion de Poste

**User Story**
En tant que bénévole,
Je veux un écran d'accueil pour la réception qui me permette d'ouvrir mon poste de travail,
Afin de pouvoir commencer ma session de saisie de dépôts.

**Story Context**

*   **Dépendance :** `story-be-api-postes-tickets.md`. L'API pour ouvrir un poste doit exister.
*   **Raison d'être :** Crée le point d'entrée de l'interface de réception.
*   **Technologie :** React.

**Critères d'Acceptation**

1.  Une nouvelle route (ex: `/reception`) doit être ajoutée au routeur frontend pour afficher cet écran.
2.  Si l'utilisateur n'a pas de poste ouvert, l'écran doit afficher un bouton proéminent : "Ouvrir un poste de réception".
3.  Un clic sur ce bouton doit appeler l'API `POST /api/v1/reception/postes/open`.
4.  Une fois le poste ouvert (ou si l'utilisateur en avait déjà un d'ouvert), l'écran doit afficher :
    *   Un message de bienvenue (ex: "Poste de réception ouvert par [Nom de l'utilisateur]").
    *   L'heure d'ouverture du poste.
    *   Un bouton "Nouveau Ticket".
5.  Un clic sur "Nouveau Ticket" doit appeler l'API `POST /api/v1/reception/tickets` et rediriger l'utilisateur vers l'écran de saisie du ticket (défini dans la Story 5), en passant l'ID du nouveau ticket dans l'URL (ex: `/reception/ticket/123`).
6.  Un bouton "Fermer le poste" doit être visible.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/fe-accueil-reception`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.
*   **Implémentation :**
    *   Créer un nouveau composant "page" (ex: `ReceptionHomePage.jsx`).
    *   Utiliser un état local ou un contexte React pour gérer l'état du poste (ouvert/fermé, ID du poste).
    *   Le design de cet écran sera fourni par l'agent UX. Cette story concerne l'implémentation fonctionnelle.

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Création d'une nouvelle page isolée.
*   **Rollback :** Masquer le lien vers la page `/reception`.
