# Guide de Configuration - Affichage de Version Automatique

## Vue d'ensemble

Ce guide explique la solution **100% automatique** pour l'affichage de la version et du commit SHA dans l'interface d'administration de Recyclic.

## Architecture

L'affichage de version utilise un fichier `build-info.json` généré automatiquement qui contient :
- Version de l'application (depuis `package.json`)
- Commit SHA (court)
- Branche Git
- Date de commit
- Date de build

## Solution Automatique Complète

### 🏠 **Local (Développement) - 100% Automatique**

**Aucune commande manuelle nécessaire !**

1. **Hooks Git** : Mise à jour automatique du `.env` à chaque action Git
   - `post-commit` : Après chaque commit
   - `post-checkout` : Après chaque changement de branche
   - `post-merge` : Après chaque merge

2. **Workflow** : 
   ```bash
   git commit -m "message"  # Le hook met à jour .env automatiquement
   docker-compose up -d frontend  # C'est tout !
   ```

### 🌐 **VPS Staging - Une Commande**

```bash
# Sur le VPS staging
./scripts/deploy-staging.sh
```

**Ce script fait tout automatiquement :**
- Récupère les dernières modifications Git
- Génère les variables COMMIT_*
- Build et déploie le frontend
- Vérifie le déploiement

### 🚀 **VPS Production - Une Commande**

```bash
# Sur le VPS production
./scripts/deploy-prod.sh
```

**Ce script fait tout automatiquement :**
- Récupère les dernières modifications Git
- Génère les variables COMMIT_*
- Build et déploie le frontend
- Vérifie le déploiement

## Fichiers Impliqués

### Scripts de Déploiement
- `scripts/deploy-staging.sh` : Déploiement staging VPS
- `scripts/deploy-prod.sh` : Déploiement production VPS
- `scripts/generate-build-args.sh` : Génération des variables Git

### Hooks Git (Local)
- `.git/hooks/post-commit` : Mise à jour .env après commit
- `.git/hooks/post-checkout` : Mise à jour .env après checkout
- `.git/hooks/post-merge` : Mise à jour .env après merge

### Configuration Docker
- `frontend/scripts/generate-build-info.sh` : Génération du JSON dans l'image
- `frontend/Dockerfile.dev` : Dockerfile de développement
- `frontend/Dockerfile` : Dockerfile de production
- `docker-compose.yml` : Configuration locale
- `docker-compose.staging.yml` : Configuration staging
- `docker-compose.prod.yml` : Configuration production

## Vérification

### Local
```bash
# Vérifier que .env contient les bonnes valeurs
grep -E '^(COMMIT_SHA|BRANCH)=' .env

# Tester l'API
curl -s http://localhost:4444/build-info.json | jq .
```

### VPS
```bash
# Les scripts affichent automatiquement les informations
./scripts/deploy-staging.sh
./scripts/deploy-prod.sh
```

## Avantages de cette Solution

✅ **Local** : 0 commande manuelle - tout est automatique via les hooks Git  
✅ **Staging** : 1 commande - `./scripts/deploy-staging.sh`  
✅ **Production** : 1 commande - `./scripts/deploy-prod.sh`  
✅ **Cohérence** : Même version/commit partout  
✅ **Sécurité** : Ne touche jamais aux fichiers `.env.staging`/`.env.production`  
✅ **Simplicité** : Impossible d'oublier - c'est automatique  

## Dépannage

### Problème : Version "unknown"
- Vérifier que les scripts sont exécutables : `chmod +x scripts/*.sh`
- Vérifier que les hooks Git sont exécutables : `chmod +x .git/hooks/*`
- Vérifier que Git est accessible dans le contexte Docker

### Problème : Hooks ne s'exécutent pas
- Vérifier les permissions : `ls -la .git/hooks/`
- Tester manuellement : `./.git/hooks/post-commit`

## Cheat Sheet Final

### 🏠 Local (Développement)
```bash
# Workflow normal - tout est automatique
git add .
git commit -m "message"  # Hook met à jour .env
docker-compose up -d frontend  # C'est tout !
```

### 🌐 Staging VPS
```bash
# Une seule commande
./scripts/deploy-staging.sh
```

### 🚀 Production VPS
```bash
# Une seule commande
./scripts/deploy-prod.sh
```

**Résultat** : Version et commit SHA toujours à jour, partout, automatiquement ! 🎉