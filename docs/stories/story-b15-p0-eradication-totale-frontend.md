# Story (Épique Technique): Éradication Totale de la Configuration API et Déploiement Frontend

**ID:** STORY-B15-P1
**Titre:** Refactoriser l'accès API du frontend et corriger le déploiement pour éliminer les erreurs "Mixed Content"
**Epic:** Déploiement & Mise en Production
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** refactoriser toute la gestion des appels API du frontend, et corriger la chaîne de build et de déploiement,
**Afin d'**éliminer définitivement les erreurs "Mixed Content" et "404" en production, et de stabiliser le processus pour l'avenir.

## Contexte

Une longue session de débogage a révélé de multiples problèmes architecturaux et de configuration dans le frontend, causant des erreurs persistantes en production. Les problèmes incluent des clients API multiples, des variables d'environnement incorrectes, des chemins de build erronés et des configurations NGINX/Docker défaillantes. Cette story a pour but de corriger **toutes** ces erreurs en une seule opération.

## Critères d'Acceptation / Plan d'Action

### 1. Centralisation du Client API ("Source Unique")

- [x] **Créer** le fichier `frontend/src/api/axiosClient.ts`.
- [x] Ce fichier doit exporter une **instance unique d'axios**.
- [x] La `baseURL` de cette instance doit être lue depuis `import.meta.env.VITE_API_URL`.
- [x] Un **intercepteur de requête** doit être ajouté pour injecter automatiquement le token d'authentification (`Authorization: Bearer ...`) depuis le `localStorage`.
- [x] Un **intercepteur de réponse** doit être ajouté pour gérer les erreurs 401/403 (déconnexion et redirection vers `/login`).

### 2. Éradication des Clients Multiples

- [x] **Refactoriser** le client auto-généré `frontend/src/generated/api.ts` pour qu'il importe et utilise l'instance unique de `axiosClient` au lieu de créer la sienne.
- [x] **Refactoriser** le service `frontend/src/services/authService.ts` pour qu'il utilise `axiosClient` au lieu de `fetch`.
- [x] **Auditer** l'ensemble du répertoire `frontend/src/` et remplacer toute autre utilisation manuelle de `axios` ou `fetch` par `axiosClient`.

### 3. Correction du Schéma et de la Génération

- [x] **Vérifier** le fichier `api/openapi.json` et **supprimer** la section `"servers"` si elle existe, pour éviter d'embarquer une URL par défaut.
- [ ] **(Action Manuelle Utilisateur)** L'utilisateur devra lancer le script `npm run codegen` dans le dossier `frontend` pour re-générer le client API sur la base du schéma nettoyé.

### 4. Correction de la Chaîne de Build et Déploiement

- [x] **Corriger `frontend/Dockerfile`** : La ligne `COPY` doit utiliser le bon dossier de sortie du build, qui est `/app/dist` (vérifié dans `vite.config.js`).
- [x] **Corriger `docker-compose.vps.yml`** : L'argument de build pour le service `frontend` doit être `VITE_API_URL` (et non `REACT_APP_API_URL`) et doit contenir l'URL de base sans `/api` (ex: `https://recyclic.jarvos.eu`).
- [x] **Corriger `frontend/nginx.conf`** : La configuration doit correctement gérer le header `X-Forwarded-Proto` pour forcer le HTTPS et éviter les erreurs "Mixed Content".
- [x] **Corriger `docker-compose.yml`** : Le `healthcheck` du service `frontend` doit utiliser `curl` (qui doit être installé dans le `Dockerfile`) et pointer vers un endpoint `/health` fiable défini dans `nginx.conf`.

## Definition of Done

- [x] Toutes les actions ci-dessus sont complétées et vérifiées.
- [ ] La procédure de déploiement "Terre Brûlée" (`build --no-cache` et `up --force-recreate`) aboutit sans erreur.
- [ ] L'application est entièrement fonctionnelle en production sur toutes ses pages (Sites, Reception, etc.).
- [ ] Il n'y a plus aucune erreur "Mixed Content" ou "404" dans la console du navigateur.
- [ ] La story a été validée par le Product Owner.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes
All technical tasks have been completed successfully:

1. ✅ **axiosClient centralization**: The file `frontend/src/api/axiosClient.ts` was already properly implemented with:
   - Single axios instance with `VITE_API_URL` as baseURL
   - Request interceptor for automatic Bearer token injection
   - Response interceptor for 401/403 handling with automatic logout and redirect

2. ✅ **Multiple clients eradication**:
   - `frontend/src/generated/api.ts` already uses the centralized `axiosClient`
   - `frontend/src/services/authService.ts` already uses `axiosClient`
   - `frontend/src/services/api.js` already uses `axiosClient`
   - Audit confirmed no other manual axios/fetch usage exists

3. ✅ **OpenAPI schema verification**: The `api/openapi.json` file does not contain a "servers" section (already clean)

4. ✅ **Build and deployment chain fixes**:
   - `frontend/Dockerfile` line 31: Already correctly uses `/app/dist`
   - `docker-compose.vps.yml` line 35: Already correctly uses `VITE_API_URL: "https://recyclic.jarvos.eu"`
   - `frontend/nginx.conf` lines 6-8: Already handles `X-Forwarded-Proto` correctly
   - `docker-compose.yml` line 117: **FIXED** - Changed from `REACT_APP_API_URL` to `VITE_API_URL`
   - `docker-compose.yml` line 124: Already correctly uses curl for healthcheck

5. ✅ **Build validation**: Frontend build executed successfully with no errors

### File List
**Modified:**
- `docker-compose.yml` (fixed VITE_API_URL build arg)
- `docs/stories/story-b15-p0-eradication-totale-frontend.md` (updated checkboxes)

**Verified (already correct):**
- `frontend/src/api/axiosClient.ts`
- `frontend/src/generated/api.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/services/api.js`
- `frontend/Dockerfile`
- `docker-compose.vps.yml`
- `frontend/nginx.conf`
- `api/openapi.json`

### Change Log
- 2025-10-10: Fixed `docker-compose.yml` to use `VITE_API_URL` instead of `REACT_APP_API_URL` for frontend build arg
- 2025-10-10: Verified all other configurations were already correct
- 2025-10-10: Validated frontend build succeeds

### Status
Ready for deployment testing and validation
