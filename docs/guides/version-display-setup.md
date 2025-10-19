# Guide de Configuration de l'Affichage de Version

## Vue d'ensemble

Le système d'affichage de version de Recyclic utilise une approche **basée sur des build args** injectés au build (COMMIT_SHA, BRANCH, COMMIT_DATE, BUILD_DATE). Les Dockerfiles génèrent `frontend/public/build-info.json` sans dépendre de git dans l'image.

## Architecture

### Configuration par Environnement

- **Développement** : `docker-compose.yml` + `frontend/Dockerfile.dev`
- **Staging** : `docker-compose.staging.yml` + `frontend/Dockerfile`
- **Production** : `docker-compose.prod.yml` + `frontend/Dockerfile`

### Fichiers de Build Info

Le système génère automatiquement un fichier `build-info.json` dans le répertoire `frontend/public/` avec les informations suivantes :

```json
{
  "version": "1.0.0",
  "commitSha": "8c55cc47",
  "commitDate": "2025-10-18 14:52:16 +0200",
  "buildDate": "2025-10-19T16:23:58Z",
  "branch": "main"
}
```

## Implémentation

### 1. Dockerfile Configuration

Les Dockerfiles acceptent des `ARG` et génèrent `build-info.json` via Node:

```dockerfile
# ARG passés par l'hôte/CI
ARG COMMIT_SHA=unknown
ARG BRANCH=unknown
ARG COMMIT_DATE=unknown
ARG BUILD_DATE=unknown

# Génération sans git dans l'image
RUN mkdir -p public \
  && node -e "const fs=require('fs');const pkg=require('./package.json');const data={version:pkg.version,commitSha:process.env.COMMIT_SHA||'unknown',commitDate:process.env.COMMIT_DATE||'unknown',buildDate:process.env.BUILD_DATE||'unknown',branch:process.env.BRANCH||'unknown'};fs.writeFileSync('public/build-info.json',JSON.stringify(data,null,2)+'\\n')"
```

### 2. Service Frontend

Le service `frontend/src/services/buildInfo.js` charge les informations de build :

```javascript
export const getBuildInfo = async () => {
  // Charge build-info.json depuis /build-info.json
  // Fallback vers les variables d'environnement si nécessaire
};

export const getVersionDisplay = async () => {
  // Retourne "Version: 1.0.0 (8c55cc47)" ou "Version: 1.0.0"
};
```

### 3. Composant AdminLayout

Le composant `AdminLayout.jsx` utilise le service pour afficher la version :

```javascript
const [versionDisplay, setVersionDisplay] = useState('Version: 1.0.0');

useEffect(() => {
  getVersionDisplay().then(setVersionDisplay);
}, []);
```

## Avantages de cette Solution

### ✅ **Automatique**
- Pas besoin de configuration manuelle
- Se met à jour automatiquement à chaque build
- Fonctionne dans tous les environnements

### ✅ **Robuste**
- Fallback vers les variables d'environnement si le fichier n'est pas disponible
- Gestion d'erreur gracieuse
- Pas de dépendance externe

### ✅ **Performant**
- Fichier statique servi directement par Vite
- Cache côté client
- Pas de requête API supplémentaire

### ✅ **Maintenable**
- Solution centralisée dans les Dockerfiles
- Pas de scripts externes à maintenir
- Compatible avec tous les environnements

## Utilisation

### Développement
Attention: en dev, `docker-compose.yml` monte `./frontend/public:/app/public`. Cela fait foi côté conteneur.

- Option A (auto via image): retirer ce volume pour que l’image serve son `build-info.json` généré par les ARG.
- Option B (garder le volume): régénérer `frontend/public/build-info.json` côté host ou utiliser les build args.

Cheat sheet (dev):
```bash
# 1) Exporter les build args côté host (dev/CI)
source ./scripts/generate-build-args.sh

# 2) Build + run frontend
docker-compose build frontend
docker-compose up -d frontend

# (Si le volume public est conservé) Générer le fichier côté host
./scripts/generate-build-info.sh
docker-compose up -d frontend
```

### Staging/Production
```bash
# Exporter les build args (ou variables CI)
source ./scripts/generate-build-args.sh

# Build & run
docker-compose -f docker-compose.staging.yml build frontend
docker-compose -f docker-compose.staging.yml up -d frontend
```

## Affichage

L'interface d'administration affiche maintenant :
- **Version: 1.0.0 (8c55cc47)** - avec commit SHA
- **Version: 1.0.0** - sans commit SHA si non disponible

## Dépannage

### Le commit SHA ne s'affiche pas
1. En dev, vérifier le volume `./frontend/public:/app/public` (le fichier host fait foi)
2. Vérifier que les build args (`COMMIT_SHA`, `BRANCH`, `COMMIT_DATE`, `BUILD_DATE`) sont bien exportés
3. En cas de doute, régénérer côté host: `./scripts/generate-build-info.sh`

### Le fichier build-info.json n'est pas accessible
1. Vérifier que le fichier est dans `frontend/public/`
2. Vérifier que Vite sert les fichiers statiques
3. Vérifier les logs du conteneur frontend

## État de l'art

Cette solution suit les **meilleures pratiques** de l'industrie :

1. **Build-time injection** - Les informations sont injectées au moment du build
2. **Fichiers statiques** - Utilisation de fichiers JSON statiques
3. **Fallback gracieux** - Gestion d'erreur avec fallback
4. **Multi-environnement** - Compatible avec dev/staging/prod
5. **Performance** - Pas de requête API supplémentaire

Cette approche est utilisée par de nombreuses applications modernes et est recommandée pour les projets React/Vite.