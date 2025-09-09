@echo off
REM Script de test PostgreSQL/Redis pour Windows + Docker Desktop
REM Usage: test_postgres.bat

echo 🚀 Démarrage des tests PostgreSQL/Redis pour Recyclic
echo ==================================================

REM Vérifier que Docker est en cours d'exécution
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop.
    exit /b 1
)

REM Démarrer PostgreSQL et Redis
echo 📦 Démarrage des services PostgreSQL et Redis...
docker-compose up -d postgres redis

REM Attendre que les services soient prêts
echo ⏳ Attente du démarrage des services...
timeout /t 10 /nobreak >nul

REM Vérifier que les services sont accessibles
echo 🔍 Vérification de la connectivité...
docker-compose exec postgres pg_isready -U postgres
if errorlevel 1 (
    echo ❌ PostgreSQL n'est pas prêt
    exit /b 1
)

docker-compose exec redis redis-cli ping | findstr PONG >nul
if errorlevel 1 (
    echo ❌ Redis n'est pas prêt
    exit /b 1
)

echo ✅ Services PostgreSQL et Redis prêts

REM Charger les variables d'environnement
echo 🔧 Configuration de l'environnement de test...
set ENVIRONMENT=test_postgres
set TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_test
set REDIS_URL=redis://localhost:6379/1

REM Installer les dépendances si nécessaire
echo 📦 Installation des dépendances...
pip install -e . >nul 2>&1
pip install -r requirements.txt >nul 2>&1

REM Exécuter les tests de connectivité d'abord
echo 🧪 Exécution des tests de connectivité...
python -m pytest tests/test_postgres_connectivity.py -v

REM Exécuter tous les tests
echo 🧪 Exécution de la suite complète de tests...
python -m pytest -v

echo ✅ Tests terminés avec succès!
echo ==================================================
