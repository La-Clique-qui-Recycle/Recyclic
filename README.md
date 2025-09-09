# Recyclic - Plateforme de Recyclage Intelligente

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose installés
- Git installé

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd Recyclic
   ```

2. **Configurer l'environnement**
   ```bash
   # Copier le fichier d'environnement
   cp env.example .env
   
   # Éditer les variables d'environnement
   # Modifier les valeurs dans .env selon vos besoins
   ```

3. **Démarrer l'application**
   
   **Sur Windows :**
   ```cmd
   start.bat
   ```
   
   **Sur Linux/Mac :**
   ```bash
   ./start.sh
   ```
   
   **Ou manuellement :**
   ```bash
   docker-compose up -d
   ```

### 🌐 Services Disponibles

Une fois démarré, les services suivants sont accessibles :

- **API FastAPI** : http://localhost:4433
- **Documentation API** : http://localhost:4433/docs
- **Interface Web** : http://localhost:4444
- **Base de données PostgreSQL** : localhost:5432
- **Redis** : localhost:6379

### 📚 Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart <service-name>

# Reconstruire les images
docker-compose build --no-cache

# Accéder à la base de données
docker-compose exec postgres psql -U recyclic -d recyclic
```

## 🏗️ Architecture

### Structure du Projet

```
recyclic/
├── api/                    # API FastAPI
│   ├── src/
│   │   ├── api/           # Routes API
│   │   ├── core/          # Configuration
│   │   ├── models/        # Modèles SQLAlchemy
│   │   ├── schemas/       # Schémas Pydantic
│   │   └── tests/         # Tests
│   ├── migrations/        # Migrations Alembic
│   ├── requirements.txt
│   └── Dockerfile
├── bot/                   # Bot Telegram
│   ├── src/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # Interface web React
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docs/                  # Documentation
├── docker-compose.yml
└── README.md
```

### Technologies Utilisées

- **Backend** : FastAPI, SQLAlchemy, Alembic
- **Base de données** : PostgreSQL 15
- **Cache** : Redis 7
- **Bot** : python-telegram-bot
- **Frontend** : React 18, Styled Components
- **Conteneurisation** : Docker, Docker Compose

## 🔧 Développement

### Configuration de l'Environnement

1. **Variables d'environnement** (fichier `.env`) :
   ```env
   POSTGRES_PASSWORD=recyclic_secure_password_2024
   SECRET_KEY=your-super-secret-key-here
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   ENVIRONMENT=development
   ```

2. **Base de données** :
   - Base de données : `recyclic`
   - Utilisateur : `recyclic`
   - Mot de passe : configuré dans `.env`

### Tests

```bash
# Tests de l'API
cd api
python -m pytest tests/

# Tests avec Docker
docker-compose exec api python -m pytest tests/
```

### Migrations

```bash
# Créer une nouvelle migration
cd api
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head
```

## 📖 Documentation

- [Architecture du projet](docs/architecture/)
- [Spécifications API](docs/architecture/api-specification.md)
- [Guide de développement](docs/architecture/development-workflow.md)
- [Stratégie de tests](docs/architecture/testing-strategy.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement