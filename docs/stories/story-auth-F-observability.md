---
story_id: auth.F
epic_id: auth-refactoring
title: "Story F: Ajout de la Robustesse et de l'Observabilité"
status: Ready
---

### User Story

**En tant que** mainteneur du système,
**Je veux** que le nouveau service d'authentification soit performant et observable,
**Afin de** garantir une expérience utilisateur fiable et de pouvoir diagnostiquer les problèmes de sécurité ou de performance.

### Critères d'Acceptation

1.  L'endpoint `POST /auth/login` a un temps de réponse moyen inférieur à 300ms en conditions de charge normales.
2.  Les tentatives de connexion réussies sont enregistrées (log) au niveau `INFO`, en incluant l'ID de l'utilisateur.
3.  Les tentatives de connexion échouées sont enregistrées (log) au niveau `WARN`, en incluant le nom d'utilisateur utilisé et l'adresse IP source.
4.  Un monitoring de base est en place pour suivre le taux d'erreur de l'endpoint `/auth/login`.

---

### Dev Notes

#### Contexte

Cette story réintroduit les exigences non-fonctionnelles (NFRs) de l'epic original. Le flux d'authentification étant complet, il s'agit maintenant de le renforcer.

#### Références Architecturales Clés

1.  **Monitoring**: La section 9.4 du document `docs/architecture/architecture.md` mentionne l'utilisation de **Prometheus/Grafana** et **Sentry**. L'implémentation doit s'aligner avec les outils déjà en place.
2.  **Logging**: Utiliser le module standard `logging` de Python, configuré pour l'application FastAPI.

#### Fichiers Cibles

-   **Endpoint de Login**: `api/src/recyclic_api/api/api_v1/endpoints/auth.py` est le fichier principal à modifier.
-   **Tests de Performance**: Créer un nouveau script de test, par exemple `api/tests/load/test_login_performance.py`.

---

### Tasks / Subtasks

1.  **(AC: 2, 3)** **Implémenter le Logging**:
    -   Dans `api/src/recyclic_api/api/api_v1/endpoints/auth.py`, injecter ou importer le logger de l'application.
    -   Dans le chemin de code du login réussi, ajouter la ligne de log : `logger.info(f"Successful login for user_id: {user.id}")`.
    -   Dans les chemins de code où la connexion échoue, ajouter la ligne de log : `logger.warning(f"Failed login attempt for username: {payload.username}, IP: {request.client.host}")`.

2.  **(AC: 4)** **Implémenter le Monitoring de Base**:
    -   Vérifier si une librairie client pour Prometheus (ex: `prometheus-fastapi-instrumentator`) ou Sentry est déjà configurée.
    -   **Si oui** : Créer une métrique de type `Counter` (ex: `LOGIN_ERRORS_TOTAL`) et l'incrémenter à chaque fois qu'une `HTTPException` de statut 401 est levée.
    -   **Si non** : Ajouter un commentaire `// TODO: Add Prometheus/Sentry metric for login errors` à l'endroit approprié.

3.  **(AC: 1)** **Valider la Performance**:
    -   Créer un nouveau script de test (ex: `api/tests/load/test_login_performance.py`).
    -   Utiliser `httpx` et `asyncio` pour envoyer un grand nombre de requêtes (ex: 100 requêtes avec une concurrence de 10) à l'endpoint `/auth/login`.
    -   Mesurer le temps de réponse moyen et faire échouer le test s'il dépasse 300ms.

4.  **Ajouter des Tests Unitaires pour les Logs**:
    -   Dans un fichier de test approprié, utiliser `unittest.mock.patch` pour mocker le logger.
    -   Vérifier que `logger.info` et `logger.warning` sont appelés avec les bons messages dans les cas de succès et d'échec.
