# Guide du Processus de Release - Recyclic

**Auteur:** Équipe de Développement  
**Date:** 2025-01-27  
**Version:** 1.0  

## Vue d'Ensemble

Ce guide décrit le processus manuel et délibéré pour créer une nouvelle version de l'application Recyclic. Le versioning suit le standard **Semantic Versioning** (`MAJEUR.MINEUR.PATCH`).

## Architecture de Versioning

L'application utilise une **architecture centralisée** pour l'affichage de la version :

1. **Source unique** : `frontend/package.json` (version principale)
2. **Endpoint API** : `/v1/health/version` (expose la version via l'API)
3. **Frontend** : Consomme l'endpoint API pour afficher la version
4. **Synchronisation** : Script `rebuild-with-version.sh` synchronise automatiquement

### Avantages de cette Architecture

- ✅ **Source unique de vérité** : La version est définie dans `package.json`
- ✅ **Cohérence** : Même version affichée partout (local, staging, production)
- ✅ **Automatique** : Pas de manipulation manuelle des fichiers
- ✅ **Robuste** : Fallback en cas de problème avec l'API

## Principe du Versioning

- **MAJEUR** : Changements incompatibles avec l'API ou l'interface
- **MINEUR** : Nouvelles fonctionnalités compatibles avec les versions antérieures
- **PATCH** : Corrections de bugs compatibles avec les versions antérieures

## Processus de Release

### 1. Décider du Nouveau Numéro de Version

Avant de commencer, déterminez le type de changement :
- **Bug fix** → Incrémenter PATCH (ex: 1.0.0 → 1.0.1)
- **Nouvelle fonctionnalité** → Incrémenter MINEUR (ex: 1.0.0 → 1.1.0)
- **Changement majeur** → Incrémenter MAJEUR (ex: 1.0.0 → 2.0.0)

### 2. Mettre à Jour package.json

**Option A : Utiliser npm version (Recommandée)**
```bash
# Aller dans le répertoire frontend
cd frontend

# Incrémenter automatiquement la version
npm version patch    # 1.1.0 → 1.1.1 (corrections de bugs)
npm version minor    # 1.1.0 → 1.2.0 (nouvelles fonctionnalités)  
npm version major    # 1.1.0 → 2.0.0 (changements majeurs)

# Revenir au répertoire racine
cd ..
```

**Option B : Modification manuelle**
Modifiez le fichier `frontend/package.json` :

```json
{
  "name": "recyclic-frontend",
  "version": "1.1.0",  // ← Nouveau numéro de version
  "description": "Interface web pour la plateforme Recyclic",
  // ... reste du fichier
}
```

### 3. Rebuilder l'API avec la Nouvelle Version

```bash
# Rebuilder l'API pour qu'elle utilise la nouvelle version
./scripts/rebuild-with-version.sh
```

**Note :** Ce script automatise :
- La récupération de la version depuis `package.json`
- Le rebuild de l'image API avec la bonne version
- Le redémarrage de l'API
- Le test de l'endpoint `/version`

### 4. Créer un Commit de Version

```bash
# Ajouter les modifications
git add frontend/package.json

# Créer un commit dédié à la version
git commit -m "chore: bump version to 1.1.0

- Nouvelle fonctionnalité: [décrire brièvement]
- Corrections: [lister les bugs corrigés]
- Améliorations: [lister les améliorations]"
```

### 5. Créer un Tag Git

```bash
# Créer un tag annoté avec le numéro de version
git tag -a v1.1.0 -m "Release v1.1.0

Nouvelles fonctionnalités:
- [Fonctionnalité 1]
- [Fonctionnalité 2]

Corrections:
- [Bug 1]
- [Bug 2]

Améliorations:
- [Amélioration 1]
- [Amélioration 2]"
```

### 6. Pousser le Commit et le Tag

```bash
# Pousser le commit
git push origin main

# Pousser le tag
git push origin v1.1.0
```

### 7. Créer la Release sur GitHub

1. Aller sur la page GitHub du projet
2. Cliquer sur "Releases" dans la barre latérale
3. Cliquer sur "Create a new release"
4. Sélectionner le tag `v1.1.0` créé précédemment
5. Remplir le titre : "Release v1.1.0"
6. Remplir la description avec les changements détaillés
7. Cliquer sur "Publish release"

## Vérification Post-Release

### 1. Vérifier l'Affichage de Version

Après déploiement, vérifier que la version s'affiche correctement :

**Test de l'endpoint API :**
```bash
curl -s http://localhost:8000/v1/health/version
# Doit retourner : {"version":"1.1.0","commitSha":"...",...}
```

**Test de l'interface :**
- Se connecter à l'interface d'administration
- Vérifier que "Version: 1.1.0 (commit-sha)" apparaît dans le header

### 2. Tests de Régression

Exécuter les tests complets pour s'assurer qu'aucune régression n'a été introduite :

```bash
# Tests backend
docker-compose run --rm api-tests

# Tests frontend
cd frontend && npm run test:run
```

## Initialisation d'un Nouvel Environnement (Staging/Production)

Après un déploiement sur un environnement vierge, il est nécessaire de créer les données de base via l'interface d'administration plutôt que manuellement via SQL.

### Procédure d'Initialisation

1. **Créer le Premier Utilisateur Admin**
   - Se connecter avec les credentials de super-admin (configurés via variables d'environnement)
   - Ou utiliser le système d'inscription Telegram pour créer le premier compte, puis le promouvoir en admin via la base de données

2. **Créer le Premier Site via l'Interface Admin**
   - Se connecter à l'interface d'administration : `https://[domaine]/admin/sites`
   - Cliquer sur "Créer un nouveau site"
   - Remplir les informations obligatoires :
     - **Nom** : Nom du site (ex: "Ressourcerie Principale")
     - **Adresse** : Adresse complète
     - **Ville** : Ville
     - **Code postal** : Code postal
     - **Pays** : Pays (par défaut: France)
   - Cliquer sur "Créer"
   - **Vérification** : Le site doit apparaître dans la liste sans erreur 404 ou 500

3. **Créer le Premier Poste de Caisse**
   - Naviguer vers : `https://[domaine]/admin/cash-registers`
   - Cliquer sur "Créer un nouveau poste de caisse"
   - Remplir les informations :
     - **Nom** : Nom du poste (ex: "Caisse Entrée")
     - **Localisation** : Description de l'emplacement (optionnel)
     - **Site** : Sélectionner le site créé précédemment (obligatoire)
     - **Poste actif** : Cocher pour activer
   - Cliquer sur "Créer"
   - **Vérification** : Le poste doit apparaître dans la liste

### Validation de l'Initialisation

Après la création des données de base, vérifier que :

1. **Opérations CRUD fonctionnent sans erreur HTTP**
   - ✅ Pas d'erreur 404 (route non trouvée)
   - ✅ Pas d'erreur 405 (méthode non autorisée)
   - ✅ Pas d'erreur 500 (erreur serveur)

2. **Les Formulaires Valident Correctement**
   - ❌ Impossible de créer un poste de caisse sans sélectionner un site
   - ✅ Message d'erreur clair si un champ obligatoire est manquant

3. **Les Suppressions Respectent les Contraintes**
   - ❌ Impossible de supprimer un site ayant des postes de caisse (erreur 409)
   - ❌ Impossible de supprimer un poste ayant des sessions actives (erreur 409)
   - ✅ Messages d'erreur explicites affichés à l'utilisateur

### Logs à Surveiller

Vérifier les logs Docker/API pour s'assurer qu'aucune erreur n'apparaît :

```bash
# Vérifier les logs API
docker logs recyclic-api-1 --tail 100

# Rechercher les erreurs courantes (ne devrait rien retourner)
docker logs recyclic-api-1 2>&1 | grep "badly formed hexadecimal UUID"
docker logs recyclic-api-1 2>&1 | grep "InvalidTextRepresentation"
docker logs recyclic-api-1 2>&1 | grep "ROLLBACK"
```

Si des erreurs apparaissent, vérifier :
- La configuration des variables d'environnement
- Les chemins d'API dans le frontend (`/api/v1/.../` avec trailing slash)
- La validation côté formulaire (site_id obligatoire)

## Bonnes Pratiques

### Quand Créer une Release

- ✅ **Toujours** après la finalisation d'une story majeure
- ✅ **Toujours** après la correction d'un bug critique
- ✅ **Toujours** avant un déploiement en production
- ❌ **Jamais** pour des modifications de développement en cours

### Messages de Commit et Tag

- Utiliser des messages clairs et descriptifs
- Lister les changements principaux
- Mentionner les breaking changes s'il y en a
- Inclure les numéros de tickets/stories si applicable

### Gestion des Branches

- Créer une branche de release si nécessaire pour les versions majeures
- Tester la release sur un environnement de staging avant production
- Documenter les procédures de rollback si nécessaire

## Exemples de Messages de Release

### Version PATCH (1.0.0 → 1.0.1)
```
Release v1.0.1

Corrections:
- Correction du bug de calcul des totaux en caisse
- Résolution du problème d'affichage des catégories
- Amélioration de la gestion des erreurs de connexion
```

### Version MINEUR (1.0.0 → 1.1.0)
```
Release v1.1.0

Nouvelles fonctionnalités:
- Ajout du système de rapports par email
- Interface d'administration des utilisateurs
- Export des données en CSV

Corrections:
- Amélioration des performances de la base de données
- Correction des problèmes d'authentification
```

### Version MAJEUR (1.0.0 → 2.0.0)
```
Release v2.0.0

⚠️ BREAKING CHANGES:
- Nouvelle structure de l'API (voir migration guide)
- Changement du format des données utilisateur
- Mise à jour des dépendances majeures

Nouvelles fonctionnalités:
- Refonte complète de l'interface utilisateur
- Nouveau système de permissions
- Intégration avec les services externes
```

## Dépannage

### Problème : Tag déjà existant
```bash
# Supprimer le tag local
git tag -d v1.1.0

# Supprimer le tag distant
git push origin --delete v1.1.0

# Recréer le tag
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### Problème : Version non affichée
1. Vérifier que `package.json` a été modifié
2. Exécuter `./scripts/rebuild-with-version.sh` pour rebuilder l'API
3. Vérifier que l'endpoint `/api/v1/health/version` retourne la bonne version
4. Vérifier que le frontend peut accéder à l'API (proxy Vite configuré)

## Historique des Versions

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 1.0.0 | 2025-01-27 | Initial | Version initiale avec fonctionnalités de base |

---

**Note :** Ce processus est manuel et délibéré. Il ne doit être exécuté que pour des versions stables et significatives du code, jamais pour des modifications de développement en cours.

