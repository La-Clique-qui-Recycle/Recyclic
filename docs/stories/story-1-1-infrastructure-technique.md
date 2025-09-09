# Story 1.1: Configuration Infrastructure Technique

## Contexte
Cette story établit la fondation technique complète du projet Recyclic, incluant l'infrastructure Docker, la base de données PostgreSQL, l'API FastAPI, et la structure de projet monorepo.

## User Story
**En tant que** développeur,  
**Je veux** configurer l'infrastructure technique de base,  
**Afin que** l'application puisse fonctionner de manière fiable dans des conteneurs Docker avec une structure de base de données et d'API appropriée.

## Critères d'Acceptation

### 1. Configuration Docker Compose
- [ ] Docker Compose fonctionnel avec FastAPI + PostgreSQL + Redis
- [ ] Services configurés avec variables d'environnement
- [ ] Volumes persistants pour la base de données
- [ ] Réseau Docker interne configuré
- [ ] Health checks pour tous les services

### 2. Structure de Projet Monorepo
- [ ] Structure de dossiers créée :
  ```
  recyclic/
  ├── api/                    # API FastAPI
  │   ├── src/
  │   │   ├── api/           # Routes API
  │   │   ├── core/          # Configuration
  │   │   ├── models/        # Modèles SQLAlchemy
  │   │   ├── schemas/       # Schémas Pydantic
  │   │   ├── services/      # Logique métier
  │   │   └── utils/         # Utilitaires
  │   ├── requirements.txt
  │   └── Dockerfile
  ├── bot/                   # Bot Telegram
  │   ├── src/
  │   ├── requirements.txt
  │   └── Dockerfile
  ├── frontend/              # Interface web
  │   ├── src/
  │   ├── package.json
  │   └── Dockerfile
  ├── docs/                  # Documentation
  ├── docker-compose.yml
  └── README.md
  ```

### 3. API FastAPI de Base
- [ ] Application FastAPI configurée
- [ ] Endpoint `/health` opérationnel retournant le statut des services
- [ ] Configuration des CORS
- [ ] Middleware de logging
- [ ] Gestion des erreurs centralisée
- [ ] Documentation automatique Swagger/OpenAPI

### 4. Base de Données PostgreSQL
- [ ] Schémas initiaux créés selon la spécification :
  - Table `sites` avec configuration JSONB
  - Table `users` avec authentification Telegram
  - Table `deposits` pour les dépôts EEE
  - Table `cash_sessions` pour les sessions de caisse
  - Table `sales` pour les ventes
  - Table `sync_logs` pour les logs de synchronisation
- [ ] Extensions PostgreSQL (uuid-ossp)
- [ ] Enums définis (user_role, eee_category, payment_method, session_status)
- [ ] Indexes de performance
- [ ] Triggers pour updated_at
- [ ] Migrations Alembic configurées

### 5. Tests d'Intégration Infrastructure
- [ ] Tests de connectivité base de données
- [ ] Tests d'endpoints API de base
- [ ] Tests de configuration Docker
- [ ] Tests de variables d'environnement
- [ ] Tests de health checks

### 6. Déploiement Local
- [ ] Commande `docker-compose up` fonctionnelle
- [ ] Services accessibles sur ports configurés :
  - FastAPI : http://localhost:8000
  - PostgreSQL : localhost:5432
  - Redis : localhost:6379
- [ ] Documentation de démarrage rapide
- [ ] Scripts d'initialisation de données de test

## Spécifications Techniques

### Configuration Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: recyclic
      POSTGRES_USER: recyclic
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recyclic"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://recyclic:${POSTGRES_PASSWORD}@postgres:5432/recyclic
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

### Modèles SQLAlchemy de Base
```python
# api/src/models/__init__.py
from .user import User
from .site import Site
from .deposit import Deposit
from .sale import Sale
from .cash_session import CashSession

__all__ = ["User", "Site", "Deposit", "Sale", "CashSession"]
```

### Configuration FastAPI
```python
# api/src/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Recyclic API"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Définition de Terminé
- [ ] Tous les critères d'acceptation validés
- [ ] Tests d'intégration passent
- [ ] Documentation technique mise à jour
- [ ] Code review effectué
- [ ] Déploiement local fonctionnel
- [ ] Performance acceptable (< 2s pour health check)

## Estimation
**Effort :** 8 story points  
**Durée estimée :** 3-4 jours  
**Complexité :** Moyenne

## Dépendances
- Aucune (story de fondation)

## Risques
- Configuration Docker complexe
- Problèmes de compatibilité PostgreSQL
- Variables d'environnement manquantes

## Notes Techniques
- Utiliser PostgreSQL 15+ pour les fonctionnalités JSONB avancées
- Configurer Redis pour le cache et les sessions
- Implémenter les health checks robustes
- Préparer la structure pour les futures stories d'authentification
