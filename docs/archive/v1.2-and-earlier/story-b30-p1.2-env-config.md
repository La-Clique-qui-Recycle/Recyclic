# Story (Technique): Configuration des Environnements Vite et Dockerfile

**ID:** STORY-B30-P1.2-ENV-CONFIG
**Titre:** Mise en Place des Environnements Vite et d'un Dockerfile Dynamique
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)
**Statut:** Done

---

## User Story

**En tant que** Développeur,
**Je veux** des fichiers d'environnement (`.env`) distincts pour chaque environnement (dev, staging, prod) et un `Dockerfile` de production capable de les utiliser,
**Afin de** préparer une architecture de déploiement propre et adaptable.

## Acceptance Criteria

1.  Les fichiers `frontend/.env.development`, `frontend/.env.production`, et `frontend/.env.staging` sont créés avec les bonnes valeurs pour `VITE_API_URL`.
2.  Le `Dockerfile` de production (`frontend/Dockerfile`) est modifié pour accepter un argument de build `APP_ENV`.
3.  En fonction de l'argument `APP_ENV`, le `Dockerfile` copie le bon fichier `.env` (ex: `.env.production`) dans le conteneur avant l'étape de `build`.

## Tasks / Subtasks

- [x] **Création des Fichiers d'Environnement :**
    - [x] Créer `frontend/.env.development` (`VITE_API_URL=`).
    - [x] Créer `frontend/.env.production` (`VITE_API_URL=https://recyclic.jarvos.eu/api`).
    - [x] Créer `frontend/.env.staging` (`VITE_API_URL=https://devrecyclic.jarvos.eu/api`).
- [x] **Modification du Dockerfile de Production :**
    - [x] Ajouter `ARG APP_ENV=production` au début du `frontend/Dockerfile`.
    - [x] Ajouter une étape `COPY .env.${APP_ENV} ./.env` avant la commande `RUN npm run build`.

## Dev Notes

-   **Dépendance :** Cette story dépend de la fin de `STORY-B30-P1.1-API-CLIENT`.
-   Cette étape est cruciale pour que le même artefact Docker puisse être configuré pour différents environnements cibles.

## Definition of Done

- [x] Les fichiers `.env` sont créés.
- [x] Le `Dockerfile` de production est dynamique.
- [x] La story a été validée par un agent QA.

## QA Results

- Gate: PASS → `docs/qa/gates/b30.p1.2-env-config.yml`
- Findings:
  - [info] ENV: Les fichiers `.env.*` existent et contiennent `VITE_API_URL`.
  - [info] Dockerfile: `ARG APP_ENV` et copie de `.env.${APP_ENV}` effectives avant build.
  - [info] `.dockerignore` ajouté (ignore `node_modules`, `.git`, `.env.local`, `coverage`, `dist`).
- Build examples:
  - `docker build -f frontend/Dockerfile --build-arg APP_ENV=development .`
  - `docker build -f frontend/Dockerfile --build-arg APP_ENV=staging .`
  - `docker build -f frontend/Dockerfile --build-arg APP_ENV=production .`
- Validation builds:
  - ✅ `test-frontend-dev` (development) - 42s build time
  - ✅ `test-frontend-prod` (production) - 28s build time
  - ✅ `.dockerignore` optimisé (725kB context vs 716MB précédemment)

## Dev Agent Record

### Completion Notes
- Création des fichiers `frontend/.env.development`, `.env.staging`, `.env.production` avec `VITE_API_URL` appropriés.
- `frontend/Dockerfile` mis à jour avec `ARG APP_ENV`, copie de `.env.${APP_ENV}` vers `.env`, puis build.

### File List
- Ajout: `frontend/.env.development`
- Ajout: `frontend/.env.staging`
- Ajout: `frontend/.env.production`
- Modifié: `frontend/Dockerfile`

### Change Log
- Implémentation complète des environnements Vite et Dockerfile dynamique.