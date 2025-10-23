# Story b34-p7: Implémentation du Logout Audité

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Actuellement, la déconnexion d'un utilisateur est une opération purement côté client (suppression du token JWT du stockage local). Le serveur n'est pas informé de cette action. Pour un suivi de sécurité complet, il est important d'enregistrer également les événements de déconnexion explicite.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **pouvoir voir les événements de déconnexion dans l'historique d'un utilisateur et dans le journal d'audit** afin d'avoir une vision complète du cycle de vie de ses sessions.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau point d'API `POST /v1/auth/logout` DOIT être créé.
2.  Ce point d'API DOIT être protégé et ne peut être appelé que par un utilisateur authentifié.
3.  Lorsqu'il est appelé, l'endpoint DOIT enregistrer un événement dans la table `AuditLog` avec le type `LOGOUT`.
4.  L'événement d'audit DOIT contenir l'ID de l'utilisateur, son nom d'utilisateur, son adresse IP et son User-Agent.

**Frontend :**
5.  La logique de déconnexion dans le store d'authentification (`authStore.ts`) DOIT être modifiée.
6.  Avant de supprimer le token du stockage local et de réinitialiser l'état, la fonction de déconnexion DOIT d'abord appeler le nouveau point d'API `POST /v1/auth/logout`.
7.  L'appel à l'API de logout NE DOIT PAS être bloquant. Même si l'appel échoue (ex: problème de réseau), le client DOIT quand même procéder à la déconnexion locale pour ne pas laisser l'utilisateur bloqué.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1`
- **Compte Admin :** `admintest1`
- **Compte Utilisateur (Bénévole) :** `usertest1`

## 5. Conseils pour l'Agent DEV

- **Utilisation des Outils de Développement :** Pour toutes les tâches frontend, n'hésitez pas à utiliser les outils de développement de votre navigateur (ex: Chrome DevTools). Ils sont essentiels pour inspecter le DOM, analyser les requêtes réseau (et leurs réponses), et déboguer le code JavaScript.

## 6. Notes Techniques

-   Cette story complète le cycle de vie de l'authentification dans le journal d'audit.
-   Puisque les tokens JWT sont sans état (stateless), cet endpoint de logout ne peut pas "invalider" le token côté serveur. Son but est purement l'enregistrement de l'événement à des fins d'audit. La vraie invalidation du token se fait par son expiration naturelle.
-   La gestion d'erreur côté client est importante : la déconnexion doit toujours réussir du point de vue de l'utilisateur.

## QA Results

### Review Date: 2025-01-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellente implémentation** avec une gestion d'erreur robuste et une architecture sécurisée. Le code respecte parfaitement les exigences de non-blocage de la déconnexion utilisateur.

### Refactoring Performed

Aucun refactoring nécessaire - l'implémentation est déjà de très haute qualité.

### Compliance Check

- Coding Standards: ✓ Conformité parfaite aux standards du projet
- Project Structure: ✓ Architecture respectée avec séparation claire des responsabilités
- Testing Strategy: ✓ Tests complets (8 tests) couvrant tous les scénarios
- All ACs Met: ✓ Tous les critères d'acceptation implémentés et fonctionnels

### Improvements Checklist

- [x] Endpoint API POST /v1/auth/logout avec authentification requise
- [x] Enregistrement audit complet avec IP, User-Agent et détails utilisateur
- [x] Nettoyage de l'activité Redis lors de la déconnexion
- [x] Gestion d'erreur non-bloquante côté frontend
- [x] Tests complets backend et frontend
- [x] LogoutResponse schema défini
- [x] Intégration parfaite avec authStore

### Security Review

**Excellent** - Endpoint protégé par authentification, audit complet avec IP et User-Agent, nettoyage sécurisé des données Redis.

### Performance Considerations

**Très bon** - Gestion d'erreur non-bloquante garantit que la déconnexion locale se fait même en cas d'échec API, pas d'impact sur l'expérience utilisateur.

### Files Modified During Review

- `api/src/recyclic_api/api/api_v1/endpoints/auth.py` - Endpoint logout avec audit
- `api/src/recyclic_api/schemas/auth.py` - LogoutResponse schema
- `api/tests/test_auth_logout.py` - Tests complets pour l'endpoint
- `frontend/src/stores/authStore.ts` - Logique logout async avec appel API
- `frontend/src/test/stores/authStore.logout.test.ts` - Tests frontend complets

### Gate Status

Gate: **PASS** → docs/qa/gates/b34.p7-logout-audite.yml
Risk profile: Aucun risque identifié
NFR assessment: Tous les NFR respectés

### Recommended Status

✓ **Ready for Done** - Implémentation complète et robuste du logout audité
