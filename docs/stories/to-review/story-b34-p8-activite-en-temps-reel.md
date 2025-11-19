---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.553498
original_path: docs/stories/story-b34-p8-activite-en-temps-reel.md
---

# Story b34-p8: Fiabilisation du Statut d'Activité en Temps Réel

**Statut:** Ready for Review
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Cette story remplace la story `b33-p3 (Rework)` qui a échoué. L'objectif reste le même : faire en sorte que le statut "En ligne" d'un utilisateur reflète son activité réelle sur l'application, et pas seulement sa dernière connexion. L'analyse de l'échec précédent a montré que la solution la plus simple et la plus robuste est de créer un endpoint de "ping" dédié, plutôt que d'utiliser un middleware complexe.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir un statut "En ligne" fiable et à jour** pour chaque utilisateur, afin de savoir qui utilise activement l'application à un instant T.

## 3. Critères d'Acceptation

**Backend :**
1.  Un nouveau point d'API `POST /v1/activity/ping` DOIT être créé.
2.  Cet endpoint DOIT être protégé (nécessiter une authentification).
3.  Lorsqu'il est appelé, il DOIT utiliser **Redis** pour enregistrer le timestamp actuel dans une clé associée à l'`user_id` de l'utilisateur authentifié (ex: `last_activity:{user_id}`).
4.  Le point d'API `GET /v1/admin/users/statuses` DOIT être modifié. Sa logique pour déterminer si un utilisateur est en ligne doit maintenant :
    a. D'abord, vérifier dans **Redis** s'il existe un timestamp `last_activity` pour l'utilisateur.
    b. Si oui, et s'il date de moins de X minutes, l'utilisateur est "En ligne".
    c. Si non (pas de clé Redis ou clé trop ancienne), il DOIT se rabattre sur la table `login_history` comme il le fait actuellement.
5.  Le point d'API `POST /v1/auth/logout` DOIT être modifié pour **supprimer** la clé `last_activity:{user_id}` de Redis lors de la déconnexion.

**Frontend :**
6.  Un mécanisme DOIT être ajouté à l'application pour appeler l'endpoint `/v1/activity/ping` périodiquement (ex: toutes les 60 secondes) tant que l'utilisateur est authentifié et que la fenêtre du navigateur est active.

**Configuration :**
7.  Le seuil d'activité (15 minutes par défaut) DOIT être configurable via un nouveau champ "Seuil d'activité 'En ligne' (minutes)" sur la page `/admin/settings`.

## 4. Guide d'Implémentation Détaillé

- **Fichiers Backend à modifier :**
  - `api/src/recyclic_api/api/api_v1/endpoints/activity.py` (à créer) : Pour le `POST /ping`.
  - `api/src/recyclic_api/api/api_v1/endpoints/admin.py` : Pour mettre à jour la logique de `GET /users/statuses`.
  - `api/src/recyclic_api/api/api_v1/endpoints/auth.py` : Pour mettre à jour le `POST /logout`.
  - `api/src/recyclic_api/services/settings_service.py` (ou équivalent) : Pour gérer le nouveau paramètre de seuil.

- **Fichiers Frontend à modifier :**
  - `frontend/src/App.jsx` (ou un composant parent) : Pour implémenter l'appel périodique au `ping` (ex: avec un `useEffect` et `setInterval`).
  - `frontend/src/pages/Admin/Settings.tsx` : Pour ajouter le champ de configuration du seuil.

## 5. Prérequis de Test

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1`
- **Compte Utilisateur :** `usertest1`
- **Outils :** Chrome DevTools pour surveiller les appels réseau (`ping`), et un client Redis pour vérifier que les clés `last_activity` sont bien créées et supprimées.

## 6. Notes Techniques

-   La solution du "ping" est préférable au middleware car elle n'impacte pas la performance de toutes les requêtes API. Seul le client actif enverra des pings.
-   La gestion de l'intervalle du ping côté frontend doit être intelligente (ex: utiliser `document.hidden` pour ne pas envoyer de pings si l'onglet n'est pas actif).
-   Le fallback sur `login_history` est une sécurité importante si Redis est indisponible ou si l'utilisateur n'a pas encore d'activité enregistrée.
