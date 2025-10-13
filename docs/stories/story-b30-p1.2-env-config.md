# Story (Technique): Configuration des Environnements Vite et Dockerfile

**ID:** STORY-B30-P1.2-ENV-CONFIG
**Titre:** Mise en Place des Environnements Vite et d'un Dockerfile Dynamique
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)

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

- [ ] **Création des Fichiers d'Environnement :**
    - [ ] Créer `frontend/.env.development` (`VITE_API_URL=`).
    - [ ] Créer `frontend/.env.production` (`VITE_API_URL=https://recyclic.jarvos.eu/api`).
    - [ ] Créer `frontend/.env.staging` (`VITE_API_URL=https://devrecyclic.jarvos.eu/api`).
- [ ] **Modification du Dockerfile de Production :**
    - [ ] Ajouter `ARG APP_ENV=production` au début du `frontend/Dockerfile`.
    - [ ] Ajouter une étape `COPY .env.${APP_ENV} ./.env` avant la commande `RUN npm run build`.

## Dev Notes

-   **Dépendance :** Cette story dépend de la fin de `STORY-B30-P1.1-API-CLIENT`.
-   Cette étape est cruciale pour que le même artefact Docker puisse être configuré pour différents environnements cibles.

## Definition of Done

- [ ] Les fichiers `.env` sont créés.
- [ ] Le `Dockerfile` de production est dynamique.
- [ ] La story a été validée par un agent QA.