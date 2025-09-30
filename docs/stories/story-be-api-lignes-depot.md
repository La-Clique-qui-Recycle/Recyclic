# Story: BE - API de Gestion des Lignes de Dépôt

**User Story**
En tant que bénévole,
Je veux pouvoir ajouter, modifier et supprimer des lignes (objets) dans un ticket de dépôt,
Afin de refléter précisément les objets reçus.

**Story Context**

*   **Dépendance :** `story-be-api-postes-tickets.md`. Les API pour créer des tickets doivent exister.
*   **Raison d'être :** Fournit la fonctionnalité cœur de la réception : l'enregistrement des objets et de leur poids.
*   **Technologie :** FastAPI, Pydantic, SQLAlchemy.

**Critères d'Acceptation**

1.  **Endpoint 1 : Ajouter une Ligne**
    *   Créer une route `POST /api/v1/reception/lignes`.
    *   L'endpoint doit accepter un corps de requête contenant `ticket_id`, `dom_category_id`, et `poids_kg`.
    *   Il doit créer un nouvel enregistrement dans la table `ligne_depot`.
    *   **Règle métier :** Le `poids_kg` doit être supérieur à zéro. Sinon, retourner une erreur `422 Unprocessable Entity`.
    *   **Règle métier :** On ne peut pas ajouter de ligne à un ticket dont le statut est "fermé". Si c'est le cas, retourner une erreur `409 Conflict`.
2.  **Endpoint 2 : Modifier une Ligne**
    *   Créer une route `PUT /api/v1/reception/lignes/{ligne_id}`.
    *   L'endpoint doit permettre de modifier la `dom_category_id` ou le `poids_kg` d'une ligne existante.
3.  **Endpoint 3 : Supprimer une Ligne**
    *   Créer une route `DELETE /api/v1/reception/lignes/{ligne_id}`.
    *   L'endpoint doit supprimer l'enregistrement correspondant dans la table `ligne_depot`.
4.  Tous les endpoints doivent être protégés et nécessiter un utilisateur authentifié.
5.  Des tests d'intégration doivent être écrits pour chaque endpoint et chaque règle métier.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/be-api-lignes-depot`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.
*   **Implémentation :**
    *   Créer les schémas Pydantic pour les requêtes et réponses.
    *   La logique de validation des règles métier doit être dans la couche de service.

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Création de nouvelles routes.
*   **Rollback :** Désactiver les routes dans le routeur.
