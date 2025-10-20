# Story (Bug): Corriger les Appels API du Service de Santé

**ID:** STORY-BUG-HEALTH-SERVICE-URLS
**Titre:** [BUG] Corriger les URLs d'Appel API dans `healthService.ts`
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Administrateur,
**Je veux** que la page de santé du système s'affiche correctement,
**Afin de** pouvoir monitorer l'état de l'application.

## Contexte Critique

Actuellement, la page `/admin/health` est cassée et affiche une erreur "Impossible de récupérer les métriques de santé". La console du navigateur montre une erreur **HTTP 404 (Not Found)** sur l'appel à `http://localhost:4444/api/admin/health`.

La cause est une incohérence dans le fichier `frontend/src/services/healthService.ts`. Les URLs d'appel API n'incluent pas le préfixe `/api/v1` nécessaire, ce qui les rend incompatibles avec la configuration du backend et du proxy.

## Acceptance Criteria

1.  Toutes les URLs d'appel API dans le fichier `frontend/src/services/healthService.ts` sont corrigées pour inclure le préfixe `/api/v1`.
2.  Après la correction, la page `/admin/health` se charge et affiche les informations de santé du système sans erreur.

## Tasks / Subtasks

- [ ] **Refactoring de `healthService.ts` :**
    - [ ] Ouvrir le fichier `frontend/src/services/healthService.ts`.
    - [ ] Pour chaque fonction (`getSystemHealth`, `getAnomalies`, `getSchedulerStatus`, `sendTestNotification`), ajouter le préfixe `/api/v1` au début de la chaîne de caractères de l'URL.
    - [ ] **Exemple de transformation :**
        - **Avant :** `api.get('/admin/health')`
        - **Après :** `api.get('/api/v1/admin/health')`
- [ ] **Validation :**
    - [ ] Lancer l'environnement de développement local (`docker compose up -d --build`).
    - [ ] Naviguer vers la page `/admin/health` et vérifier qu'elle s'affiche correctement.

## Dev Notes

-   Ce bug est un oubli lors du refactoring général des services API (`STORY-BUG-API-PREFIX`).
-   La correction est simple et consiste à rendre ce fichier cohérent avec tous les autres services.

## Definition of Done

- [ ] L'erreur 404 sur la page de santé est résolue.
- [ ] La story a été validée par un agent QA.