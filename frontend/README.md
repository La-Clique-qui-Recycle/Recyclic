# Frontend RecyClique

Interface web React pour la plateforme RecyClique - Gestion de recyclage intelligente.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

### Build de Production
```bash
npm run build
```

## 🔧 Génération de Code API

### Workflow de Génération Automatique

Ce projet utilise un système de génération automatique de code TypeScript à partir de la spécification OpenAPI du backend. Cela garantit la cohérence des types entre le frontend et le backend.

#### Commandes Disponibles

```bash
# Générer les types et l'API TypeScript
npm run codegen
```

#### Workflow de Développement

1. **Modification de l'API Backend** : Quand l'API backend est modifiée
2. **Génération du fichier OpenAPI** : Le backend génère automatiquement `../api/openapi.json`
3. **Génération du code Frontend** : Exécuter `npm run codegen`
4. **Utilisation des nouveaux types** : Les types et l'API sont automatiquement mis à jour

#### Structure des Fichiers Générés

```
src/generated/
├── types.ts      # Types TypeScript (interfaces, enums)
├── api.ts        # Client API avec méthodes typées
└── index.ts      # Point d'entrée pour les exports
```

#### Utilisation des Types Générés

```typescript
// Import des types
import { UserResponse, UserRole, UserStatus } from '../generated';

// Import de l'API
import { UsersApi } from '../generated';

// Utilisation
const users = await UsersApi.getUsers();
const user = await UsersApi.getUserById('123');
```

#### Avantages

- ✅ **Cohérence des types** : Les types frontend sont toujours synchronisés avec l'API
- ✅ **Réduction des erreurs** : Plus de duplication manuelle de code
- ✅ **Maintenance simplifiée** : Un seul endroit pour définir les contrats d'API
- ✅ **IntelliSense complet** : Autocomplétion et validation TypeScript

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:ui

# Tests avec couverture
npm run test:coverage

# Tests E2E avec Playwright
npx playwright test
```

## 📁 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── business/        # Composants métier
│   └── ui/             # Composants UI de base
├── pages/              # Pages de l'application
├── services/           # Services API et logique métier
├── stores/             # Stores Zustand pour la gestion d'état
├── hooks/              # Hooks React personnalisés
├── generated/          # Code généré automatiquement (ne pas modifier)
└── utils/              # Utilitaires et helpers
```

## 🔧 Configuration

### Variables d'Environnement

#### VITE_API_URL - Configuration de l'API Backend

La variable `VITE_API_URL` définit l'URL de base pour les appels API. **IMPORTANT** : Utilisez toujours un chemin relatif `/api` pour garantir la compatibilité entre les environnements.

**Configuration recommandée :**

```bash
# .env.development (développement local avec Docker Compose)
VITE_API_URL=/api

# .env.production (production avec Traefik)
VITE_API_URL=/api
```

**⚠️ Important :**
- **Ne jamais utiliser** d'URL absolue comme `http://api:8000` dans le frontend
- Le proxy Vite (développement) et Traefik (production) redirigent automatiquement `/api` vers le backend
- Les changements de variables d'environnement nécessitent un rebuild :

```bash
# Avec Docker Compose
docker compose down
docker compose up -d --build

# En local
npm run dev
```

#### Configuration du Proxy Vite

Le fichier `vite.config.js` configure automatiquement le proxy pour rediriger `/api` vers le backend :

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://api:8000',
      changeOrigin: true,
    }
  }
}
```

Cette configuration permet au frontend d'appeler `/api/v1/sites` qui sera automatiquement redirigé vers `http://api:8000/v1/sites` en développement.

### Scripts Disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run test` - Tests unitaires
- `npm run lint` - Linting ESLint
- `npm run codegen` - Génération de code API
- `npm run test:coverage` - Tests avec couverture

## 🚀 Déploiement

### Docker

```bash
# Build de l'image
docker build -t recyclique-frontend .

# Exécution
docker run -p 3000:3000 recyclique-frontend
```

### Docker Compose

Le frontend est inclus dans le `docker-compose.yml` principal du projet.

## 📚 Documentation Technique

- [Architecture du Projet](../../docs/architecture.md)
- [Standards de Code](../../docs/coding-standards.md)
- [Guide de Tests](../../docs/testing-strategy.md)

## 🤝 Contribution

1. Modifier l'API backend si nécessaire
2. Exécuter `npm run codegen` pour synchroniser les types
3. Développer les fonctionnalités frontend
4. Tester avec `npm test`
5. Créer une pull request

## 📝 Notes Importantes

- **Ne jamais modifier manuellement** les fichiers dans `src/generated/`
- **Toujours exécuter** `npm run codegen` après les modifications de l'API
- **Vérifier la compilation** avec `npm run build` avant de commiter
- **Maintenir la cohérence** entre les types générés et l'utilisation dans le code
