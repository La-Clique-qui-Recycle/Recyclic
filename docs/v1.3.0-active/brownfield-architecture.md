# Recyclic Brownfield Architecture Document

**Author:** Winston (Architect) - BMad Master Synthesis
**Date:** 2025-11-17
**Version:** 1.0
**Purpose:** Comprehensive documentation of the ACTUAL Recyclic codebase state, including technical debt, workarounds, and real-world patterns for AI development agents.

---

## Introduction

This document captures the **CURRENT STATE** of the Recyclic codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements to this brownfield project.

### Document Scope

**Focused on areas relevant to the PRD requirements:**
- User management and authentication system (Telegram + future email/password)
- Bot Telegram with AI classification (currently disabled)
- Cash register PWA interface
- Database schema and API patterns
- Testing infrastructure and deployment

**Note:** Bot service is currently disabled per story-b36-p3, representing significant technical debt.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-11-17 | 1.0     | Initial brownfield analysis | Winston (Architect) |

---

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **API Main Entry**: `api/src/recyclic_api/main.py` - FastAPI application with lifespan management
- **Frontend Main Entry**: `frontend/src/App.jsx` - React Router setup with lazy loading
- **Database Models**: `api/src/recyclic_api/models/` - SQLAlchemy models with relationships
- **API Routes**: `api/src/recyclic_api/api/api_v1/api.py` - FastAPI router setup
- **Frontend Stores**: `frontend/src/stores/` - Zustand state management
- **Configuration**: `api/src/recyclic_api/core/config.py` - Pydantic settings
- **Generated API Client**: `frontend/src/generated/api.ts` - OpenAPI-generated client

### Enhancement Impact Areas

Based on PRD analysis, these areas will be affected by planned enhancements:

- **User Management**: `api/src/recyclic_api/models/user.py` - Role system expansion needed
- **Authentication**: Complex migration from Telegram-only to email/password
- **Cash Sessions**: `frontend/src/stores/cashSessionStore.ts` - Offline PWA logic
- **Database Schema**: Multiple table relationships for deposits, sales, sessions

---

## High Level Architecture

### Technical Summary

Recyclic is a **monorepo** microservices architecture using Docker containers with:
- **Backend**: Python FastAPI with SQLAlchemy ORM and PostgreSQL
- **Frontend**: React TypeScript PWA with Mantine UI and Zustand state management
- **Bot**: Python Telegram bot with LangChain AI integration (currently disabled)
- **Infrastructure**: Docker Compose with Nginx reverse proxy, Redis caching

### Actual Tech Stack (from package.json/requirements.txt)

| Category          | Technology        | Version | Notes                      |
| ------------------ | ------------------ | ------- | -------------------------- |
| **Backend**        | Python / FastAPI   | 3.11+   | Async FastAPI with Pydantic validation |
| **ORM**            | SQLAlchemy         | 2.0.23  | Modern SQLAlchemy with async support |
| **Database**       | PostgreSQL         | 15      | JSONB support for flexible data |
| **Cache & Jobs**   | Redis              | 7+      | Session management and background tasks |
| **AI Pipeline**    | LangChain + Gemini | 1.0.1   | Classification system (currently offline) |
| **Frontend**       | React / TypeScript | 18.2.0  | Modern React with strict TypeScript |
| **UI Framework**   | Mantine            | 8.3.1   | Component library with theming |
| **State Mgmt**     | Zustand            | 5.0.8   | Lightweight state management |
| **HTTP Client**    | Axios              | 1.6.0   | API communication |
| **Build Tool**     | Vite               | 5.0.8   | Fast development server |
| **Testing Backend**| pytest             | latest  | Comprehensive test suite |
| **Testing Frontend**| Vitest             | 1.0.4   | Fast unit testing |
| **Infrastructure** | Docker Compose     | latest  | Container orchestration |
| **Reverse Proxy**  | Nginx              | latest  | Load balancing and SSL termination |

### Repository Structure Reality Check

- **Type**: Monorepo with clear service separation
- **Package Manager**: npm for frontend, pip for Python services
- **Build System**: Docker multi-stage builds with separate dev/prod images
- **Notable Issues**: Bot service disabled, complex testing setup

---

## Source Tree and Module Organization

### Project Structure (Actual)

```
recyclic/
├── api/                           # FastAPI Backend Service
│   ├── src/recyclic_api/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic settings
│   │   │   ├── database.py       # SQLAlchemy setup
│   │   │   └── security.py       # JWT and password hashing
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── deposit.py
│   │   │   ├── sale.py
│   │   │   └── cash_session.py
│   │   ├── api/api_v1/
│   │   │   ├── api.py           # Main router
│   │   │   └── endpoints/       # Route handlers
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       └── cash_sessions.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── user_service.py
│   │   │   └── cash_session_service.py
│   │   └── repositories/        # Data access layer
│   ├── tests/                   # pytest test suite
│   ├── migrations/              # Alembic migrations
│   └── Dockerfile*              # Multiple Dockerfiles for different stages
├── bot/                         # Telegram Bot Service (DISABLED)
│   ├── src/
│   │   └── telegram_bot.py
│   └── Dockerfile
├── frontend/                     # React PWA Frontend
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── pages/              # Page components
│   │   │   ├── Admin/          # Admin dashboard pages
│   │   │   ├── CashRegister/   # Cash register workflow
│   │   │   └── Login.tsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── business/       # Business-specific components
│   │   │   └── ui/             # Generic UI primitives
│   │   ├── stores/             # Zustand state stores
│   │   │   ├── authStore.ts
│   │   │   ├── cashSessionStore.ts
│   │   └── generated/          # OpenAPI-generated API client
│   ├── test/                   # Vitest test suite
│   └── Dockerfile*
├── docs/                        # Documentation
│   ├── architecture.md         # Current architecture (idealized)
│   ├── prd.md                  # Product requirements
│   └── testing-strategy.md     # Testing approach
├── docker-compose.yml          # Development orchestration
├── docker-compose.prod.yml     # Production deployment
└── scripts/                    # Build and deployment scripts
```

### Key Modules and Their Purpose

- **User Management**: `api/src/recyclic_api/services/user_service.py` - Handles all user operations with role-based access
- **Authentication**: `api/src/recyclic_api/api/api_v1/endpoints/auth.py` - JWT-based auth with Telegram integration
- **Cash Sessions**: `frontend/src/stores/cashSessionStore.ts` - Complex PWA offline state management
- **Database Layer**: `api/src/recyclic_api/repositories/` - Repository pattern for data access
- **API Client**: `frontend/src/generated/api.ts` - Auto-generated from OpenAPI spec
- **Testing Infrastructure**: Separate Docker services for isolated testing

---

## Data Models and APIs

### Data Models

**User Model** (`api/src/recyclic_api/models/user.py`):
```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=True)
    telegram_id: Mapped[str] = mapped_column(unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(nullable=True)  # For future email auth
    role: Mapped[UserRole] = mapped_column(default=UserRole.user)
    status: Mapped[UserStatus] = mapped_column(default=UserStatus.pending)
    # ... additional fields
```

**Cash Session Model** (`api/src/recyclic_api/models/cash_session.py`):
```python
class CashSession(Base):
    __tablename__ = "cash_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    opened_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    closed_at: Mapped[datetime] = mapped_column(nullable=True)
    opening_amount: Mapped[float] = mapped_column(default=0.0)
    # Complex relationships with sales and reconciliation
```

### API Specifications

- **OpenAPI Spec**: Auto-generated from FastAPI decorators
- **Client Generation**: `frontend/scripts/generate-api.cjs` creates TypeScript client
- **Manual Endpoints**: Some endpoints not fully documented in OpenAPI

**Critical Issue**: Type duplication between Pydantic models and generated TypeScript types requires manual synchronization.

---

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Bot Service Disabled** (story-b36-p3):
   - Entire bot service commented out in `docker-compose.yml`
   - AI classification pipeline offline
   - Significant functionality gap from PRD requirements

2. **Type Duplication Crisis**:
   - Pydantic models in backend manually duplicated as TypeScript types
   - Code generation script exists but has integration issues
   - High risk of inconsistencies between frontend/backend contracts

3. **Authentication Migration Complexity**:
   - Current system: Telegram-only authentication
   - Planned: Email/password authentication
   - Complex migration path with user data preservation

4. **Testing Infrastructure Complexity**:
   - Separate Docker services for testing
   - Database setup issues with Alembic migrations
   - Tests excluded from migration runs due to known issues

### Workarounds and Gotchas

- **Environment Variables**: Must set `NODE_ENV=production` even for staging (historical artifact)
- **Bot Service**: All bot-related code exists but service is disabled - don't activate without coordination
- **API Code Generation**: Script exists (`npm run codegen`) but may not be fully functional
- **Migration Issues**: Known problems with Alembic in test environments - use `-k "not migration"`

---

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Gemini AI | Object classification | LangChain SDK    | `api/src/recyclic_api/services/ai_service.py` |
| Telegram | Bot communication | python-telegram-bot | `bot/src/telegram_bot.py` (disabled) |
| Brevo | Email service | REST API | `api/src/recyclic_api/services/email_service.py` |

### Internal Integration Points

- **Frontend-Backend**: REST API with OpenAPI-generated client
- **Bot-API**: Direct API calls for user validation and deposit recording
- **PWA Offline**: IndexedDB for local storage with sync on reconnection
- **State Management**: Zustand stores with complex inter-store dependencies

---

## Development and Deployment

### Local Development Setup

**Working Setup** (from docker-compose.yml):
1. PostgreSQL + Redis containers start first
2. API container with hot reload via volume mounts
3. Frontend container with Vite dev server
4. Bot container (currently disabled)

**Known Issues**:
- Bot service disabled - cannot test Telegram integration
- Complex Docker setup with multiple health checks
- Volume mounts may cause permission issues on Windows

### Build and Deployment Process

- **Development**: `docker-compose up` with hot reload
- **Production**: Multi-stage Docker builds with Nginx
- **Rollback**: Script exists but untested (`scripts/rollback.sh`)

---

## Testing Reality

### Current Test Coverage

- **Backend**: pytest with comprehensive fixtures, ~60-70% coverage
- **Frontend**: Vitest with React Testing Library, extensive mocking
- **Integration**: Docker-based testing with separate services
- **E2E**: Playwright for critical user journeys

### Running Tests

```bash
# Backend tests (isolated environment)
docker-compose run --rm api-tests

# Frontend tests
cd frontend && npm test

# Skip migration tests (known issues)
docker-compose run --rm api-tests -k "not migration"
```

---

## Enhancement Impact Analysis

### Files That Will Need Modification

Based on PRD requirements, these files will be affected:

- **User System**: `api/src/recyclic_api/models/user.py`, `api/src/recyclic_api/services/user_service.py`
- **Authentication**: Complex changes to auth endpoints and Telegram integration
- **Cash Interface**: `frontend/src/pages/CashRegister/`, `frontend/src/stores/cashSessionStore.ts`
- **Bot Reactivation**: Uncomment and fix bot service (story-b36-p3)
- **Database**: New tables for enhanced cash session management

### New Files/Modules Needed

- **Email Auth**: New auth endpoints and services
- **Enhanced PWA**: Improved offline cash register capabilities
- **Bot AI Pipeline**: Reactivate LangChain + Gemini integration
- **Advanced Reporting**: Email-based report generation

### Integration Considerations

- Must maintain backward compatibility during auth migration
- PWA offline functionality critical for cash register reliability
- Bot reactivation requires AI service configuration
- Email service integration already exists but unused

---

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development startup
docker-compose up -d

# Backend testing
docker-compose run --rm api-tests

# Frontend development
cd frontend && npm run dev

# API code generation (may have issues)
cd frontend && npm run codegen

# Database migrations
docker-compose run --rm api-migrations alembic upgrade head
```

### Debugging and Troubleshooting

- **API Logs**: `docker-compose logs -f api`
- **Frontend Build Issues**: Check Vite config and OpenAPI generation
- **Database Issues**: Use `docker-compose exec postgres psql` for direct access
- **Bot Issues**: Service currently disabled - check story-b36-p3 for reactivation

---

## Critical Constraints and Requirements

### Must Respect These Constraints

1. **PWA Offline Capability**: Cash register must work without internet
2. **Telegram Authentication**: Core user identification mechanism
3. **PostgreSQL JSONB**: Used for flexible data storage
4. **Docker-Only Deployment**: No alternative deployment paths supported
5. **OpenAPI Contract**: Frontend-backend synchronization via code generation

### Technical Debt Priority

1. **HIGH**: Reactivate bot service (blocks AI classification feature)
2. **HIGH**: Fix API code generation (prevents type inconsistencies)
3. **MEDIUM**: Simplify testing infrastructure
4. **MEDIUM**: Complete auth migration to email/password

This document represents the **true state** of the Recyclic codebase. All enhancements must work within these constraints and address the identified technical debt appropriately.