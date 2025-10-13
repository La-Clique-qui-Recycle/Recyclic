# Story (Technique): Refonte du docker-compose.yml avec Profiles

**ID:** STORY-B30-P1.3-DOCKER-COMPOSE
**Titre:** Unification du docker-compose.yml avec des Profiles de Déploiement
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)

---

## User Story

**En tant que** Développeur,
**Je veux** un fichier `docker-compose.yml` unique qui gère tous les environnements (dev, staging, prod) grâce à des "profiles",
**Afin de** simplifier radicalement les commandes de déploiement et d'éliminer les fichiers de configuration dupliqués.

## Acceptance Criteria

1.  Les anciens fichiers `docker-compose.dev.yml` et `docker-compose.vps.yml` sont supprimés.
2.  Un unique fichier `docker-compose.yml` est créé.
3.  Ce fichier définit un service `frontend-dev` sous le `profile: ["dev"]`.
4.  Ce fichier définit un service `frontend-prod` sous le `profile: ["prod"]`, qui passe l'argument `APP_ENV=production` au build.
5.  Ce fichier définit un service `frontend-staging` sous le `profile: ["staging"]`, qui passe l'argument `APP_ENV=staging` au build.

## Tasks / Subtasks

- [ ] **Nettoyage :** Supprimer les fichiers `docker-compose.dev.yml` et `docker-compose.vps.yml`.
- [ ] **Création du `docker-compose.yml` Unifié :**
    - [ ] Définir tous les services communs (api, postgres, etc.).
    - [ ] Créer la section `services.frontend-dev` avec `profiles: ["dev"]`, le mapping de port et le montage de volume.
    - [ ] Créer la section `services.frontend-prod` avec `profiles: ["prod"]`, les labels Traefik et l'argument de build `APP_ENV: production`.
    - [ ] Créer la section `services.frontend-staging` avec `profiles: ["staging"]`, les labels Traefik et l'argument de build `APP_ENV: staging`.

## Dev Notes

-   **Dépendance :** Cette story dépend de la fin de `STORY-B30-P1.2-ENV-CONFIG`.
-   Cette étape finalise l'architecture de déploiement unifiée.

## Definition of Done

- [ ] Le `docker-compose.yml` unifié est fonctionnel.
- [ ] La commande `docker compose --profile dev up` fonctionne.
- [ ] La commande `docker compose --profile prod up` fonctionne.
- [ ] La commande `docker compose --profile staging up` fonctionne.
- [ ] La story a été validée par un agent QA.