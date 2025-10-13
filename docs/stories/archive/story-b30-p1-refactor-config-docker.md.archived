# User Story (Tâche Technique): Refactorisation du Code et de la Configuration Docker

**ID:** STORY-B30-P1
**Titre:** Implémenter l'architecture "Clean Slate V2" avec des environnements et profiles unifiés
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** refactoriser le code du frontend et la configuration Docker pour utiliser une approche standardisée basée sur les fichiers `.env` et les "profiles" Docker,
**Afin de** résoudre les problèmes de configuration entre les environnements local et production, et de permettre la création d'un environnement de staging.

## Contexte et Leçons Apprises

Cette refactorisation est le résultat d'un débogage complexe. L'historique a montré que des solutions partielles ne sont pas suffisantes. Les problèmes rencontrés incluaient :
- **Conflits de Proxy :** Une mauvaise gestion des en-têtes `X-Forwarded-Proto` par Uvicorn (voir `STORY-B18-P0`).
- **Clients API Multiples :** Coexistence d'un client `axios` manuel et d'un client auto-généré avec des configurations différentes, causant des erreurs "Mixed Content".
- **Environnements Désynchronisés :** Une divergence entre les configurations de build locale (proxy Vite) et de production (NGINX + Traefik) qui a cassé l'environnement de développement.

Cette story a pour but d'appliquer **toutes** ces leçons pour créer une base saine et pérenne.

## Critères d'Acceptation / Plan d'Action

### 1. Nettoyer la Source du Mal
- [ ] **Vérifier/Supprimer** la section `"servers"` du fichier `api/openapi.json`.
- [ ] **(Action Manuelle Post-Story)** L'utilisateur devra être notifié de lancer `npm run codegen` après cette story pour re-générer le client API.

### 2. Centraliser le Client API
- [ ] **Créer/Valider** le fichier `frontend/src/api/axiosClient.ts` qui configure une instance `axios` unique lisant sa `baseURL` depuis `import.meta.env.VITE_API_URL`.
- [ ] **Refactoriser** tous les fichiers du répertoire `frontend/src/` (y compris le code auto-généré) pour qu'ils utilisent cette instance unique.

### 3. Mettre en Place les Environnements Vite
- [ ] **Créer** le fichier `frontend/.env.development` avec le contenu `VITE_API_URL=`.
- [ ] **Créer** le fichier `frontend/.env.production` avec le contenu `VITE_API_URL=https://recyclic.jarvos.eu/api`.
- [ ] **Créer** le fichier `frontend/.env.staging` avec le contenu `VITE_API_URL=https://devrecyclic.jarvos.eu/api`.

### 4. Créer le `docker-compose.yml` Unifié
- [ ] **Supprimer** les anciens fichiers `docker-compose.dev.yml` et `docker-compose.vps.yml`.
- [ ] **Créer** un nouveau fichier `docker-compose.yml` qui contient tous les services (api, postgres, redis, bot, etc.).
- [ ] **Définir un service `frontend-dev`** avec `profiles: ["dev"]`. Ce service doit :
    - Utiliser `Dockerfile.dev`.
    - Mapper le port `4444:5173`.
    - Monter le code source en volume pour le hot-reloading.
- [ ] **Définir un service `frontend-prod`** avec `profiles: ["prod"]`. Ce service doit :
    - Utiliser le `Dockerfile` de production.
    - Utiliser les labels Traefik pour `Host("recyclic.jarvos.eu")`.
- [ ] **Définir un service `frontend-staging`** avec `profiles: ["staging"]`. Ce service doit :
    - Être une copie de `frontend-prod`.
    - Utiliser les labels Traefik pour `Host("devrecyclic.jarvos.eu")`.

### 5. Mettre à Jour le `Dockerfile` de Production
- [ ] Le `Dockerfile` de production (`frontend/Dockerfile`) doit être modifié pour copier le bon fichier `.env` en fonction du mode de build. Cela peut être fait avec un argument de build (`ARG`):
  ```dockerfile
  # frontend/Dockerfile
  ARG APP_ENV=production
  COPY .env.${APP_ENV} ./.env
  RUN npm run build
  ```
- [ ] Le `docker-compose.yml` devra passer cet argument aux services `frontend-prod` et `frontend-staging`.

## Definition of Done

- [ ] Toutes les actions ci-dessus sont complétées et vérifiées.
- [ ] La commande `docker compose --profile dev up` lance avec succès l'environnement de développement local.
- [ ] La commande `docker compose --profile prod up --build` déploie avec succès la version de production.
- [ ] La commande `docker compose --profile staging up --build` déploie avec succès la version de staging.
- [ ] La story a été validée par le Product Owner.
