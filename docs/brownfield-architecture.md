# Recyclic - Architecture d'Analyse "Brownfield"

## Introduction

Ce document capture l'état **actuel et réel** de la base de code du projet Recyclic. Son objectif n'est pas de décrire une architecture idéale, mais de documenter le système tel qu'il existe aujourd'hui, y compris les dettes techniques, les incohérences et les modèles de conception réels. Il sert de référence factuelle pour planifier la restructuration et l'amélioration du projet.

### Périmètre du Document

L'analyse couvre l'ensemble des services : Backend (`api`), Frontend (`frontend`) et le `bot` Telegram, avec un focus particulier sur les interactions entre ces services.

### Journal des Modifications

| Date       | Version | Description                     | Auteur        |
| ---------- | ------- | ------------------------------- | ------------- |
| 2025-09-14 | 1.0     | Analyse initiale "brownfield" | BMad Master   |

## Références Rapides - Fichiers et Points d'Entrée Clés

- **Configuration Globale**: `docker-compose.yml`, `env.example`
- **Point d'Entrée API (Backend)**: `api/src/recyclic_api/main.py`
- **Routeur Principal API**: `api/src/recyclic_api/api/api_v1/api.py`
- **Point d'Entrée Frontend**: `frontend/src/App.jsx` (via `vite`)
- **Service de communication API Frontend**: `frontend/src/services/api.js`, `frontend/src/services/adminService.ts`
- **Point d'Entrée Bot**: `bot/src/main.py`

## Architecture Générale

### Résumé Technique

Le projet utilise une architecture de microservices containerisés via Docker Compose. Les services principaux sont une API backend en **FastAPI** (Python), une interface web en **React** (TypeScript/JavaScript), et un bot **Telegram** (Python). Les données sont persistées dans une base de données **PostgreSQL** et une instance **Redis** est utilisée pour le cache ou les tâches asynchrones.

### Stack Technologique Réelle

| Catégorie          | Technologie        | Version | Fichier de Référence      | Notes                               |
| ------------------ | ------------------ | ------- | ------------------------- | ----------------------------------- |
| **Backend**        |                    |         |                           |                                     |
| Langage            | Python             | ~3.11+  | `api/pyproject.toml`      |                                     |
| Framework          | FastAPI            | 0.104.1 | `api/pyproject.toml`      | Solide, bien structuré.             |
| ORM                | SQLAlchemy         | 2.0.23  | `api/pyproject.toml`      | Standard pour l'accès BDD.         |
| Migrations         | Alembic            | 1.12.1  | `api/pyproject.toml`      | Bonne pratique.                     |
| **Frontend**       |                    |         |                           |                                     |
| Langage            | TypeScript/JS (JSX)|         | `frontend/package.json`   | Cohabitation JS/TS.                 |
| Framework          | React              | 18.2.0  | `frontend/package.json`   |                                     |
| Bundler            | Vite               | 5.0.8   | `frontend/package.json`   | Moderne et performant.              |
| Gestion d'état    | Zustand            | 5.0.8   | `frontend/package.json`   | Léger et efficace.                  |
| Appels API         | Axios, React Query | ^1.6.0  | `frontend/package.json`   | Robuste pour la gestion des données.|
| **Base de données**| PostgreSQL         | 15      | `docker-compose.yml`      |                                     |
| **Cache**          | Redis              | 7-alpine| `docker-compose.yml`      |                                     |
| **Infrastructure** | Docker Compose     |         | `docker-compose.yml`      | Simplifie le déploiement local.     |

### Structure du Dépôt (Monorepo)

La structure est celle d'un monorepo simple, sans outils spécifiques comme Lerna ou Nx, ce qui est suffisant pour la taille actuelle du projet.

## Organisation du Code Source

### Structure des Fichiers (Réalité)

```text
recyclic/
├── api/
│   ├── src/recyclic_api/
│   │   ├── api/          # Logique des endpoints (contrôleurs)
│   │   ├── core/         # Configuration, BDD, authentification
│   │   ├── models/       # Modèles de données SQLAlchemy
│   │   ├── schemas/      # Schémas de validation Pydantic
│   │   └── services/     # Logique métier (partiellement implémenté)
│   └── tests/
├── bot/
│   └── src/
│       ├── handlers/     # Logique des commandes du bot
│       └── main.py
├── frontend/
│   └── src/
│       ├── components/   # Composants React réutilisables
│       ├── pages/        # Composants représentant les pages
│       ├── services/     # Logique d'appel à l'API backend
│       └── stores/       # Gestion d'état avec Zustand
└── docs/                   # Documentation (prd.md, architecture.md, etc.)
```

## Dette Technique et Problèmes Connus

Cette section est la plus critique. Elle documente les "grains de sable" identifiés.

### 1. Duplication des Types et Couplage Fort API/Frontend

C'est le problème principal qui cause les frictions de développement.

- **Description**: Les types de données (en particulier les `Enum` comme `UserRole`) et les interfaces (comme `AdminUser`) sont définis manuellement et séparément dans le backend (Python/Pydantic) et dans le frontend (TypeScript).
- **Impact**:
    - **Risque d'Erreurs**: Une modification d'un côté (ex: ajout d'un nouveau rôle) sans synchronisation parfaite de l'autre casse l'application de manière silencieuse (pas d'erreur de compilation).
    - **Maintenance Élevée**: Oblige les développeurs à travailler sur deux fichiers pour une seule modification logique, augmentant la charge cognitive et le risque d'oubli.
- **Exemple Concret**: `api/src/recyclic_api/models/user.py` définit `UserRole`. `frontend/src/services/adminService.ts` re-définit exactement la même énumération en TypeScript.

### 2. Couplage de la Logique Métier

- **Description**: La logique d'appel à l'API est centralisée dans des fichiers de service frontend (`api.js`, `adminService.ts`), mais la gestion de l'état qui en découle (chargement, erreurs, données) est gérée dans des stores Zustand (`adminStore.ts`). Une modification de la "forme" des données par l'API a des répercussions à tous ces niveaux.
- **Impact**: Une story qui semble simple ("ajouter un filtre") nécessite des modifications synchronisées à de multiples endroits du code frontend et backend, ce qui rend les stories "full-stack" complexes et lentes à développer. C'est la cause directe du sentiment de "déséquilibre" que vous avez.

### 3. Tests d'Intégration Backend Insuffisants

- **Description**: Les tests du backend (`api/tests/api/test_admin_endpoints.py`) se contentent de vérifier la disponibilité des endpoints (code de statut HTTP 200 ou 404). Ils ne valident pas le contenu des réponses.
- **Impact**: La responsabilité de vérifier que l'API renvoie les bonnes données est entièrement reportée sur le développeur frontend ou sur les tests E2E. Des bugs de logique dans l'API peuvent passer inaperçus jusqu'à une phase très tardive du développement.

## Recommandations pour la Restructuration

Pour adresser ces problèmes, voici un plan d'action concret.

### 1. Établir un Contrat d'API Fort avec Génération de Code

- **Action**: Mettre en place la génération automatique de la spécification OpenAPI à partir du code FastAPI. Utiliser ensuite un outil (ex: `openapi-typescript-codegen`) pour générer automatiquement le client TypeScript et toutes les interfaces/types nécessaires pour le frontend.
- **Bénéfices**:
    - **Fin de la duplication**: Le frontend et le backend partagent une source de vérité unique pour les types de données.
    - **Développement accéléré**: Le client API frontend est généré, pas besoin de l'écrire à la main.
    - **Sécurité**: Les erreurs de type entre front et back sont détectées à la compilation, pas en production.

### 2. Renforcer les Tests Backend

- **Action**: Enrichir les tests d'intégration du backend pour qu'ils valident le schéma et le contenu des réponses JSON. Par exemple, un test pour `GET /admin/users?role=admin` doit vérifier que la réponse est une liste et que chaque utilisateur dans la liste a bien le rôle "admin".
- **Bénéfices**:
    - **Confiance accrue dans l'API**: Le backend garantit le contrat qu'il expose.
    - **Développement frontend découplé**: L'équipe frontend peut travailler en toute confiance contre une version "mockée" de l'API en se basant sur la spécification OpenAPI.

### 3. Revoir le Découpage des Stories

- **Action**: Adopter un découpage qui minimise les dépendances synchrones.
    - **Option A (Backend-First)**: Une story pour créer l'endpoint API (avec ses tests renforcés) et le valider. Une story *séparée* pour que le frontend consomme cet endpoint (qui est maintenant stable et fiable).
    - **Option B (Contract-First)**: Se mettre d'accord sur la "forme" de l'API (le contrat OpenAPI), puis les équipes front et back peuvent travailler en parallèle en se basant sur ce contrat.
- **Bénéfices**:
    - **Réduction de la complexité**: Chaque story a un périmètre plus petit et plus clair.
    - **Parallélisation possible** et réduction des blocages entre développeurs.

## Prochaines Étapes

Ce document constitue notre base de travail. Je vous propose de le sauvegarder sous `docs/brownfield-architecture.md`.

La prochaine étape logique est de transformer ces recommandations en un plan d'action concret, potentiellement en créant des stories techniques dans votre backlog pour :
1.  Mettre en place la génération de client TypeScript depuis l'API.
2.  Renforcer les tests d'intégration de l'endpoint `admin/users`.
3.  Appliquer ce nouveau modèle de découpage à la prochaine fonctionnalité.

Je suis prêt à vous aider à créer ces tâches.
