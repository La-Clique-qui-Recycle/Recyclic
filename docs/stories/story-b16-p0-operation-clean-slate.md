# User Story (Épique Technique): Opération "Clean Slate" - Refactorisation Complète du Déploiement Frontend

**ID:** STORY-B16-P0
**Titre:** Refactoriser intégralement la configuration et le code d'accès API du frontend pour garantir un déploiement stable et sécurisé.
**Epic:** Déploiement & Mise en Production
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** auditer et corriger l'intégralité de la chaîne de build et d'exécution du frontend en une seule passe,
**Afin d'**éradiquer définitivement les erreurs "Mixed Content" et "404", de stabiliser le déploiement, et de garantir que le code exécuté en production est bien celui qui a été validé.

## Contexte

Suite à de multiples échecs de déploiement causés par une corruption de l'état des fichiers et des configurations divergentes, une refactorisation complète est nécessaire. Cette story sert de "master plan" et doit être exécutée méticuleusement, en considérant que toutes les modifications précédentes ont pu échouer.

## Critères d'Acceptation (Checklist d'Exécution)

### 1. Centraliser la Configuration de l'API
- [ ] **Vérifier/Créer** le fichier `frontend/src/api/axiosClient.ts`.
- [ ] **Contenu requis :** Il DOIT créer et exporter une instance `axios` unique. Sa `baseURL` DOIT être configurée **uniquement** avec `import.meta.env.VITE_API_URL`, sans aucune valeur par défaut (fallback).
- [ ] **Vérifier/Ajouter** l'intercepteur qui ajoute le token `Authorization` à chaque requête.

### 2. Éradiquer les Clients API Multiples
- [ ] **Auditer** l'ensemble du répertoire `frontend/src/`.
- [ ] **Modifier** tous les fichiers utilisant `axios` ou `fetch` (spécifiquement `authService.ts`, `Profile.tsx`, et le code dans `frontend/src/generated/`).
- [ ] **Action :** Ils DOIVENT tous importer et utiliser l'instance unique de `axiosClient.ts`. Supprimez toute logique de création de `baseURL` locale.

### 3. Purger le Schéma OpenAPI
- [ ] **Ouvrir** le fichier `api/openapi.json`.
- [ ] **Vérifier/Supprimer** l'intégralité de la section `"servers"`. Elle ne doit pas exister.

### 4. Corriger le `Dockerfile` du Frontend
- [ ] **Ouvrir** le fichier `frontend/Dockerfile`.
- [ ] **Vérifier/Ajouter** la ligne `RUN apk add --no-cache curl` pour le healthcheck.
- [ ] **Vérifier/Corriger** les lignes `ARG` et `ENV` pour qu'elles utilisent `VITE_API_URL`.
- [ ] **Vérifier/Ajouter** la commande `echo` de débogage : `RUN echo "----> Building with API URL: $VITE_API_URL" && npm run build`.
- [ ] **Vérifier/Corriger** la ligne `COPY` pour qu'elle pointe vers le bon répertoire de build (`/app/dist`).
- [ ] **Vérifier/Ajouter** la commande "Terre Brûlée" : `RUN rm -rf /usr/share/nginx/html/*` juste avant le `COPY` final.

### 5. Corriger la Configuration NGINX
- [ ] **Ouvrir** le fichier `frontend/nginx.conf`.
- [ ] **Vérifier/Ajouter** la configuration complète qui gère le `root`, le `try_files` pour la SPA, un `location /health` dédié, et les en-têtes `X-Forwarded-Proto`.

### 6. Rendre la Configuration `docker-compose` Cohérente
- [ ] **Ouvrir** le fichier `docker-compose.yml` (fichier de base).
- [ ] **Vérifier/Corriger** la variable d'argument de build du service `frontend` pour qu'elle soit `VITE_API_URL: ""`.
- [ ] **Vérifier/Corriger** le `healthcheck` du service `frontend` pour qu'il utilise `curl` et pointe vers `http://localhost/health`.
- [ ] **Ouvrir** le fichier `docker-compose.vps.yml` (fichier de surcharge).
- [ ] **Vérifier/Corriger** l'argument de build du service `frontend` pour qu'il soit `VITE_API_URL: "https://recyclic.jarvos.eu/api"` **(AVEC `/api`)**.

### 7. Créer un `.dockerignore` Robuste
- [ ] **Vérifier/Créer** le fichier `frontend/.dockerignore`.
- [ ] **Vérifier/Ajouter** `node_modules`, `dist`, `build`, et tous les types de fichiers `.env` (`.env`, `.env.local`, etc.).

## Definition of Done

- [ ] Toutes les actions de la checklist sont complétées et vérifiées par l'agent.
- [ ] L'agent exécute `git status` et confirme que de multiples fichiers ont été modifiés.
- [ ] L'agent exécute `git add .`, `git commit -m "Opération Clean Slate"`, et `git push`.
- [ ] Le log du `git push` est fourni comme preuve de la complétion de la mission.
- [ ] La story est validée par le Product Owner après confirmation du succès du déploiement par l'utilisateur.
