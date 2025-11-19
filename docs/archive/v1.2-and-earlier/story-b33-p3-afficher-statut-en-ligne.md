# Story b33-p3: Afficher le Statut "En Ligne" (Rework)

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Dans le cadre de la gestion des utilisateurs, il est utile pour un administrateur de savoir non seulement qui a un compte, mais aussi qui est actif récemment sur la plateforme. L'implémentation initiale ne met à jour ce statut qu'au login, mais pas pendant l'utilisation de l'application.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir un indicateur de statut "En ligne" qui reflète l'activité continue** de l'utilisateur, afin de savoir s'il est réellement en train d'utiliser l'application.

## 3. Critères d'acceptation

1.  Un nouvel point d'API DOIT être créé (ex: `GET /v1/admin/users/statuses`).
2.  Ce point d'API DOIT retourner une liste d'utilisateurs avec leur ID et leur **dernière date d'activité**, extraite d'une nouvelle source (voir AC #8).
3.  Le service frontend (`adminService.ts` ou un nouveau service) DOIT appeler ce nouveau point d'API lors du chargement de la page de gestion des utilisateurs.
4.  Dans le composant `UserListTable.tsx` (ou équivalent), une nouvelle colonne "Statut" ou un indicateur visuel (ex: un point de couleur) DOIT être ajouté.
5.  Un utilisateur DOIT être considéré comme "En ligne" (ex: point vert) si sa dernière activité date de moins de X minutes, où X est la valeur définie par le nouveau paramètre (voir AC #9).
6.  Un utilisateur DOIT être considéré comme "Inactif" (ex: point gris) s'il n'a pas été actif récemment.
7.  L'indicateur de statut DOIT se mettre à jour périodiquement (ex: toutes les minutes) ou lors du rechargement de la liste des utilisateurs.
8.  **[NOUVEAU]** Un mécanisme DOIT être mis en place pour enregistrer l'activité de l'utilisateur. La solution la plus simple est d'utiliser **Redis** pour stocker un timestamp `last_activity` pour chaque `user_id` à chaque appel API authentifié. Le point d'API de l'AC #2 devra lire ces données depuis Redis en plus de la table `login_history`.
9.  **[NOUVEAU]** Le seuil d'activité (15 minutes par défaut) DOIT être configurable. Un nouveau champ "Seuil d'activité 'En ligne' (minutes)" doit être ajouté à la page `/admin/settings` pour permettre aux administrateurs de modifier cette valeur.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (Pour accéder à la page `/admin/users` où la fonctionnalité sera visible)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Pour le backend, une requête SQL optimisée sera nécessaire pour éviter de scanner toute la table `login_history` à chaque fois. Pensez à utiliser `GROUP BY user_id` et des index. Pour le frontend, une stratégie de polling (ex: `setInterval`) est adaptée pour rafraîchir les statuts.

## 6. Notes Techniques

-   La performance est à surveiller. Le point d'API backend doit être optimisé pour requêter efficacement la table `login_history` (un `GROUP BY user_id` avec `MAX(created_at)` est une approche probable).
-   Côté frontend, il faut éviter de surcharger le backend avec des appels trop fréquents. Une stratégie de polling avec un intervalle raisonnable (ex: 60 secondes) est une bonne approche.
-   L'indicateur visuel doit être simple et accompagné d'une infobulle (`tooltip`) pour expliquer sa signification (ex: "En ligne - Actif il y a moins de 15 minutes").

## QA Results

### Review Date: 2025-01-20

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**EXCELLENT** - The implementation demonstrates high-quality, production-ready code with comprehensive test coverage and proper architecture patterns. All acceptance criteria have been fully implemented with attention to performance, security, and user experience.

### Refactoring Performed

No refactoring was necessary. The implementation follows best practices and coding standards.

### Compliance Check

- Coding Standards: ✓ Excellent adherence to project standards
- Project Structure: ✓ Proper separation of concerns (API, services, components, stores)
- Testing Strategy: ✓ Comprehensive test coverage at all levels
- All ACs Met: ✓ All 7 acceptance criteria fully implemented

### Improvements Checklist

- [x] Backend API endpoint `/v1/admin/users/statuses` implemented with optimized SQL queries
- [x] Frontend service integration with proper error handling
- [x] UserListTable component with online status column and tooltips
- [x] Polling mechanism (60-second intervals) for real-time updates
- [x] Comprehensive test coverage (unit, integration, component tests)
- [x] Proper TypeScript interfaces and type safety
- [x] Performance optimizations (GROUP BY queries, rate limiting)
- [x] Accessibility features (tooltips, ARIA labels, keyboard navigation)

### Security Review

**PASS** - Security implementation is solid:
- Admin-only access with proper authentication/authorization
- Rate limiting (30/minute) on sensitive endpoints
- Input validation and error handling
- No sensitive data exposure in API responses
- Proper logging of admin access attempts

### Performance Considerations

**EXCELLENT** - Performance optimizations implemented:
- Optimized SQL query using GROUP BY with MAX() to avoid full table scans
- Efficient polling strategy (60-second intervals)
- Proper indexing on login_history table (user_id, success, created_at)
- Rate limiting to prevent API abuse
- Minimal data transfer with focused response schemas

### Files Modified During Review

No files were modified during this review. The implementation is complete and production-ready.

### Gate Status

Gate: **PASS** → qa.qaLocation/gates/b33.p3-afficher-statut-en-ligne.yml
Risk profile: qa.qaLocation/assessments/b33.p3-risk-20250120.md
NFR assessment: qa.qaLocation/assessments/b33.p3-nfr-20250120.md

### Recommended Status

**✓ Ready for Done** - All acceptance criteria met, comprehensive test coverage, excellent code quality, and proper performance optimizations. The feature is production-ready.

## 7. Documentation des Problèmes et Échecs (2025-10-22)

### Problème Principal Identifié
**Le système de déconnexion ne fonctionne pas correctement** - Les utilisateurs restent marqués comme "en ligne" même après déconnexion.

### Tentatives de Résolution

#### 1. **Middleware d'Activité Redis (ÉCHEC)**
- **Objectif** : Créer un middleware pour enregistrer l'activité dans Redis à chaque requête authentifiée
- **Implémentation** : `ActivityTrackerMiddleware` avec décodage JWT manuel
- **Problèmes rencontrés** :
  - Erreur `No module named 'jwt'` - le module `python-jose` n'était pas compatible
  - Erreur `anyio.WouldBlock` - problème d'asynchrone dans le middleware
  - Le middleware bloquait les requêtes API
- **Résultat** : Middleware désactivé car trop problématique

#### 2. **Modification de l'Endpoint Logout (ÉCHEC)**
- **Objectif** : Supprimer l'activité Redis lors de la déconnexion
- **Implémentation** : Ajout de `redis_client.delete(activity_key)` dans `/v1/auth/logout`
- **Problèmes rencontrés** :
  - L'activité Redis n'était pas enregistrée en premier lieu (middleware désactivé)
  - La suppression ne servait à rien sans enregistrement préalable
- **Résultat** : Inefficace car pas d'activité à supprimer

#### 3. **Enregistrement d'Activité dans l'Endpoint des Statuts (ÉCHEC)**
- **Objectif** : Enregistrer l'activité directement dans l'endpoint `/v1/admin/users/statuses`
- **Implémentation** : `redis_client.set(activity_key, current_time, ex=3600)` dans l'endpoint
- **Problèmes rencontrés** :
  - L'activité n'était enregistrée que lors de l'appel à l'endpoint des statuts
  - Pas d'activité enregistrée lors des autres actions utilisateur
  - Le système utilisait encore `login_history` comme fallback
- **Résultat** : Partiellement fonctionnel mais incomplet

#### 4. **Corrections d'Erreurs de Code (SUCCÈS PARTIEL)**
- **Problème** : Erreurs `NameError: name 'status' is not defined`
- **Solution** : Remplacement global de `status.HTTP_` par `http_status.HTTP_`
- **Résultat** : API fonctionnelle mais logique métier défaillante

### État Actuel du Système

#### Ce qui Fonctionne
- ✅ API `/v1/admin/users/statuses` répond sans erreur 500
- ✅ Interface frontend affiche les statuts (1 en ligne, 12 hors ligne)
- ✅ Connexion/déconnexion fonctionne dans l'interface
- ✅ Pas d'erreurs de syntaxe dans le code

#### Ce qui Ne Fonctionne Pas
- ❌ **Problème principal** : Les utilisateurs restent "en ligne" après déconnexion
- ❌ **Cause racine** : Aucun mécanisme fiable d'enregistrement d'activité en temps réel
- ❌ **Fallback défaillant** : Le système utilise `login_history` qui ne reflète pas les déconnexions
- ❌ **Redis inutilisé** : Pas d'enregistrement d'activité dans Redis

### Diagnostic Technique

#### Problème de Conception
Le système actuel repose sur `login_history` qui ne contient que les **connexions réussies**, pas les **déconnexions**. Un utilisateur reste donc "en ligne" tant que sa dernière connexion est récente, même s'il s'est déconnecté.

#### Solutions Tentées et Pourquoi Elles Ont Échoué
1. **Middleware Redis** : Trop complexe, problèmes d'asynchrone, incompatibilité de modules
2. **Endpoint de déconnexion** : Inutile sans enregistrement d'activité préalable
3. **Enregistrement ponctuel** : Insuffisant, pas de tracking continu

### Recommandations pour la Résolution

#### Solution 1 : Middleware Redis Simplifié
- Créer un middleware synchrone (pas asynchrone)
- Utiliser `redis-py` directement sans décodage JWT complexe
- Enregistrer seulement l'user_id extrait du token

#### Solution 2 : Endpoint d'Activité Dédié
- Créer un endpoint `/v1/activity/ping` appelé périodiquement par le frontend
- Enregistrer l'activité dans Redis à chaque appel
- Plus simple que le middleware

#### Solution 3 : Utilisation des Sessions
- Utiliser les sessions FastAPI pour tracker l'activité
- Plus simple que Redis mais moins performant

### Fichiers Modifiés (Problématiques)
- `api/src/recyclic_api/middleware/activity_tracker.py` - Middleware défaillant
- `api/src/recyclic_api/main.py` - Middleware désactivé
- `api/src/recyclic_api/api/api_v1/endpoints/admin.py` - Logique Redis incomplète
- `api/src/recyclic_api/api/api_v1/endpoints/auth.py` - Suppression Redis inefficace

### Conclusion
**La story n'est PAS terminée** malgré les apparences. Le système affiche des statuts mais ils ne reflètent pas la réalité. Une refonte complète du mécanisme d'activité est nécessaire.
