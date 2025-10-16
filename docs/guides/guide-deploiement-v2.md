# Guide de Déploiement Recyclic V2

**Version:** 2.0
**Date:** 2025-10-16
**Architecture:** Stacks Docker Indépendantes
**Public:** Développeurs et équipe technique

---

## 🎯 Vue d'Ensemble Rapide

Recyclic utilise maintenant une architecture Docker avec **stacks complètement indépendantes** :

- 📁 **3 fichiers Docker Compose séparés** (un par environnement)
- 🔒 **Isolation totale** (volumes, réseaux, projets différents)
- ✅ **Validation automatisée** (scripts de pré-déploiement)
- 🚀 **Déploiement simultané** possible (staging + prod sur même serveur)

```
Recyclic/
├── docker-compose.yml          # DEV uniquement
├── docker-compose.staging.yml  # STAGING complet
├── docker-compose.prod.yml     # PRODUCTION complet
├── .env                        # Config DEV
├── .env.staging               # Config STAGING
└── .env.production            # Config PRODUCTION
```

---

## 🖥️ Développement Local

### Quick Start

```bash
# 1. Cloner et configurer
git clone <repository-url>
cd recyclic
cp .env.example .env

# 2. Éditer .env avec vos valeurs
nano .env

# 3. Démarrer
docker compose --profile dev up -d --build

# 4. Accéder
# Frontend: http://localhost:4444
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Variables Essentielles (.env)

```bash
POSTGRES_PASSWORD=votre_mot_de_passe
SECRET_KEY=votre_cle_secrete_longue
TELEGRAM_BOT_TOKEN=votre_token_bot
ADMIN_TELEGRAM_IDS=votre_telegram_id
FRONTEND_URL=http://localhost:4444
VITE_API_URL=/api
```

### Commandes Courantes

```bash
# Voir les logs
docker compose logs -f

# Logs d'un service
docker compose logs -f api

# Redémarrer
docker compose restart api

# Arrêter
docker compose --profile dev down
```

---

## 🧪 Environnement Staging

### Prérequis

- Serveur avec Docker installé
- DNS configuré pour `devrecyclic.jarvos.eu`
- Traefik en cours d'exécution

### Déploiement

```bash
# 1. Se connecter au serveur
ssh utilisateur@serveur

# 2. Cloner le repository
git clone <repository-url>
cd recyclic

# 3. Créer .env.staging depuis le template
cp .env.staging.template .env.staging
nano .env.staging

# 4. Validation pré-déploiement (OBLIGATOIRE)
bash scripts/pre-deployment-check.sh staging

# 5. Créer un backup (si existant)
bash scripts/backup-database.sh staging

# 6. Déployer la stack staging
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d --build

# 7. Valider Traefik
bash scripts/validate-traefik.sh staging

# 8. Vérifier
curl https://devrecyclic.jarvos.eu/api/health
```

### Variables Critiques (.env.staging)

```bash
POSTGRES_PASSWORD=mot_de_passe_staging_fort
SECRET_KEY=cle_secrete_staging_longue
TELEGRAM_BOT_TOKEN=token_bot_staging
FRONTEND_URL=https://devrecyclic.jarvos.eu
VITE_API_URL_STAGING=/api
ENVIRONMENT=staging
```

---

## 🚀 Environnement Production

### ⚠️ AVERTISSEMENT

Le déploiement en production nécessite une procédure complète avec validation, backup et rollback.

**→ Utiliser le runbook complet : [Deployment Independent Stacks](../runbooks/deployment-independent-stacks.md)**

### Résumé des Commandes (après lecture du runbook)

```bash
# Phase 0 : Pré-validation (OBLIGATOIRE)
bash scripts/pre-deployment-check.sh prod

# Phase 1 : Backup (CRITIQUE)
bash scripts/backup-database.sh prod

# Phase 2 : Arrêt de l'ancienne stack (si migration)
docker compose --profile prod down --remove-orphans

# Phase 3 : Déploiement de la nouvelle stack
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d --build

# Phase 4 : Validation
watch -n 5 'docker compose -p recyclic-prod -f docker-compose.prod.yml ps'
bash scripts/validate-traefik.sh prod

# Phase 5 : Tests
curl https://recyclic.jarvos.eu/api/health
curl -I https://recyclic.jarvos.eu
```

### Variables Critiques (.env.production)

```bash
POSTGRES_PASSWORD=mot_de_passe_production_TRES_fort
SECRET_KEY=cle_secrete_production_TRES_longue_et_aleatoire
TELEGRAM_BOT_TOKEN=token_bot_production
FRONTEND_URL=https://recyclic.jarvos.eu
VITE_API_URL_PROD=/api
ENVIRONMENT=production
BREVO_API_KEY=cle_api_brevo_production
EMAIL_FROM_ADDRESS=noreply@recyclic.fr
```

---

## 🔧 Gestion au Quotidien

### Démarrer/Arrêter

```bash
# DEV
docker compose --profile dev up -d
docker compose --profile dev down

# STAGING
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d
docker compose -p recyclic-staging -f docker-compose.staging.yml down

# PRODUCTION
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d
docker compose -p recyclic-prod -f docker-compose.prod.yml down
```

### Mise à Jour du Code

```bash
# 1. Récupérer les modifications
git pull origin main

# 2. STAGING : Déployer
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d --build

# 3. PRODUCTION : Suivre le runbook complet
# Voir: docs/runbooks/deployment-independent-stacks.md
```

### Logs et Monitoring

```bash
# STAGING
docker compose -p recyclic-staging -f docker-compose.staging.yml logs -f
docker compose -p recyclic-staging -f docker-compose.staging.yml logs -f api

# PRODUCTION
docker compose -p recyclic-prod -f docker-compose.prod.yml logs -f
docker compose -p recyclic-prod -f docker-compose.prod.yml logs -f api
```

### Backup de la Base de Données

```bash
# Utiliser le script automatisé
bash scripts/backup-database.sh staging
bash scripts/backup-database.sh prod

# Backups stockés dans ./backups/
# Rétention : 7 jours automatique
```

---

## 🛠️ Outils de Validation

### Scripts Disponibles

| Script | Utilité | Quand |
|--------|---------|-------|
| `scripts/pre-deployment-check.sh` | Valide l'environnement avant déploiement | Avant chaque déploiement |
| `scripts/backup-database.sh` | Backup vérifié avec checksum | Avant modif production |
| `scripts/validate-traefik.sh` | Valide routage Traefik | Après déploiement |

### Exemple d'Utilisation

```bash
# Avant de déployer en staging
bash scripts/pre-deployment-check.sh staging
# ✅ Tous les checks doivent passer

# Créer un backup
bash scripts/backup-database.sh staging
# ✅ Vérifie que le backup existe

# Après déploiement
bash scripts/validate-traefik.sh staging
# ✅ Vérifie que Traefik route correctement
```

---

## 🆘 Dépannage Rapide

### Service ne démarre pas

```bash
# Vérifier les logs
docker compose -p recyclic-prod -f docker-compose.prod.yml logs api

# Vérifier l'état
docker compose -p recyclic-prod -f docker-compose.prod.yml ps

# Redémarrer
docker compose -p recyclic-prod -f docker-compose.prod.yml restart api
```

### Erreur de connexion base de données

```bash
# Vérifier PostgreSQL
docker compose -p recyclic-prod -f docker-compose.prod.yml ps postgres

# Vérifier les variables
docker compose -p recyclic-prod -f docker-compose.prod.yml exec api env | grep DATABASE_URL
```

### Traefik ne route pas

```bash
# Vérifier le réseau
docker network inspect traefik-public

# Valider avec le script
bash scripts/validate-traefik.sh prod

# Vérifier les labels
docker inspect <container-id> | grep traefik
```

---

## 📚 Documentation Complète

### Pour Aller Plus Loin

- 📖 **Runbook Ops Complet** : [deployment-independent-stacks.md](../runbooks/deployment-independent-stacks.md)
  - Procédure complète de déploiement production
  - Validation en phases
  - Rollback
  - Résolution de problèmes avancée

- 🏗️ **Architecture** : [docs/architecture/architecture.md](../architecture/architecture.md)
  - Vue d'ensemble technique
  - Stack technologique
  - Diagrammes

- 🧪 **Tests** : [docs/testing-strategy.md](../testing-strategy.md)
  - Stratégie de test
  - Comment lancer les tests

---

## 🔄 Migration depuis l'Ancienne Architecture

Si vous utilisez encore l'ancienne architecture avec profiles (`--profile staging`, `--profile prod`), consultez le runbook pour la procédure de migration sécurisée.

**→ [Section Migration du Runbook](../runbooks/deployment-independent-stacks.md#procédure-de-déploiement-sécurisée)**

---

## 📞 Support

- 📄 **Logs** : `docker compose logs -f`
- 📖 **API Docs** : `http://localhost:8000/docs` (dev)
- 🐛 **Issues** : Créer une issue sur le repository
- 👥 **Équipe** : Contacter l'équipe de développement

---

**Dernière mise à jour** : 2025-10-16
**Version du guide** : 2.0
**Architecture** : Stacks Indépendantes (Epic B31)
