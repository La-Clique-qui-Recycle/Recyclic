@echo off
echo 🚀 Démarrage de Recyclic...

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé. Veuillez installer Docker d'abord.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord.
    pause
    exit /b 1
)

REM Vérifier si le fichier .env existe
if not exist .env (
    echo 📝 Création du fichier .env à partir de env.example...
    copy env.example .env
    echo ⚠️  Veuillez configurer les variables d'environnement dans le fichier .env
)

REM Construire et démarrer les services
echo 🔨 Construction des images Docker...
docker-compose build

echo 🚀 Démarrage des services...
docker-compose up -d

REM Attendre que les services soient prêts
echo ⏳ Attente du démarrage des services...
timeout /t 10 /nobreak >nul

REM Vérifier le statut des services
echo 🔍 Vérification du statut des services...
docker-compose ps

REM Tester l'API
echo 🧪 Test de l'API...
timeout /t 5 /nobreak >nul
curl -f http://localhost:4433/health >nul 2>&1 || echo ⚠️  L'API n'est pas encore prête

echo.
echo ✅ Recyclic est démarré !
echo.
echo 🌐 Services disponibles :
echo    • API: http://localhost:4433
echo    • Documentation: http://localhost:4433/docs
echo    • Frontend: http://localhost:4444
echo    • PostgreSQL: localhost:5432
echo    • Redis: localhost:6379
echo.
echo 📚 Commandes utiles :
echo    • Voir les logs: docker-compose logs -f
echo    • Arrêter: docker-compose down
echo    • Redémarrer: docker-compose restart
pause
