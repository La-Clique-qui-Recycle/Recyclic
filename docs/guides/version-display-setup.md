# Guide de Configuration - Affichage de Version Automatique

## Vue d'ensemble

Ce guide explique la solution **100% automatique** pour l'affichage de la version et du commit SHA dans l'interface d'administration de Recyclic.

## Architecture - Solution Endpoint /version

### Principe
- **Backend** : Expose un endpoint `/v1/health/version` avec les informations de build
- **Frontend** : Lit l'endpoint via proxy `/api/v1/health/version`
- **Build-time** : Les informations sont injectées dans l'image backend via `--build-arg`
- **Runtime** : Aucun fichier généré, aucune dépendance aux hooks Git

### Avantages
✅ **Automatique** : Fonctionne en local, staging, production  
✅ **Robuste** : Source unique de vérité (backend)  
✅ **Standard** : Approche recommandée par l'industrie  
✅ **Sans fichiers** : Aucun fichier généré à committer  
✅ **Sans hooks** : Pas de dépendance aux hooks Git locaux  
✅ **Sans .env** : Pas de modification des fichiers d'environnement  

## Implémentation

### 1. Backend - Endpoint /version

**Fichier** : `api/src/recyclic_api/api/api_v1/endpoints/health.py`

```python
@router.get("/version")
async def get_version():
    """Version endpoint - returns build information"""
    return {
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "commitSha": os.getenv("COMMIT_SHA", "unknown"),
        "branch": os.getenv("BRANCH", "unknown"),
        "commitDate": os.getenv("COMMIT_DATE", "unknown"),
        "buildDate": os.getenv("BUILD_DATE", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "development")
    }
```

### 2. Backend - Dockerfile avec Build Args

**Fichier** : `api/Dockerfile`

```dockerfile
# Build arguments for version information
ARG APP_VERSION=1.0.0
ARG COMMIT_SHA=unknown
ARG BRANCH=unknown
ARG COMMIT_DATE=unknown
ARG BUILD_DATE=unknown

# Set environment variables from build args
ENV APP_VERSION=$APP_VERSION
ENV COMMIT_SHA=$COMMIT_SHA
ENV BRANCH=$BRANCH
ENV COMMIT_DATE=$COMMIT_DATE
ENV BUILD_DATE=$BUILD_DATE
```

### 3. Docker Compose - Build Args

**Fichiers** : `docker-compose.yml`, `docker-compose.staging.yml`, `docker-compose.prod.yml`

```yaml
api:
  build:
    context: ./api
    args:
      APP_VERSION: ${APP_VERSION:-1.0.0}
      COMMIT_SHA: ${COMMIT_SHA:-unknown}
      BRANCH: ${BRANCH:-unknown}
      COMMIT_DATE: ${COMMIT_DATE:-unknown}
      BUILD_DATE: ${BUILD_DATE:-unknown}
```

### 4. Frontend - Service buildInfo.js

**Fichier** : `frontend/src/services/buildInfo.js`

```javascript
export const getBuildInfo = async () => {
  try {
    // Essayer d'abord l'endpoint /version de l'API
    const response = await fetch('/api/v1/health/version');
    const data = await response.json();
    return data;
  } catch (error) {
    // Fallback vers build-info.json si l'API n'est pas disponible
    // Fallback vers variables d'environnement en dernier recours
  }
};
```

## Utilisation

### Local (Développement)

```bash
# Générer les variables de build
export COMMIT_SHA=$(git rev-parse --short HEAD)
export BRANCH=$(git rev-parse --abbrev-ref HEAD)
export COMMIT_DATE=$(git log -1 --format=%ci)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Builder et démarrer
docker-compose build api
docker-compose up -d
```

### Staging VPS

```bash
# Sur le VPS staging
export COMMIT_SHA=$(git rev-parse --short HEAD)
export BRANCH=$(git rev-parse --abbrev-ref HEAD)
export COMMIT_DATE=$(git log -1 --format=%ci)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

docker-compose -f docker-compose.staging.yml build api
docker-compose -f docker-compose.staging.yml up -d
```

### Production VPS

```bash
# Sur le VPS production
export COMMIT_SHA=$(git rev-parse --short HEAD)
export BRANCH=$(git rev-parse --abbrev-ref HEAD)
export COMMIT_DATE=$(git log -1 --format=%ci)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml up -d
```

## Vérification

### Tester l'endpoint

```bash
# Local
curl http://localhost:8000/v1/health/version

# Via frontend (proxy)
curl http://localhost:4444/api/v1/health/version
```

### Résultat attendu

```json
{
  "version": "1.0.0",
  "commitSha": "8f0ef93b",
  "branch": "release/v1.0.1-stable-fixes",
  "commitDate": "2025-10-20 02:35:28 +0200",
  "buildDate": "2025-10-20T00:55:09Z",
  "environment": "development"
}
```

### Interface Admin

L'interface d'administration affiche maintenant :
- **Version: 1.0.0 (8f0ef93b)** - avec commit SHA
- **Version: 1.0.0** - sans commit SHA si non disponible

## Dépannage

### L'endpoint ne répond pas
1. Vérifier que l'API est démarrée : `docker-compose ps`
2. Vérifier les logs : `docker-compose logs api`
3. Tester directement : `curl http://localhost:8000/v1/health/version`

### Le frontend ne peut pas accéder à l'API
1. Vérifier le proxy Vite dans `vite.config.js`
2. Vérifier que les conteneurs sont sur le même réseau Docker
3. Tester via le proxy : `curl http://localhost:4444/api/v1/health/version`

### Les variables sont "unknown"
1. Vérifier que les build args sont passés dans docker-compose
2. Vérifier que les variables sont exportées avant le build
3. Rebuilder l'image : `docker-compose build --no-cache api`

## Avantages de cette Solution

### ✅ **Standards de l'Industrie**
- Endpoint `/version` standard pour les APIs
- Build-time injection des métadonnées
- Source unique de vérité (backend)

### ✅ **Simplicité**
- Aucun fichier généré à committer
- Aucun hook Git à maintenir
- Aucune modification des `.env`

### ✅ **Robustesse**
- Fallback gracieux si l'API n'est pas disponible
- Fonctionne en local, staging, production
- Pas de dépendance aux outils Git locaux

### ✅ **Maintenabilité**
- Code centralisé dans le backend
- Configuration simple dans Docker Compose
- Facile à déboguer et tester

## Comparaison avec les Anciennes Solutions

| Aspect | Ancienne (build-info.json) | Nouvelle (endpoint /version) |
|--------|----------------------------|------------------------------|
| **Fichiers générés** | ❌ Oui (build-info.json) | ✅ Non |
| **Hooks Git** | ❌ Requis | ✅ Non |
| **Modification .env** | ❌ Oui | ✅ Non |
| **Source unique** | ❌ Non | ✅ Oui (backend) |
| **Standard industrie** | ❌ Non | ✅ Oui |
| **Débogage** | ❌ Difficile | ✅ Facile |
| **Portabilité** | ❌ Dépend des hooks | ✅ 100% portable |

Cette solution respecte les meilleures pratiques de l'industrie et offre une expérience de développement optimale ! 🎉