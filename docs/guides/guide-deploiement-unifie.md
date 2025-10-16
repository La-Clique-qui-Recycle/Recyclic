# Guide de Déploiement Unifié - Recyclic

**Version:** 1.1  
**Date:** 2025-10-15  
**Auteur:** Équipe de Développement Recyclic  

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Développement Local](#développement-local)
3. [Environnement de Staging](#environnement-de-staging)
4. [Environnement de Production](#environnement-de-production)
5. [Concepts et Architecture](#concepts-et-architecture)
6. [Dépannage](#dépannage)
7. [Maintenance](#maintenance)

---

## Vue d'ensemble

Ce guide unifié explique comment déployer l'application Recyclic dans tous les environnements. L'architecture repose sur :

- **Profiles Docker Compose** : `dev`, `staging`, `prod`
- **Fichiers d'environnement** : `.env`, `.env.staging`, `.env.production`
- **Configuration dynamique** : Variables d'environnement par environnement

### Architecture des Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Bot Telegram  │
│   (React/Vite)  │◄──►│   (FastAPI)     │◄──►│   (Python)     │
│   Port: 4444    │    │   Port: 8000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼───────┐           ┌───────▼───────┐
            │  PostgreSQL   │           │    Redis      │
            │  Port: 5432   │           │  Port: 6379   │
            └───────────────┘           └───────────────┘
```

---

## Développement Local

### Prérequis

- Docker Desktop installé et démarré
- Git installé
- Accès au repository Recyclic

### Configuration

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd recyclic
   ```

2. **Créer le fichier d'environnement local**
   ```bash
   cp env.example .env
   ```
   
   Éditer `.env` avec vos valeurs :
   ```bash
   # Base de données
   POSTGRES_PASSWORD=votre_mot_de_passe
   
   # API
   SECRET_KEY=votre_cle_secrete
   API_V1_STR=/v1
   ROOT_PATH=
   
   # Bot Telegram
   TELEGRAM_BOT_TOKEN=votre_token_bot
   ADMIN_TELEGRAM_IDS=votre_telegram_id
   
   # URLs
   FRONTEND_URL=http://localhost:4444
   VITE_API_URL=/api
   ```

### Démarrage

```bash
# Démarrer (ou reconstruire) tous les services en mode développement
docker compose --profile dev up -d --build

# Vérifier le statut des services
docker compose ps
```

### Accès aux Services

- **Frontend** : http://localhost:4444
- **API Backend** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs
- **PostgreSQL** : localhost:5432 (utilisateur: `recyclic`)
- **Redis** : localhost:6379

### Commandes Utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f api

# Redémarrer un service
docker compose restart api

# Arrêter tous les services
docker compose --profile dev down
```

---

## Environnement de Staging

### Prérequis

- Serveur avec Docker installé
- Accès SSH au serveur
- Configuration DNS pour `devrecyclic.jarvos.eu`

### Configuration DNS

```
Type: A
Nom: devrecyclic.jarvos.eu
Valeur: <IP_DU_SERVEUR>
TTL: 300
```

### Déploiement

1. **Se connecter au serveur**
   ```bash
   ssh utilisateur@devrecyclic.jarvos.eu
   ```

2. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd recyclic
   ```

3. **Créer le fichier d'environnement staging**
   ```bash
   cp env.example .env.staging
   ```
   
   Configurer `.env.staging` :
   ```bash
   # Base de données
   POSTGRES_PASSWORD=mot_de_passe_staging
   
   # API
   SECRET_KEY=cle_secrete_staging
   API_V1_STR=/v1
   ROOT_PATH=/api
   
   # Bot Telegram
   TELEGRAM_BOT_TOKEN=token_bot_staging
   ADMIN_TELEGRAM_IDS=telegram_id_admin
   
   # URLs
   FRONTEND_URL=https://devrecyclic.jarvos.eu
   VITE_API_URL_STAGING=https://devrecyclic.jarvos.eu/api
   ```

4. **Déployer**
   ```bash
   # Construire et démarrer les services en utilisant le fichier d'environnement de staging
   docker compose --env-file .env.staging --profile staging up -d --build
   
   # Vérifier le déploiement
   docker compose ps
   curl https://devrecyclic.jarvos.eu/health
   ```

### Monitoring

```bash
# Voir les logs
docker compose logs -f

# Vérifier l'état des services
docker compose ps

# Redémarrer si nécessaire
docker compose --profile staging restart
```

---

## Environnement de Production

### Prérequis

- Serveur de production avec Docker
- Accès SSH sécurisé
- Configuration DNS pour `recyclic.jarvos.eu`
- Certificats SSL (Let's Encrypt recommandé)

### Configuration DNS

```
Type: A
Nom: recyclic.jarvos.eu
Valeur: <IP_DU_SERVEUR_PRODUCTION>
TTL: 300
```

### Déploiement

1. **Se connecter au serveur de production**
   ```bash
   ssh utilisateur@recyclic.jarvos.eu
   ```

2. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd recyclic
   ```

3. **Créer le fichier d'environnement production**
   ```bash
   cp env.example .env.production
   ```
   
   Configurer `.env.production` avec les valeurs de production :
   ```bash
   # Base de données (mots de passe forts)
   POSTGRES_PASSWORD=mot_de_passe_production_fort
   
   # API (clé secrète forte)
   SECRET_KEY=cle_secrete_production_tres_forte
   API_V1_STR=/v1
   ROOT_PATH=/api
   
   # Bot Telegram (token de production)
   TELEGRAM_BOT_TOKEN=token_bot_production
   ADMIN_TELEGRAM_IDS=telegram_id_admin1,telegram_id_admin2
   
   # URLs
   FRONTEND_URL=https://recyclic.jarvos.eu
   VITE_API_URL_PROD=https://recyclic.jarvos.eu/api
   
   # Email (Brevo)
   BREVO_API_KEY=cle_api_brevo_production
   EMAIL_FROM_ADDRESS=noreply@recyclic.fr
   ```

4. **Déployer en production**
   ```bash
   # Construire et démarrer les services en utilisant le fichier d'environnement de production
   docker compose --env-file .env.production --profile prod up -d --build
   
   # Vérifier le déploiement
   docker compose ps
   curl https://recyclic.jarvos.eu/health
   ```

### Sécurité Production

```bash
# Configurer le pare-feu
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Configurer SSL avec Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d recyclic.jarvos.eu
```

---

## Concepts et Architecture

### Fichiers d'Environnement

Les fichiers `.env` contiennent les variables d'environnement spécifiques à chaque environnement :

- **`.env`** : Développement local
- **`.env.staging`** : Environnement de test
- **`.env.production`** : Production

### Profiles Docker Compose

Les profiles permettent de démarrer différents ensembles de services :

- **`dev`** : Tous les services + outils de développement
- **`staging`** : Services de production + monitoring
- **`prod`** : Services de production uniquement

### Variables d'Environnement Clés

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL de l'API pour le frontend | `http://localhost:8000` |
| `FRONTEND_URL` | URL publique du frontend | `https://recyclic.jarvos.eu` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `mot_de_passe_fort` |
| `SECRET_KEY` | Clé secrète pour l'API | `cle_secrete_aleatoire` |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram | `123456789:ABC...` |

---

## Dépannage

### Erreurs Courantes

#### 1. "Mixed Content" Error

**Symptôme** : Le frontend ne peut pas communiquer avec l'API en HTTPS.

**Cause** : Configuration incorrecte des URLs dans les fichiers d'environnement.

**Solution** :
```bash
# Vérifier les URLs dans .env
VITE_API_URL=https://recyclic.jarvos.eu/api  # Pas http://
FRONTEND_URL=https://recyclic.jarvos.eu      # Pas http://
```

#### 2. Services qui ne démarrent pas

**Symptôme** : `docker compose ps` montre des services "unhealthy".

**Solution** :
```bash
# Vérifier les logs
docker compose logs api
docker compose logs postgres

# Redémarrer les services
docker compose restart
```

#### 3. Erreur de connexion à la base de données

**Symptôme** : L'API ne peut pas se connecter à PostgreSQL.

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré
docker compose ps postgres

# Vérifier les variables d'environnement
docker compose exec api env | grep DATABASE_URL
```

#### 4. Bot Telegram ne répond pas

**Symptôme** : Le bot ne répond pas aux commandes.

**Solution** :
```bash
# Vérifier les logs du bot
docker compose logs bot

# Vérifier le token
docker compose exec bot env | grep TELEGRAM_BOT_TOKEN
```

### Commandes de Diagnostic

```bash
# État général des services
docker compose ps

# Logs en temps réel
docker compose logs -f

# Vérifier la connectivité réseau
docker compose exec api ping postgres
docker compose exec api ping redis

# Vérifier les variables d'environnement
docker compose exec api env
```

---

## Maintenance

### Mise à Jour du Code

```bash
# Récupérer les dernières modifications
git pull origin main

# Redéployer
docker compose --profile prod up -d --build
```

### Mise à Jour de l'API (Codegen)

**Quand utiliser** : Après toute modification de la spécification OpenAPI (`api/openapi.json`).

**Commande** :
```bash
# Depuis le dossier frontend/
cd frontend
npm run codegen
```

**Prérequis** :
- `VITE_API_URL` défini dans `.env` ou `.env.local`
- Node.js installé localement

**Résultat** :
- Types TypeScript générés dans `frontend/src/generated/`
- Client API mis à jour avec les nouveaux endpoints

### Sauvegarde de la Base de Données

```bash
# Créer une sauvegarde
docker compose exec postgres pg_dump -U recyclic -d recyclic > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker compose exec -T postgres psql -U recyclic -d recyclic < backup_20250127_143000.sql
```

### Monitoring des Performances

```bash
# Utilisation des ressources
docker stats

# Logs d'erreur
docker compose logs --tail=100 | grep ERROR

# Santé des services
curl https://recyclic.jarvos.eu/health
```

### Mise à Jour des Dépendances

```bash
# Mise à jour des images Docker
docker compose pull
docker compose --profile prod up -d

# Nettoyage des images inutilisées
docker system prune -f
```

---

## Support et Contact

Pour toute question ou problème :

1. Consulter les logs : `docker compose logs -f`
2. Vérifier la documentation API : `http://localhost:8000/docs`
3. Contacter l'équipe de développement

---

**Dernière mise à jour** : 2025-10-15  
**Version du guide** : 1.1
