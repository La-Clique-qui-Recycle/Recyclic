# 📋 Recyclic Architecture Documentation

**Navigation optimisée pour l'architecture consolidée Recyclic**

---

## 🎯 Document Principal

### [📄 architecture.md](../architecture.md)
**Document de référence consolidé** - Version 2.0 optimisée (20k tokens vs 76k originaux)

**Contenu principal:**
- Vue d'ensemble architecture complète
- Modèles de données TypeScript
- Composants core et intégrations
- API REST principales
- Workflows métier critiques
- Stratégie de déploiement
- Standards de code

---

## 📁 Modules Spécialisés

### 🛠️ **Stack Technique**
- **[tech-stack.md](./tech-stack.md)** - Technologies détaillées et versions

### 🔌 **API & Intégrations**
- **[api-specification.md](./api-specification.md)** - OpenAPI 3.0 complet avec tous les endpoints
- **[external-apis.md](./external-apis.md)** - Gemini AI, Google Sheets, Infomaniak

### 🗄️ **Base de Données**
- **[database-schema.md](./database-schema.md)** - Schéma SQL complet avec indexes
- **[data-models.md](./data-models.md)** - Modèles TypeScript détaillés

### ⚛️ **Frontend Architecture**
- **[frontend-architecture.md](./frontend-architecture.md)** - React + PWA + Mantine + Zustand
- **[components.md](./components.md)** - Architecture composants et patterns

### 🐍 **Backend Architecture**
- **[backend-architecture.md](./backend-architecture.md)** - FastAPI + Services + Repository pattern
- **[unified-project-structure.md](./unified-project-structure.md)** - Monorepo structure

### 🚀 **Déploiement & Infrastructure**
- **[deployment-architecture.md](./deployment-architecture.md)** - Docker Compose + VPS
- **[development-workflow.md](./development-workflow.md)** - Environnements et CI/CD

### 🔒 **Sécurité & Performance**
- **[security-and-performance.md](./security-and-performance.md)** - RGPD + JWT + Rate limiting

### ✅ **Tests & Qualité**
- **[testing-strategy.md](./testing-strategy.md)** - Pyramid testing (Unit/Integration/E2E)
- **[coding-standards.md](./coding-standards.md)** - Standards TypeScript/Python

### 🔄 **Workflows Métier**
- **[core-workflows.md](./core-workflows.md)** - Workflows détaillés avec diagrammes Mermaid

### ❌ **Gestion d'Erreurs**
- **[error-handling-strategy.md](./error-handling-strategy.md)** - Patterns frontend/backend

### 📊 **Monitoring**
- **[monitoring-and-observability.md](./monitoring-and-observability.md)** - Grafana + Prometheus + Sentry
- **[checklist-results-report.md](./checklist-results-report.md)** - Validation architecture

### 📈 **Vue d'Ensemble**
- **[high-level-architecture.md](./high-level-architecture.md)** - Architecture systémique
- **[introduction.md](./introduction.md)** - Context et objectifs projet

---

## 🚀 Guide de Navigation Rapide

### 👤 **Pour les Product Owners**
1. **[../architecture.md](../architecture.md)** - Vision d'ensemble consolidée
2. **[core-workflows.md](./core-workflows.md)** - Workflows utilisateur
3. **[introduction.md](./introduction.md)** - Context projet

### 🧑‍💻 **Pour les Développeurs Frontend**
1. **[frontend-architecture.md](./frontend-architecture.md)** - Architecture React/PWA
2. **[components.md](./components.md)** - Composants et patterns
3. **[api-specification.md](./api-specification.md)** - Endpoints disponibles
4. **[coding-standards.md](./coding-standards.md)** - Standards TypeScript

### 🧑‍💻 **Pour les Développeurs Backend**
1. **[backend-architecture.md](./backend-architecture.md)** - Architecture FastAPI
2. **[database-schema.md](./database-schema.md)** - Schéma BDD
3. **[data-models.md](./data-models.md)** - Modèles données
4. **[coding-standards.md](./coding-standards.md)** - Standards Python

### 🔧 **Pour les DevOps**
1. **[deployment-architecture.md](./deployment-architecture.md)** - Infrastructure Docker
2. **[development-workflow.md](./development-workflow.md)** - CI/CD
3. **[monitoring-and-observability.md](./monitoring-and-observability.md)** - Monitoring stack

### 🧪 **Pour les QA/Testeurs**
1. **[testing-strategy.md](./testing-strategy.md)** - Stratégie complète
2. **[core-workflows.md](./core-workflows.md)** - Cas d'usage à tester
3. **[error-handling-strategy.md](./error-handling-strategy.md)** - Scénarios d'erreur

---

## 📊 État de la Documentation

### ✅ **Consolidation Terminée**
- **Architecture principale:** ✅ Consolidée (76k → 20k tokens)
- **Répétitions éliminées:** ✅ 4x répétitions supprimées
- **Navigation optimisée:** ✅ Index avec références croisées
- **Compatibilité préservée:** ✅ Aucun breaking change

### 📝 **Modules Existants** 
21 fichiers modulaires disponibles pour détails techniques approfondis

---

## 🏗️ **Architecture en Bref**

**Stack:** React + FastAPI + PostgreSQL + Docker  
**Déploiement:** Docker Compose sur VPS  
**Pattern:** PWA offline-first + Microservices légers  
**IA:** LangChain + Gemini pour classification EEE  
**Sync:** Redis queue + Google Sheets + Infomaniak  

**Points d'entrée utilisateur:**
- 📱 **Bot Telegram** - Dépôts avec IA
- 💻 **Interface Caisse PWA** - Ventes tactiles  
- 👔 **Dashboard Admin** - Gestion utilisateurs

---

## 📝 Table of Contents Détaillée

- [Recyclic Architecture Documentation](#recyclic-architecture-documentation)
  - [Introduction](./introduction.md)
    - [Starter Template or Existing Project](./introduction.md#starter-template-or-existing-project)
    - [Change Log](./introduction.md#change-log)
  - [High Level Architecture](./high-level-architecture.md)
    - [Technical Summary](./high-level-architecture.md#technical-summary)
    - [Platform and Infrastructure Choice](./high-level-architecture.md#platform-and-infrastructure-choice)
    - [Repository Structure](./high-level-architecture.md#repository-structure)
    - [High Level Architecture Diagram](./high-level-architecture.md#high-level-architecture-diagram)
    - [Architectural Patterns](./high-level-architecture.md#architectural-patterns)
  - [Tech Stack](./tech-stack.md)
    - [Technology Stack Table](./tech-stack.md#technology-stack-table)
  - [Data Models](./data-models.md)
    - [User](./data-models.md#user)
    - [Deposit](./data-models.md#deposit)
    - [Sale](./data-models.md#sale)
    - [CashSession](./data-models.md#cashsession)
    - [Site](./data-models.md#site)
  - [API Specification](./api-specification.md)
    - [REST API Specification](./api-specification.md#rest-api-specification)
  - [Components](./components.md)
    - [Bot Telegram Service](./components.md#bot-telegram-service)
    - [FastAPI Backend](./components.md#fastapi-backend)
    - [PWA Frontend](./components.md#pwa-frontend)
    - [AI Classification Pipeline](./components.md#ai-classification-pipeline)
    - [Sync Engine](./components.md#sync-engine)
    - [Component Diagrams](./components.md#component-diagrams)
  - [External APIs](./external-apis.md)
    - [Gemini AI API](./external-apis.md#gemini-ai-api)
    - [Google Sheets API](./external-apis.md#google-sheets-api)
    - [Infomaniak kDrive WebDAV](./external-apis.md#infomaniak-kdrive-webdav)
  - [Core Workflows](./core-workflows.md)
    - [Workflow Classification Dépôt via Bot](./core-workflows.md#workflow-classification-dpt-via-bot)
    - [Workflow Vente Interface Caisse](./core-workflows.md#workflow-vente-interface-caisse)
    - [Workflow Synchronisation Cloud](./core-workflows.md#workflow-synchronisation-cloud)
  - [Database Schema](./database-schema.md)
  - [Frontend Architecture](./frontend-architecture.md)
    - [Component Architecture](./frontend-architecture.md#component-architecture)
    - [State Management Architecture](./frontend-architecture.md#state-management-architecture)
    - [Routing Architecture](./frontend-architecture.md#routing-architecture)
    - [Frontend Services Layer](./frontend-architecture.md#frontend-services-layer)
  - [Backend Architecture](./backend-architecture.md)
    - [Service Architecture](./backend-architecture.md#service-architecture)
    - [Database Architecture](./backend-architecture.md#database-architecture)
    - [Authentication and Authorization](./backend-architecture.md#authentication-and-authorization)
  - [Unified Project Structure](./unified-project-structure.md)
  - [Development Workflow](./development-workflow.md)
    - [Local Development Setup](./development-workflow.md#local-development-setup)
    - [Environment Configuration](./development-workflow.md#environment-configuration)
  - [Deployment Architecture](./deployment-architecture.md)
    - [Deployment Strategy](./deployment-architecture.md#deployment-strategy)
    - [CI/CD Pipeline](./deployment-architecture.md#cicd-pipeline)
    - [Environments](./deployment-architecture.md#environments)
  - [Security and Performance](./security-and-performance.md)
    - [Security Requirements](./security-and-performance.md#security-requirements)
    - [Performance Optimization](./security-and-performance.md#performance-optimization)
  - [Testing Strategy](./testing-strategy.md)
    - [Testing Pyramid](./testing-strategy.md#testing-pyramid)
    - [Test Organization](./testing-strategy.md#test-organization)
    - [Test Examples](./testing-strategy.md#test-examples)
  - [Coding Standards](./coding-standards.md)
    - [Critical Fullstack Rules](./coding-standards.md#critical-fullstack-rules)
    - [Naming Conventions](./coding-standards.md#naming-conventions)
  - [Error Handling Strategy](./error-handling-strategy.md)
    - [Error Flow](./error-handling-strategy.md#error-flow)
    - [Error Response Format](./error-handling-strategy.md#error-response-format)
    - [Frontend Error Handling](./error-handling-strategy.md#frontend-error-handling)
    - [Backend Error Handling](./error-handling-strategy.md#backend-error-handling)
  - [Monitoring and Observability](./monitoring-and-observability.md)
    - [Monitoring Stack](./monitoring-and-observability.md#monitoring-stack)
    - [Key Metrics](./monitoring-and-observability.md#key-metrics)
  - [Checklist Results Report](./checklist-results-report.md)
    - [Executive Summary](./checklist-results-report.md#executive-summary)
    - [Key Architecture Decisions](./checklist-results-report.md#key-architecture-decisions)
    - [Next Steps](./checklist-results-report.md#next-steps)

---

*Documentation consolidée par Winston (Architect) - Version 2.0 optimisée*