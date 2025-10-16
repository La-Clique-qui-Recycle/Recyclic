# Guide de Déploiement - Stacks Indépendantes (Production & Staging)

**Version:** 1.0
**Date:** 2025-10-16
**Story:** STORY-B31-P1

---

## Vue d'Ensemble

Ce guide décrit la procédure de déploiement et de gestion des environnements **Production** et **Staging** avec la nouvelle architecture Docker basée sur des stacks complètement indépendantes.

### Changements Majeurs

- ✅ **Séparation complète** : Chaque environnement a son propre fichier `docker-compose`
- ✅ **Isolation totale** : Les volumes et réseaux sont uniques par environnement
- ✅ **Pas de profiles** : Plus besoin de `--profile`, utilisation de `-f` à la place
- ✅ **Nommage de projet** : Utilisation de `-p` pour éviter les conflits

---

## Architecture des Fichiers

```
Recyclic/
├── docker-compose.yml          # Dev uniquement (local)
├── docker-compose.prod.yml     # Production
├── docker-compose.staging.yml  # Staging
├── .env                        # Dev
├── .env.production             # Production (à créer)
├── .env.staging                # Staging (à créer)
├── .env.production.template    # Template pour production
└── .env.staging.template       # Template pour staging
```

---

## Prérequis

### Sur le Serveur VPS

1. **Docker & Docker Compose** installés et opérationnels
2. **Traefik** en cours d'exécution sur le réseau `traefik-public`
3. **Fichiers d'environnement** configurés (`.env.production` et `.env.staging`)
4. **Accès SSH** avec les permissions appropriées
5. **Backup** de la base de données actuelle (CRITIQUE)

### Vérifications Préalables

```bash
# Vérifier Docker
docker --version
docker compose version

# Vérifier Traefik
docker ps | grep traefik

# Vérifier le réseau Traefik
docker network ls | grep traefik-public
```

---

## Préparation des Fichiers d'Environnement

### 1. Créer `.env.production`

```bash
# Sur le serveur VPS
cd /opt/recyclic  # Ou le chemin de votre projet

# Copier le template
cp .env.production.template .env.production

# Éditer avec les vraies valeurs
nano .env.production
```

**Variables CRITIQUES à configurer :**
- `POSTGRES_PASSWORD` : Mot de passe fort et unique
- `SECRET_KEY` : Clé secrète pour JWT (longue et aléatoire)
- `TELEGRAM_BOT_TOKEN` : Token du bot de production
- `BREVO_API_KEY` : Clé API Brevo pour les emails
- `CASH_SESSION_REPORT_RECIPIENT` : Email de l'équipe finance

### 2. Créer `.env.staging`

```bash
# Copier le template
cp .env.staging.template .env.staging

# Éditer avec les valeurs de staging
nano .env.staging
```

---

## Procédure de Déploiement SÉCURISÉE

### ⚠️ AVERTISSEMENT CRITIQUE

**Cette procédure modifie la production. Suivez chaque étape exactement.**

### Phase 0 : Pré-Validation (OBLIGATOIRE)

```bash
# 1. Exécuter le script de validation pré-déploiement
bash scripts/pre-deployment-check.sh prod

# ⚠️ ARRÊTER ICI si le script retourne des erreurs
# Corriger tous les problèmes avant de continuer

# 2. Vérifier que tous les checks sont passés
# Attendu: "✅ Deployment validation PASSED"
```

### Phase 1 : Backup (CRITIQUE)

```bash
# 1. Créer un backup automatisé avec vérification
bash scripts/backup-database.sh prod

# 2. Vérifier que le backup a réussi
ls -lh backups/recyclic_prod_*.sql.gz

# 3. Backup manuel des fichiers de configuration
cp .env.production .env.production.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup

# 4. Tester la restauration du backup (sur staging si possible)
# bash scripts/backup-database.sh staging
# gunzip -c backups/recyclic_prod_YYYYMMDD_HHMMSS.sql.gz | \
#   docker compose -p recyclic-staging -f docker-compose.staging.yml exec -T postgres \
#   psql -U recyclic -d recyclic
```

### Phase 2 : Arrêt de l'Ancienne Stack de Production

```bash
# 1. Arrêter l'ancienne stack avec profile
docker compose --profile prod down --remove-orphans

# 2. Vérifier qu'aucun conteneur n'est en cours d'exécution
docker ps | grep recyclic
# Cette commande ne doit rien retourner

# 3. Lister les volumes existants (pour information)
docker volume ls | grep recyclic
```

### Phase 3 : Déploiement de la Nouvelle Stack de Production

```bash
# 1. Pull des dernières modifications (si depuis Git)
git pull origin main

# 2. Construire et démarrer la stack de production
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d --build

# 3. Surveiller les logs pendant le démarrage
docker compose -p recyclic-prod -f docker-compose.prod.yml logs -f

# Attendre que tous les services soient "healthy"
# Vous devriez voir :
# - postgres healthy
# - redis healthy
# - api healthy
# - bot healthy
```

### Phase 4 : Vérification de Production

```bash
# 1. Vérifier l'état des conteneurs
docker compose -p recyclic-prod -f docker-compose.prod.yml ps

# 2. Attendre que tous les healthchecks passent (jusqu'à 2 minutes)
# Surveiller jusqu'à ce que tous les services soient "healthy"
watch -n 5 'docker compose -p recyclic-prod -f docker-compose.prod.yml ps'

# 3. Exécuter le script de validation Traefik
bash scripts/validate-traefik.sh prod

# 4. Tester les endpoints manuellement
curl https://recyclic.jarvos.eu/api/health
curl -I https://recyclic.jarvos.eu

# 5. Vérifier les logs pour erreurs critiques
docker compose -p recyclic-prod -f docker-compose.prod.yml logs api | grep -i error
docker compose -p recyclic-prod -f docker-compose.prod.yml logs bot | grep -i error
docker compose -p recyclic-prod -f docker-compose.prod.yml logs frontend | grep -i error
```

### Phase 5 : Déploiement de Staging

```bash
# 1. Démarrer la stack de staging (APRÈS production)
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d --build

# 2. Surveiller les logs
docker compose -p recyclic-staging -f docker-compose.staging.yml logs -f

# 3. Vérifier l'état
docker compose -p recyclic-staging -f docker-compose.staging.yml ps

# 4. Tester le endpoint de santé
curl https://devrecyclic.jarvos.eu/api/health
```

---

## Outils de Validation et Scripts

### Script de Pré-Déploiement

**Fichier:** `scripts/pre-deployment-check.sh`

Effectue une validation complète avant le déploiement :
- Configuration Docker Compose
- Fichiers d'environnement
- Docker daemon
- Réseau Traefik
- Espace disque
- Conteneurs existants
- Volumes de données
- DNS
- Backups récents
- Disponibilité des ports

```bash
# Production
bash scripts/pre-deployment-check.sh prod

# Staging
bash scripts/pre-deployment-check.sh staging
```

### Script de Backup Automatisé

**Fichier:** `scripts/backup-database.sh`

Crée un backup vérifié de la base de données :
- Vérification du conteneur PostgreSQL
- Healthcheck
- Export pg_dump
- Vérification du contenu
- Calcul de checksum (SHA256)
- Compression automatique
- Nettoyage des backups > 7 jours

```bash
# Production
bash scripts/backup-database.sh prod

# Staging
bash scripts/backup-database.sh staging
```

### Script de Validation Traefik

**Fichier:** `scripts/validate-traefik.sh`

Valide la configuration Traefik et le routing :
- Conteneurs en cours d'exécution
- Réseau traefik-public
- Connexions réseau
- Labels Traefik (enable, routers, rules)
- Healthchecks des services
- Test des endpoints (API et Frontend)

```bash
# Production
bash scripts/validate-traefik.sh prod

# Staging
bash scripts/validate-traefik.sh staging
```

---

## Gestion au Quotidien

### Démarrer les Services

```bash
# Production
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d

# Staging
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d

# Dev (local)
docker compose --profile dev up -d
```

### Arrêter les Services

```bash
# Production
docker compose -p recyclic-prod -f docker-compose.prod.yml down

# Staging
docker compose -p recyclic-staging -f docker-compose.staging.yml down

# Dev (local)
docker compose --profile dev down
```

### Redémarrer un Service Spécifique

```bash
# Production - API seulement
docker compose -p recyclic-prod -f docker-compose.prod.yml restart api

# Staging - Frontend seulement
docker compose -p recyclic-staging -f docker-compose.staging.yml restart frontend
```

### Voir les Logs

```bash
# Production - Tous les services
docker compose -p recyclic-prod -f docker-compose.prod.yml logs -f

# Production - API seulement
docker compose -p recyclic-prod -f docker-compose.prod.yml logs -f api

# Staging - Dernières 100 lignes
docker compose -p recyclic-staging -f docker-compose.staging.yml logs --tail=100
```

### Rebuild et Mise à Jour

```bash
# Production - Pull Git + Rebuild + Restart
cd /opt/recyclic
git pull origin main
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d --build

# Staging - Rebuild sans pull
docker compose -p recyclic-staging -f docker-compose.staging.yml up -d --build
```

---

## Gestion des Migrations Alembic

### Production

```bash
# Appliquer les migrations
docker compose -p recyclic-prod -f docker-compose.prod.yml run --rm api-migrations alembic upgrade head

# Vérifier la version actuelle
docker compose -p recyclic-prod -f docker-compose.prod.yml run --rm api-migrations alembic current
```

### Staging

```bash
# Appliquer les migrations
docker compose -p recyclic-staging -f docker-compose.staging.yml run --rm api-migrations alembic upgrade head

# Vérifier la version actuelle
docker compose -p recyclic-staging -f docker-compose.staging.yml run --rm api-migrations alembic current
```

---

## Debugging et Diagnostics

### Vérifier l'Isolation

```bash
# Lister tous les conteneurs Recyclic
docker ps -a | grep recyclic

# Lister tous les volumes
docker volume ls | grep recyclic

# Lister tous les réseaux
docker network ls | grep recyclic
```

### Accéder à un Conteneur

```bash
# Production - Shell dans l'API
docker compose -p recyclic-prod -f docker-compose.prod.yml exec api bash

# Staging - Shell dans PostgreSQL
docker compose -p recyclic-staging -f docker-compose.staging.yml exec postgres psql -U recyclic
```

### Inspecter la Configuration

```bash
# Production - Voir la configuration résolue
docker compose -p recyclic-prod -f docker-compose.prod.yml config

# Staging - Voir la configuration résolue
docker compose -p recyclic-staging -f docker-compose.staging.yml config
```

---

## Résolution de Problèmes Courants

### Problème : "network traefik-public not found"

```bash
# Créer le réseau Traefik manuellement
docker network create traefik-public
```

### Problème : Port Conflict

```bash
# Vérifier si les ports sont déjà utilisés
docker ps -a | grep "0.0.0.0:80\|0.0.0.0:443"

# Arrêter les services en conflit
docker compose -p recyclic-prod -f docker-compose.prod.yml down
```

### Problème : Healthcheck Failed

```bash
# Vérifier les logs du service
docker compose -p recyclic-prod -f docker-compose.prod.yml logs api

# Vérifier manuellement le endpoint de santé
docker compose -p recyclic-prod -f docker-compose.prod.yml exec api curl -f http://localhost:8000/health
```

### Problème : Variables d'Environnement Manquantes

```bash
# Vérifier les variables chargées
docker compose -p recyclic-prod -f docker-compose.prod.yml exec api env | grep -E "DATABASE_URL|SECRET_KEY|ENVIRONMENT"

# Recharger le fichier .env
docker compose -p recyclic-prod -f docker-compose.prod.yml down
docker compose -p recyclic-prod -f docker-compose.prod.yml up -d
```

---

## Rollback en Cas de Problème

### Rollback Rapide

```bash
# 1. Arrêter la nouvelle stack
docker compose -p recyclic-prod -f docker-compose.prod.yml down

# 2. Restaurer l'ancienne configuration
cp docker-compose.yml.backup docker-compose.yml
cp .env.production.backup .env.production

# 3. Redémarrer avec l'ancienne méthode
docker compose --profile prod up -d

# 4. Restaurer la base de données si nécessaire
docker compose --profile prod exec -T postgres psql -U recyclic -d recyclic < backup_prod_YYYYMMDD_HHMMSS.sql
```

---

## Checklist de Validation Post-Déploiement

### Production

- [ ] Tous les conteneurs sont `Up` et `healthy`
- [ ] API accessible via `https://recyclic.jarvos.eu/api/health`
- [ ] Frontend accessible via `https://recyclic.jarvos.eu`
- [ ] Connexion utilisateur fonctionne
- [ ] Bot Telegram répond aux commandes
- [ ] Logs sans erreurs critiques
- [ ] Certificats SSL valides (Traefik)

### Staging

- [ ] Tous les conteneurs sont `Up` et `healthy`
- [ ] API accessible via `https://devrecyclic.jarvos.eu/api/health`
- [ ] Frontend accessible via `https://devrecyclic.jarvos.eu`
- [ ] Isolation totale avec production (volumes séparés)

---

## Support et Escalation

En cas de problème critique :

1. **Rollback immédiat** (voir section ci-dessus)
2. **Capture des logs** : `docker compose -p recyclic-prod -f docker-compose.prod.yml logs > incident_logs.txt`
3. **Notification** : Contacter l'équipe DevOps
4. **Documentation** : Logger l'incident dans le debug log du projet

---

## Notes Importantes

- ⚠️ **Ne jamais supprimer les volumes** sans backup confirmé
- ⚠️ **Toujours tester en staging** avant de déployer en production
- ⚠️ **Les stacks sont maintenant complètement indépendantes** - aucune ressource partagée
- ✅ **Les deux environnements peuvent tourner simultanément** sur le même serveur
- ✅ **Chaque environnement a sa propre base de données** (isolation totale)

---

**Fin du Guide de Déploiement**
