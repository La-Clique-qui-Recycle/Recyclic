# Architecture consolidée du projet Recyclic

- **Auteur**: BMad Master (Synthèse)
- **Version**: 3.0
- **Date**: 2025-09-14
- **Objectif**: Remplacer les 21+ fichiers d'architecture précédents par une source de vérité unique, claire et exploitable pour tous les agents (IA et humains).

---

## 1. Vision et Objectifs Métier

Recyclic est une plateforme de gestion complète pour les ressourceries, conçue pour digitaliser l'ensemble du workflow, de la collecte à la vente. L'objectif principal est de réduire drastiquement la charge administrative (de 3h à moins d'1h par jour) et d'assurer une conformité réglementaire sans faille (exports Ecologic) grâce à une innovation clé : la classification d'objets par IA via une simple interaction vocale sur Telegram.

## 2. Principes et Patterns d'Architecture

L'architecture repose sur des choix pragmatiques visant la robustesse, la simplicité de déploiement et la maintenabilité.

- **Microservices Légers**: Le projet est découpé en services Docker indépendants (`api`, `bot`, `frontend`) qui communiquent via des API REST. Cela permet une séparation claire des responsabilités.
- **PWA Offline-First**: L'interface de caisse est une Progressive Web App conçue pour fonctionner même sans connexion internet. Les données sont stockées localement (IndexedDB) et synchronisées dès que la connexion est rétablie.
- **API Gateway**: Un reverse proxy Nginx sert de point d'entrée unique, gérant le routage vers les services et la terminaison SSL.
- **Repository Pattern**: L'accès à la base de données dans le backend est abstrait via un Repository Pattern, ce qui isole la logique métier des détails de l'implémentation de la base de données.

## 3. Stack Technologique

| Catégorie          | Technologie        | Version | Rationale                                     |
| ------------------ | ------------------ | ------- | --------------------------------------------- |
| **Backend**        | Python / FastAPI   | 3.11+   | Performance, écosystème IA, OpenAPI natif.    |
| **Frontend**       | React / Vite / TS  | 18+     | Ecosystème mature, PWA, performance.          |
| **Base de données**| PostgreSQL         | 15      | Fiabilité, robustesse, support JSONB.         |
| **Cache & Jobs**   | Redis              | 7+      | Gestion des sessions et tâches asynchrones.   |
| **Infrastructure** | Docker Compose     | latest  | Simplicité de déploiement et de développement.|
| **Tests**          | Pytest / Vitest    | latest  | Standards des écosystèmes respectifs.         |

## 4. Composants du Système

```mermaid
graph TD
    subgraph "Accès Utilisateur"
        U1[👤 Bénévole via Telegram]
        U2[💻 Caissier via PWA]
    end

    subgraph "Infrastructure Docker"
        TG[🤖 Bot Telegram]
        API[⚡ Backend FastAPI]
        WEB[🌐 Frontend React]
        NGINX[🔀 Reverse Proxy]
    end

    subgraph "Services de Données"
        PG[(📊 PostgreSQL)]
        RD[(⚡ Redis)]
    end

    subgraph "API Externes"
        AI[🧠 Gemini AI]
    end

    U1 --> TG
    U2 --> NGINX
    NGINX --> WEB
    NGINX --> API
    TG --> API
    API --> PG
    API --> RD
    API --> AI
```

- **Backend (FastAPI)**: Le cerveau de l'application. Il gère la logique métier, l'authentification, et la communication avec la base de données.
- **Frontend (React PWA)**: L'interface de caisse tactile, conçue pour être simple et fonctionner hors-ligne.
- **Bot (Telegram)**: Le point d'entrée pour les bénévoles sur le terrain, permettant l'enregistrement des dépôts par commande vocale.

## 5. Architecture des Données

Les modèles de données principaux sont conçus pour être simples et relationnels.

- **`User`**: Gère les utilisateurs, leurs rôles (`super-admin`, `admin`, `manager`, `cashier`, `user`) et leur statut.
- **`Deposit`**: Représente un dépôt d'objet, avec sa description, sa catégorie EEE et le statut de validation.
- **`Sale`**: Représente une vente, liée à une session de caisse.
- **`CashSession`**: Gère l'ouverture, la fermeture et le suivi d'une caisse.

**Note importante**: Les interfaces TypeScript ci-dessous sont un exemple de ce qui **devrait être généré automatiquement** (voir section 7).

```typescript
// Exemple: /models/user.ts
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  // ... etc
}

export interface User {
  id: string;
  username?: string;
  role: UserRole;
  // ... etc
}
```

> **Annexe A : Schéma SQL Complet**
> Le code SQL complet pour la création des tables, des types et des index est disponible dans le document :
> [**Annexe A : Schéma de la Base de Données](./appendix-database-schema.md)**

## 6. Architecture API

L'API est construite sur le standard REST avec FastAPI. La documentation de l'API est auto-générée par FastAPI au format OpenAPI, ce qui garantit qu'elle est toujours à jour.

> **Annexe B : Spécification OpenAPI**
> Un extrait de la spécification OpenAPI, montrant la structure des endpoints et des schémas, est disponible dans le document :
> [**Annexe B : Spécification OpenAPI](./appendix-api-specification.md)**

---

## 7. Réalité de l'Implémentation et Plan de Refactoring

Cette section est la plus importante. Elle décrit l'écart entre la théorie et la pratique, et définit le plan pour y remédier.

### 7.1. Le Problème : Duplication et Désynchronisation

L'analyse du code a révélé un problème majeur : **les types de données sont définis manuellement et dupliqués** entre le backend (en Python/Pydantic) et le frontend (en TypeScript). Par exemple, l'énumération `UserRole` existe à deux endroits.

**Ceci est une dette technique critique** qui cause :
- Des **bugs** lorsqu'un type est modifié d'un côté mais pas de l'autre.
- Une **maintenance lourde** et une perte de temps pour les développeurs.
- De la **confusion** pour les agents de développement.

### 7.2. La Solution : Générer le Code (Contrat d'API Fort)

La solution à ce problème est de traiter la spécification OpenAPI générée par le backend comme la **seule source de vérité**.

**Action Requise :**
La story technique suivante a été créée pour résoudre ce problème. **Elle doit être exécutée en priorité** après la finalisation de la Story 3.2.

- **Story de référence** : `docs/stories/story-tech-debt-api-codegen.md`
- **Objectif** : Créer un script (`npm run codegen`) qui lit la spécification OpenAPI et génère automatiquement tout le code client TypeScript, y compris les interfaces, les énumérations et les fonctions d'appel à l'API.

L'exécution de cette story **éliminera la duplication manuelle** et fiabilisera l'ensemble du processus de développement.

### 7.3. Amélioration des Tests Backend

L'analyse a montré que les tests du backend vérifient la disponibilité des endpoints, mais pas toujours le contenu des réponses. 

**Action Requise :**
Une future story technique devra être créée pour **renforcer les tests d'intégration backend** afin qu'ils valident que les réponses de l'API sont conformes au contrat défini dans la spécification OpenAPI.

## 8. Workflows Métier Principaux

### Workflow de Dépôt d'Objet (Bot Telegram)

```mermaid
sequenceDiagram
    participant U as Bénévole
    participant TG as Bot Telegram
    participant API as FastAPI
    participant AI as AI Pipeline
    participant DB as PostgreSQL
    
    U->>TG: /depot
    TG->>API: POST /deposits (draft)
    API->>DB: Save draft deposit
    TG->>U: 🎤 Envoie ton audio
    
    U->>TG: Audio message
    TG->>API: POST /deposits/{id}/classify
    API->>AI: transcribe + classify
    AI->>API: {category: EEE-3, confidence: 85%}
    API->>DB: Update deposit with AI result
    
    API->>TG: Classification results
    TG->>U: 📦 EEE-3 Informatique (85%) ✅ Valider ✏️ Corriger
```

### Workflow de Vente (Interface Caisse PWA)

```mermaid
sequenceDiagram
    participant C as Caissier
    participant PWA as Interface PWA
    participant SW as Service Worker
    participant API as FastAPI
    participant DB as PostgreSQL
    
    C->>PWA: Ouvrir session caisse
    PWA->>API: POST /cash-sessions {opening_amount}
    API->>DB: Create session
    API->>PWA: Session created
    
    C->>PWA: Mode Catégorie → EEE-4
    C->>PWA: Mode Quantité → 2
    C->>PWA: Mode Prix → 15€
    PWA->>SW: Save draft locally
    
    alt Online
        PWA->>API: POST /sales
        API->>DB: Save sale
        API->>PWA: Sale confirmed
    else Offline
        PWA->>SW: Queue for sync
        SW->>PWA: Saved locally
    end
```

## 9. Stratégies Transverses (Qualité, Sécurité, Opérations)

Cette section définit les stratégies globales qui s'appliquent à l'ensemble du projet.

### 9.1. Stratégie de Test
La qualité est assurée par une approche en pyramide : un grand nombre de **tests unitaires** rapides, des **tests d'intégration** pour vérifier la communication entre les services (API+BDD, Frontend+API), et quelques **tests de bout-en-bout (E2E)** pour valider les parcours utilisateurs critiques.

### 9.2. Stratégie de Sécurité
- **Authentification**: JWT pour l'API, complété par la validation native de Telegram pour le bot.
- **Autorisation**: Un système de rôles (RBAC) est appliqué sur les endpoints de l'API pour restreindre l'accès aux fonctionnalités sensibles.
- **Validation des Entrées**: Toutes les données entrant dans l'API sont validées via les schémas Pydantic pour prévenir les injections.
- **RGPD**: Les données sont hébergées en Europe et les principes de protection des données sont appliqués.

### 9.3. Stratégie de Gestion des Erreurs
Chaque service (frontend et backend) doit avoir un gestionnaire d'erreurs centralisé. Les erreurs sont catégorisées (erreur de validation, erreur de service, erreur inconnue) et retournées dans un format JSON standardisé. Le frontend doit être capable d'afficher des messages clairs à l'utilisateur et de gérer les modes dégradés (ex: mode offline).

### 9.4. Stratégie de Monitoring
L'application est monitorée sur deux axes :
- **Technique**: Performance des serveurs, taux d'erreur, temps de réponse (Prometheus/Grafana, Sentry).
- **Produit**: Suivi des parcours utilisateurs et des fonctionnalités clés pour prendre des décisions basées sur les données (nécessite l'intégration d'un outil d'analytics).

## 10. Standards et Règles d'Implémentation Critiques

Cette section définit les règles obligatoires pour garantir la qualité, la performance et la sécurité du code.

### 10.1. Standards Généraux
- **Nommage :** Les conventions (PascalCase/React, snake_case/Python) sont à suivre scrupuleusement.
- **Tests :** La pyramide de tests (Unit, Integration, E2E) est la stratégie de référence. Toute nouvelle fonctionnalité doit être accompagnée de tests pertinents.
- **Développement Local :** Le `docker-compose.yml` est le point d'entrée unique pour l'environnement de développement.

### 10.2. Règles Backend Obligatoires
- **Performance (Anti N+1) :** Toute requête retournant une liste d'objets doit impérativement utiliser le "Eager Loading" (`selectinload` de SQLAlchemy) pour charger les relations nécessaires en une seule fois.
- **Séparation des Couches :** Aucune logique métier (calculs, conditions complexes) ne doit se trouver dans les endpoints de l'API. Les endpoints valident l'entrée, appellent **une seule** méthode de service, et retournent la réponse.
- **Sécurité (Anti Mass-Assignment) :** Des schémas Pydantic spécifiques doivent être créés pour les entrées (`Update`, `Create`). Ils ne doivent exposer **que** les champs modifiables par l'acteur de la requête.

### 10.3. Règles Frontend Obligatoires
- **Gestion de l'État :** Les stores Zustand doivent être séparés par domaine métier (`authStore`, `cashStore`, etc.). Un store global unique est interdit.
- **Performance :** L'application doit implémenter le "code-splitting" par route et le "lazy loading" pour les composants lourds afin de garantir un temps de chargement initial minimal.

### 10.4. Qualité du Code (Processus)
- **Linting Automatisé :** Le projet doit être configuré avec des linters stricts (`ruff`, `eslint`) et un hook de **pre-commit** qui empêche tout commit de code ne respectant pas les standards.
- **Revue de Code Obligatoire :** Aucune story ne peut passer en QA sans avoir été validée par une revue de code. Le relecteur doit vérifier la conformité du code avec toutes les règles définies dans ce document d'architecture. C'est le principal rempart contre la "spéculation".

## 11. Infrastructure et Déploiement

L'application est entièrement conteneurisée avec Docker. Le déploiement sur les différents environnements (staging, production) est géré via des scripts et potentiellement une pipeline CI/CD (ex: GitHub Actions) qui automatise les tests et le déploiement.

### Exemple de Workflow de Déploiement (`deploy.yaml`)

Le code ci-dessous est l'exemple de base pour le workflow de déploiement continu qui doit être créé par la story `story-tech-debt-create-deploy-workflow.md`.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          npm ci
          cd apps/api && pip install -r requirements.txt
      
      - name: Lint code
        run: npm run lint
      
      - name: Run tests
        run: |
          npm run test
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t recyclic-api -f api/Dockerfile .
          docker build -t recyclic-bot -f bot/Dockerfile .
          docker build -t recyclic-web -f frontend/Dockerfile .
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/recyclic
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
```

## 12. Procédure de Rollback

En cas de problème lors d'un déploiement en production, une procédure de rollback simple et fiable permet de revenir immédiatement à la version stable précédente.

### 12.1. Principe de Fonctionnement

Le système de rollback repose sur le versionnement des images Docker :
- Chaque déploiement génère un tag unique basé sur le SHA du commit Git (7 caractères)
- Les 5 dernières versions d'images sont conservées sur le serveur de production
- Le script de rollback identifie automatiquement la version précédente et redéploie les conteneurs

### 12.2. Utilisation du Script de Rollback

Le script `scripts/rollback.sh` fournit une interface simple pour effectuer un rollback :

```bash
# Rollback automatique vers la version précédente
bash scripts/rollback.sh

# Rollback vers une version spécifique
bash scripts/rollback.sh abc1234

# Aide et liste des versions disponibles
bash scripts/rollback.sh --help
```

### 12.3. Processus de Rollback

1. **Identification de la version cible** : Le script détermine automatiquement la version précédente ou utilise celle spécifiée
2. **Vérification de disponibilité** : Contrôle que toutes les images de la version cible existent
3. **Confirmation utilisateur** : Demande confirmation avant d'effectuer le rollback
4. **Arrêt des services** : Arrête les conteneurs actuels
5. **Redémarrage avec l'ancienne version** : Utilise les images de la version précédente
6. **Vérification** : Contrôle que les services redémarrent correctement

### 12.4. Configuration Requise

Pour que le rollback fonctionne, les fichiers suivants doivent être configurés :

- **`docker-compose.yml`** : Utilise des variables d'environnement pour les tags d'images
- **`.env.production`** : Généré automatiquement par le workflow de déploiement
- **Images Docker** : Au moins 2 versions doivent être disponibles sur le serveur

### 12.5. Monitoring et Métriques

Le script de rollback enregistre automatiquement des métriques dans `logs/rollback-metrics.json` :

```json
{
  "timestamp": "2025-01-27T10:30:00Z",
  "event": "rollback_success",
  "version": "abc1234",
  "duration_seconds": "45",
  "status": "success",
  "hostname": "production-server",
  "user": "deploy-user"
}
```

**Événements trackés** :
- `rollback_success` : Rollback réussi
- `rollback_failed` : Échec du rollback
- `rollback_cancelled` : Rollback annulé par l'utilisateur

### 12.6. Tests Automatisés

Le script de rollback inclut des tests automatisés complets :

```bash
# Test rapide (recommandé pour la validation)
bash scripts/test-rollback-quick.sh

# Tests complets (environnement de test requis)
bash tests/test_rollback.sh
```

**Couverture des tests** :
- Validation des arguments et options
- Détection des répertoires de travail
- Gestion des versions inexistantes
- Fonctions de métriques
- Détection des versions actuelles et précédentes
- Simulation de rollback

### 12.7. Sécurité et Bonnes Pratiques

- **Test en staging** : Toujours tester la procédure de rollback sur un environnement de staging
- **Sauvegarde des données** : Le rollback ne touche que le code, pas les données de la base
- **Monitoring** : Surveiller les métriques dans `logs/rollback-metrics.json` après un rollback
- **Tests automatisés** : Exécuter les tests avant tout déploiement en production
- **Communication** : Informer l'équipe en cas de rollback en production
