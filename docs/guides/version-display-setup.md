# Guide de Configuration de l'Affichage de Version

## Vue d'ensemble

Le système d'affichage de version de Recyclic utilise une approche **intégrée dans les Dockerfiles** : le commit SHA est récupéré automatiquement via la commande `git rev-parse --short HEAD` pendant le build de l'image Docker.

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

Les Dockerfiles génèrent automatiquement le fichier `build-info.json` :

```dockerfile
# Générer les informations de build directement
RUN VERSION=$(node -p "require('./package.json').version") && \
    COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") && \
    COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "unknown") && \
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") && \
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown") && \
    mkdir -p public && \
    cat > public/build-info.json << EOF
{
  "version": "$VERSION",
  "commitSha": "$COMMIT_SHA",
  "commitDate": "$COMMIT_DATE",
  "buildDate": "$BUILD_DATE",
  "branch": "$BRANCH"
}
EOF
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
```bash
# Le fichier build-info.json est généré automatiquement
docker-compose build frontend
docker-compose up -d frontend
```

### Staging/Production
```bash
# Même processus pour les autres environnements
docker-compose -f docker-compose.staging.yml build frontend
docker-compose -f docker-compose.staging.yml up -d frontend
```

## Affichage

L'interface d'administration affiche maintenant :
- **Version: 1.0.0 (8c55cc47)** - avec commit SHA
- **Version: 1.0.0** - sans commit SHA si non disponible

## Dépannage

### Le commit SHA ne s'affiche pas
1. Vérifier que git est installé dans l'image Docker
2. Vérifier que le répertoire est un dépôt git
3. Vérifier l'accès au fichier `/build-info.json`

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