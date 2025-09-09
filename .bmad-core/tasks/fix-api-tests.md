<!-- Powered by BMAD™ Core -->

# Fix API Tests Infrastructure

## Task Overview

**Objective:** Corriger les 3 échecs dans `api/tests/test_infrastructure.py` pour que tous les tests passent.

**Context:** Suite au QA check de la Story 1.2, des problèmes de tests ont été identifiés qui empêchent l'exécution des tests d'infrastructure.

## Issues Identified

### 1. Missing psycopg2 dependency
**Error:** `ModuleNotFoundError: No module named 'psycopg2'`
**Root Cause:** Le module `psycopg2-binary` est dans requirements.txt mais pas installé dans l'environnement de test
**Impact:** Tests ne peuvent pas s'exécuter

### 2. Database connection issues
**Error:** Tests tentent de se connecter à une vraie base de données
**Root Cause:** Configuration de test utilise la même DB que le développement
**Impact:** Tests peuvent échouer si DB n'est pas disponible

### 3. Pydantic deprecation warnings
**Warning:** `Support for class-based config is deprecated`
**Root Cause:** Utilisation de l'ancienne syntaxe Pydantic
**Impact:** Warnings qui polluent les logs de test

## Required Actions

### Action 1: Fix Test Environment Setup
```bash
# Install missing dependencies
cd api
pip install -r requirements.txt

# Or use Docker for consistent environment
docker-compose exec api pip install -r requirements.txt
```

### Action 2: Fix Test Database Configuration
**File:** `api/tests/test_infrastructure.py`
**Changes needed:**
- Use in-memory SQLite for tests instead of PostgreSQL
- Mock external dependencies (Redis, etc.)
- Ensure test isolation

### Action 3: Fix Pydantic Configuration
**Files to check:**
- `api/src/core/config.py`
- `api/src/schemas/*.py`
**Changes needed:**
- Replace `class Config:` with `model_config = ConfigDict(...)`
- Update Pydantic v2 syntax

## Implementation Steps

1. **Install Dependencies**
   ```bash
   cd api
   pip install psycopg2-binary pytest pytest-asyncio
   ```

2. **Create Test Configuration**
   - Add test-specific database URL
   - Mock external services
   - Ensure test isolation

3. **Update Pydantic Models**
   - Fix deprecated configuration syntax
   - Test compatibility with Pydantic v2

4. **Run Tests**
   ```bash
   cd api
   python -m pytest tests/test_infrastructure.py -v
   ```

## Expected Outcome

- All tests in `test_infrastructure.py` pass
- No deprecation warnings
- Tests run in isolated environment
- CI/CD pipeline can execute tests successfully

## Validation Criteria

- [ ] `pytest tests/test_infrastructure.py` returns exit code 0
- [ ] No `ModuleNotFoundError` exceptions
- [ ] No Pydantic deprecation warnings
- [ ] Tests run without external dependencies

## Files to Modify

- `api/tests/test_infrastructure.py` (test configuration)
- `api/src/core/config.py` (Pydantic config)
- `api/src/schemas/*.py` (Pydantic models)
- `api/requirements.txt` (if needed)

## Priority: HIGH

This task blocks the completion of Story 1.2 and affects the overall project quality.
