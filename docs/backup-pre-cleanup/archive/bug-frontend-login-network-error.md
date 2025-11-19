---
story_id: bug.login-network-error
epic_id: auth-refactoring
title: "Bug: L'appel de login échoue avec une Network Error (ERR_CONNECTION_REFUSED)"
status: Done
priority: Critical
---

### Description du Bug

**Comportement Observé :**
Lors de la tentative de connexion depuis la nouvelle interface (Username/Password), l'appel à l'API échoue systématiquement avec une `Network Error` (`net::ERR_CONNECTION_REFUSED`).

**Cause Racine Identifiée :**
La console du navigateur montre que le frontend tente d'appeler une URL incorrecte où le chemin de l'API est dupliqué : `http://localhost:4433/api/v1/api/v1/auth/login`.

**Comportement Attendu :**
L'appel API devrait cibler l'URL correcte, sans duplication, par exemple `http://localhost:4433/api/v1/auth/login` (ou simplement `/api/v1/auth/login` si un proxy est utilisé).

### Contexte et Tentatives de Résolution

Nous avons déjà tenté plusieurs actions sans succès :
- Correction du `vite.config.js` pour utiliser `rewrite`.
- Correction du `Dockerfile` du frontend pour utiliser un build de production Nginx.
- Regénération du client API (`npm run codegen`).
- Reconstruction complète des images Docker sans cache (`docker-compose build --no-cache`).

Le problème persiste, ce qui suggère que l'URL de base de l'API est incorrectement configurée quelque part dans le code source généré ou dans la manière dont il est appelé.

### Critères d'Acceptation

1.  La cause de la duplication de l'URL est identifiée et corrigée dans le code source.
2.  L'appel à `POST /api/v1/auth/login` réussit (ou échoue avec une erreur 401 "Identifiants invalides", mais pas une `Network Error`).
3.  L'attribut `autocomplete="current-password"` est ajouté à l'input du mot de passe sur la page `Login.tsx` pour corriger l'avertissement du navigateur.

---

### Tasks / Subtasks

1.  **(AC: 1)** **Investiguer la configuration du client API :** ✅
    -   Analyser les fichiers dans `frontend/src/generated/`. ✅
    -   Vérifier comment l'URL de base (`basePath`) est définie et utilisée dans le client API généré (`api.ts` ou un fichier de configuration). ✅
    -   Identifier pourquoi cette configuration de base semble inclure `/api/v1` et l'ajoute à des appels qui contiennent déjà ce segment. ✅

2.  **(AC: 1)** **Corriger la source du problème :** ✅
    -   Appliquer la correction nécessaire. Cela pourrait impliquer de modifier la configuration de l'outil `openapi-typescript-codegen` (s'il est utilisé), ou de modifier manuellement un template de génération si le problème est plus profond. ✅

3.  **(AC: 3)** **Corriger l'avertissement `autocomplete` :** ✅
    -   Dans `frontend/src/pages/Login.tsx`, ajouter l'attribut `autoComplete="current-password"` à l'élément `<input>` du mot de passe. ✅

4.  **(AC: 2)** **Valider la correction :** ✅
    -   Reconstruire l'application (`docker-compose build frontend` et `docker-compose up -d`). ✅
    -   Tester la connexion et confirmer dans la console du navigateur que l'URL de l'appel est correcte et que l'erreur `ERR_CONNECTION_REFUSED` a disparu. ✅

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References
- N/A

### Completion Notes
- **Cause identifiée**: Quadruple problème dans la stack auth :
  1. Duplication d'URL : `API_BASE_URL` incluait `/api/v1` alors que les endpoints commencent aussi par `/api/v1`
  2. Problème Docker : Les variables d'environnement React ne sont pas disponibles au runtime en production
  3. Gestion d'erreur : Les erreurs API (422) causaient un crash React au lieu d'afficher un message d'erreur
  4. **Schéma d'authentification obsolète** : L'API utilisait une version cachée de LoginRequest qui demandait `telegram_id` au lieu de `username/password`
- **Solution appliquée**:
  1. **Proxy Nginx** : Configuration d'un proxy dans le container frontend qui redirige `/api/v1/` vers `http://api:8000/api/v1/`
  2. **API_BASE_URL simplifiée** : Utilisation d'URLs relatives `/api/v1` qui passent par le proxy Nginx
  3. **Endpoints corrigés** : Suppression du préfixe `/api/v1` des endpoints (ex: `/auth/login` au lieu de `/api/v1/auth/login`)
  4. **Gestion d'erreur améliorée** : Traitement correct des erreurs de validation 422 dans `authStore.ts`
  5. **Schéma d'authentification mis à jour** : Redémarrage des containers pour charger le nouveau schéma LoginRequest avec `username/password`
- **Corrections additionnelles**:
  - Ajout des attributs `autoComplete="username"` et `autoComplete="current-password"`
  - Configuration Nginx avec `nginx.conf` pour le proxy
- **Tests**:
  - Validation réussie avec `npm run test` - 5 tests passent pour Login.test.tsx
  - Test API via proxy : `curl http://localhost:4444/api/v1/auth/login` retourne 401 "Identifiants invalides" au lieu de 422 "Field required telegram_id"
  - Plus de crash React sur les erreurs d'authentification
  - **Login/logout fonctionnel** : Connexion et déconnexion avec username/password marchent parfaitement

### File List
- `frontend/src/generated/api.ts` (modifié - correction API_BASE_URL et endpoints)
- `frontend/src/pages/Login.tsx` (modifié - ajout autoComplete et gestion d'erreur)
- `frontend/src/stores/authStore.ts` (modifié - gestion d'erreur 422 améliorée)
- `frontend/nginx.conf` (nouveau - configuration proxy Nginx)
- `frontend/Dockerfile` (modifié - intégration nginx.conf)
- `docker-compose.yml` (modifié - build args pour variables d'environnement)

### Change Log
- **2025-09-17**: Correction du bug de duplication d'URL et amélioration UX du formulaire de connexion
- **2025-09-18**: Résolution finale du problème de schéma d'authentification - passage de telegram_id vers username/password

### Status
Done