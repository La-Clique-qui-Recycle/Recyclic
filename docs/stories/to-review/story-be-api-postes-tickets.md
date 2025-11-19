---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.703803
original_path: docs/stories/story-be-api-postes-tickets.md
---

# Story: BE - API de Gestion des Postes et Tickets

**Statut: Terminé**

**User Story**
En tant que bénévole à la réception,
Je veux pouvoir ouvrir un "poste de réception" et y créer des "tickets de dépôt",
Afin de pouvoir commencer à enregistrer les objets apportés par les usagers.

**Story Context**

*   **Dépendance :** Cette story dépend de la `story-db-reception-schema.md`. Les tables `poste_reception` et `ticket_depot` doivent exister.
*   **Raison d'être :** Crée les fondations de l'API pour le processus de réception. Fournit les endpoints nécessaires pour que le frontend puisse initialiser une session de travail.
*   **Technologie :** FastAPI, Pydantic, SQLAlchemy.

**Critères d'Acceptation**

1.  Un nouveau fichier de routeur (ex: `api/src/recyclic_api/api/api_v1/endpoints/reception.py`) doit être créé.
2.  **Endpoint 1 : Ouvrir un Poste**
    *   Créer une route `POST /api/v1/reception/postes/open`.
    *   L'endpoint doit créer un nouvel enregistrement dans la table `poste_reception`.
    *   Il doit associer le poste à l'utilisateur authentifié (`opened_by_user_id`).
    *   Il doit retourner l'ID du poste créé et son statut "ouvert".
3.  **Endpoint 2 : Fermer un Poste**
    *   Créer une route `POST /api/v1/reception/postes/{poste_id}/close`.
    *   L'endpoint doit mettre à jour le statut du poste correspondant à "fermé" et enregistrer l'heure de fermeture (`closed_at`).
    *   **Règle métier :** Un poste ne peut être fermé que s'il ne contient aucun ticket en statut "ouvert". Si des tickets sont ouverts, retourner une erreur `409 Conflict`.
4.  **Endpoint 3 : Créer un Ticket**
    *   Créer une route `POST /api/v1/reception/tickets`.
    *   L'endpoint doit accepter un `poste_id` dans le corps de la requête.
    *   Il doit créer un nouvel enregistrement dans la table `ticket_depot`, en l'associant au poste et à l'utilisateur authentifié.
    *   Il doit retourner l'ID du ticket créé.
5.  **Endpoint 4 : Clôturer un Ticket**
    *   Créer une route `POST /api/v1/reception/tickets/{ticket_id}/close`.
    *   L'endpoint doit mettre à jour le statut du ticket à "fermé" et enregistrer l'heure de fermeture.
6.  Tous les endpoints doivent être protégés et nécessiter un utilisateur authentifié.
7.  Des tests d'intégration doivent être écrits pour chaque endpoint, validant le cas de succès et les cas d'erreur (ex: fermer un poste avec des tickets ouverts).

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche en suivant la convention : `story/be-api-postes-tickets`.
    *   3. Une fois la story terminée et testée, ouvrez une Pull Request pour fusionner votre branche dans `feature/mvp-reception-v1`.
*   **Implémentation :**
    *   Créer les schémas Pydantic nécessaires pour les corps de requête et les réponses.
    *   Créer des fonctions de service dans une couche de logique métier pour gérer les opérations en base de données.
    *   Gérer les erreurs (ex: `404 Not Found` si un ID n'existe pas, `409 Conflict` pour les règles métier) en utilisant les exceptions de FastAPI.

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Il s'agit de la création de nouvelles routes qui n'interfèrent pas avec le code existant.
*   **Rollback :** Les nouvelles routes peuvent être désactivées ou supprimées du routeur principal.

---

Dev Agent Record (implémentation)

- Tâches réalisées:
  - Création du routeur `reception` et des endpoints: ouvrir/fermer poste, créer/clôturer ticket (protégés par auth).
  - Ajout des schémas Pydantic de requêtes/réponses.
  - Service métier avec Repository pattern (Poste, Ticket, User).
  - Tests d'intégration: succès (happy path), 404 ID inconnu, 409 fermeture poste avec ticket ouvert.

- Fichiers modifiés/ajoutés (principaux):
  - `api/src/recyclic_api/api/api_v1/endpoints/reception.py`
  - `api/src/recyclic_api/api/api_v1/endpoints/__init__.py`
  - `api/src/recyclic_api/api/api_v1/api.py`
  - `api/src/recyclic_api/schemas/reception.py`
  - `api/src/recyclic_api/services/reception_service.py`
  - `api/src/recyclic_api/repositories/reception.py`
  - `api/src/recyclic_api/models/__init__.py`
  - `api/tests/test_reception_endpoints.py`
  - `api/create_test_db.py`

- Statut: Prêt pour Review QA (tests d'intégration réception au vert en local).

---

QA Results (by QA)

- Gate Decision: PASS
- Epic: epic-mvp-reception-v1
- Story: story-be-api-postes-tickets
- Slug: be-api-postes-tickets
- Date: 2025-09-30
- Summary: Endpoints reception créés (ouvrir/fermer poste, créer/clôturer ticket), protégés par auth; règles 409 et 404 gérées; tests d'intégration annoncés verts en local.
- Findings:
  - Critères d'acceptation couverts: 4 endpoints + protection auth + erreurs 404/409.
  - Architecture alignée: routeur dédié `reception`, schémas Pydantic, service métier, repository.
  - Traçabilité: endpoints et règles métier reflètent la story; dépend sur schéma DB validé (gate existant PASS).
  - Tests: mentionnés comme verts localement; vérifier intégration CI et cas négatifs supplémentaires (auth manquante, poste inexistant à la création ticket).
  - Sécurité: endpoints protégés; vérifier propagation d'identité utilisateur et contrôle d'accès par rôle si applicable.
- Actions:
  - Ajouter tests pour 401/403 explicites sur chaque endpoint.
  - Ajouter test pour création ticket avec `poste_id` invalide (404) et poste fermé (409/422 selon règle).
  - Vérifier idempotence et erreurs concurrentes lors de fermeture poste (tickets ouverts créés simultanément).
  - Documenter codes de retour dans `openapi.json` (401,403,404,409) et exemples.
  - S'assurer de l'enregistrement `closed_at` et statuts via contraintes ou validations DB.
