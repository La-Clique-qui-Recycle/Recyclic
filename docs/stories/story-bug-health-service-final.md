# Story (Bug): Corriger les URLs du Service de Santé

**ID:** STORY-BUG-HEALTH-SERVICE-FINAL
**Titre:** [BUG] Corriger les URLs d'Appel dans `healthService.ts`
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Administrateur,
**Je veux** que la page de santé du système s'affiche correctement,
**Afin de** pouvoir monitorer l'état de l'application.

## Contexte Critique

Un diagnostic approfondi (voir `STORY-DEBUG-HEALTH-PAGE-404`) a identifié avec certitude la cause racine de l'erreur 404 sur la page `/admin/health`. Le problème vient exclusivement du fichier `frontend/src/services/healthService.ts`.

Les URLs utilisées dans ce service omettent le préfixe de version `/v1`, ce qui les rend incompatibles avec la configuration du backend. Par exemple, il appelle `/admin/health` au lieu de l'URL correcte `/v1/admin/health`.

## Acceptance Criteria

1.  Toutes les URLs d'appel API dans le fichier `frontend/src/services/healthService.ts` sont corrigées pour inclure le préfixe `/v1`.
2.  Après la correction, la page `/admin/health` se charge et affiche les informations de santé du système sans aucune erreur 404.

## Tasks / Subtasks

- [ ] **Refactoring de `healthService.ts` :**
    - [ ] Ouvrir le fichier `frontend/src/services/healthService.ts`.
    - [ ] Pour chaque fonction (`getSystemHealth`, `getAnomalies`, `getSchedulerStatus`, `sendTestNotification`), ajouter le préfixe `/v1` au début de la chaîne de caractères de l'URL.
    - [ ] **Exemple de transformation :**
        - **Avant :** `api.get('/admin/health')`
        - **Après :** `api.get('/v1/admin/health')`
- [ ] **Validation :**
    - [ ] Lancer l'environnement de développement local (`docker compose up -d --build`).
    - [ ] Naviguer vers la page `/admin/health` et vérifier qu'elle s'affiche et charge les données correctement.

## Dev Notes

-   Cette correction est chirurgicale et ne concerne qu'un seul fichier.
-   Elle aligne le `healthService` sur le standard de nommage d'URL utilisé par tous les autres services fonctionnels de l'application.

## Definition of Done

- [ ] L'erreur 404 sur la page de santé est résolue.
- [ ] La story a été validée par un agent QA.