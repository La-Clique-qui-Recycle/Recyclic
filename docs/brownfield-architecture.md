# Recyclic Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Recyclic codebase as of 2025-09-17, following the completion of Story 5.2. It includes technical debt, real-world patterns, and serves as a reference for AI agents and developers. Its primary goal is to provide a clear snapshot of "where we are" to guide future development.

### Document Scope

This analysis focuses on the state of the system after the implementation of the "Interface Vente Multi-Modes" (Story 5.2) and highlights the technical debt identified in the subsequent PO validation report, leading to the creation of `story-debt-backend-tests-validation` and `story-debt-rollback-procedure-validation`.

### Change Log

| Date         | Version | Description                 | Author  |
|--------------|---------|-----------------------------|---------|
| 2025-09-17   | 1.0     | Initial brownfield analysis | Winston |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **API Entry**: `api/src/recyclic_api/main.py` (FastAPI application)
- **Frontend Entry**: `frontend/src/main.tsx` (React application)
- **Bot Entry**: `bot/src/main.py` (python-telegram-bot)
- **Configuration**: `.env.example` (root), `api/.env`, `bot/.env`
- **Core Business Logic (API)**: `api/src/recyclic_api/services/`
- **Database Models (API)**: `api/src/recyclic_api/models/`
- **Database Migrations**: `api/migrations/` (Alembic)
- **State Management (Frontend)**: `frontend/src/stores/` (Zustand)
- **Deployment**: `docker-compose.yml`, `docker-compose.dev.yml`

## High Level Architecture

### Technical Summary

Recyclic is a containerized application suite built with a microservices approach, composed of a FastAPI backend, a React (Vite) frontend, and a Python-based Telegram bot. The entire system is orchestrated via Docker Compose. Data persistence is handled by PostgreSQL, with database schema changes managed by Alembic. Redis is used for caching and potentially for background jobs.

### Actual Tech Stack

| Category      | Technology            | Version          | Notes                               |
|---------------|-----------------------|------------------|-------------------------------------|
| **Backend**   |                       |                  |                                     |
| Runtime       | Python                | (Not specified)  | via FastAPI/Uvicorn                 |
| Framework     | FastAPI               | 0.104.1          |                                     |
| Database      | PostgreSQL            | (Not specified)  | via psycopg2-binary                 |
| ORM/Migration | SQLAlchemy / Alembic  | 2.0.23 / 1.12.1  |                                     |
| AI/LangChain  | LangChain / Google    | 0.1.0 / 1.0.1    | For AI classification tasks         |
| **Frontend**  |                       |                  |                                     |
| Runtime       | Node.js               | (Not specified)  | via Vite                            |
| Framework     | React                 | 18.2.0           |                                     |
| UI Library    | Mantine               | ~8.3.1           |                                     |
| State Mgmt    | Zustand               | ~5.0.8           |                                     |
| Testing       | Vitest / Playwright   | ~1.0.4 / ~1.55.0 | Unit, Integration, and E2E tests    |
| **Bot**       |                       |                  |                                     |
| Framework     | python-telegram-bot   | 20.7             |                                     |
| **Infra**     |                       |                  |                                     |
| Orchestration | Docker / Docker Compose | (Not specified)  | `docker-compose.yml`                |

### Repository Structure Reality Check

- **Type**: Monorepo containing distinct services (`api`, `frontend`, `bot`).
- **Package Manager**: `pip` (for Python services) and `npm` (for frontend).
- **Notable**: The project follows the BMad Method, emphasizing documentation-first development within the `docs/` directory.

## Source Tree and Module Organization

```text
recyclic/
├── api/
│   ├── src/recyclic_api/  # FastAPI application source
│   │   ├── controllers/   # (Assumed) API endpoint handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # SQLAlchemy data models
│   │   └── main.py        # FastAPI app entry point
│   ├── migrations/        # Alembic database migrations
│   └── requirements.txt   # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components (e.g., Sale.tsx)
│   │   ├── components/    # Reusable React components
│   │   ├── stores/        # Zustand state management stores
│   │   └── main.tsx       # React app entry point
│   └── package.json       # Frontend dependencies
├── bot/
│   └── src/               # Telegram bot source
├── docs/
│   ├── architecture/      # Architecture documents
│   ├── prd/               # Product Requirement Documents & Epics
│   └── stories/           # User stories (including tech debt)
└── docker-compose.yml     # Main service orchestration
```

## Technical Debt and Known Issues

This analysis confirms the critical technical debt identified by the PO.

### 1. Insufficient Backend Test Validation

- **Issue**: Existing backend integration tests primarily check for status codes (e.g., `200 OK`) but do not validate the content or schema of the API responses.
- **Risk**: High. API regressions can go unnoticed, breaking the contract with the frontend and leading to UI bugs. The frontend cannot trust the API's data structure.
- **Source**: `docs/stories/story-debt-backend-tests-validation.md`
- **Action Required**: Refactor integration tests for critical endpoints (developed up to and including Story 5.2) to assert response schemas and content validity. The `TESTS_README.md` must be updated to reflect this new standard.

### 2. Undocumented and Untested Rollback Procedure

- **Issue**: A `rollback.sh` script exists, but it has not been formally tested, and there is no documentation explaining how or when to use it.
- **Risk**: High. A failed deployment could lead to extended downtime and data inconsistency because the recovery procedure is unreliable.
- **Source**: `docs/stories/story-debt-rollback-procedure-validation.md`
- **Action Required**: Create a formal test guide, execute and validate the script, and produce clear documentation for the rollback process, including post-mortem steps. This documentation should be located at `docs/architecture/deployment-and-rollback.md`.

## Testing Reality

### Current Test Coverage

- **Backend**: Unit and integration tests exist (`pytest`) but lack depth, as noted in the technical debt section.
- **Frontend**: The frontend has a more mature testing setup with Vitest for unit/component tests and Playwright for E2E tests. Story 5.2 included the creation of comprehensive tests for the new UI components and state management logic, indicating a good testing culture on the frontend side.
- **E2E**: The presence of Playwright suggests E2E testing capability, but the overall coverage is unknown.

### Running Tests

```bash
# Backend (from api/ directory)
pytest

# Frontend (from frontend/ directory)
npm test
npm run test:coverage
```

## Impact Analysis from Story 5.2

The completion of **Story 5.2: Interface Vente Multi-Modes** introduced significant functionality and established key frontend patterns.

### New Files and Modules

- **Page**: `frontend/src/pages/CashRegister/Sale.tsx`
- **State**: The `cashSessionStore.ts` in Zustand was extended to manage the state of an in-progress sale.
- **Components**: `ModeSelector`, `CategorySelector`, `Numpad`.
- **API Endpoint**: A new `POST /sales` endpoint was required on the backend to persist sales.

### Established Patterns

- **Offline-First**: The implementation of Story 5.2 reinforced the "Offline-First" principle, requiring sales to be saved locally if the network is unavailable. This is a critical pattern for all future frontend development.
- **Sequential UI Flow**: The story implemented a sequential, state-driven UI for data entry (Category -> Quantity -> Price), which may serve as a pattern for future forms.
- **Component Testing**: The QA review for Story 5.2 shows that comprehensive unit tests were created for new components and state logic, setting a high standard for future frontend work.