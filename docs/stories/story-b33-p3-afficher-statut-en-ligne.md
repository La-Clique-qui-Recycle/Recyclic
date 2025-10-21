# Story b33-p3: Afficher le Statut "En Ligne"

**Statut:** Validé
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Dans le cadre de la gestion des utilisateurs, il est utile pour un administrateur de savoir non seulement qui a un compte, mais aussi qui est actif récemment sur la plateforme. Cela peut aider à la modération, au support, ou simplement à avoir une meilleure vision de l'utilisation de l'application.

L'investigation a montré que la base de données enregistre chaque tentative de connexion dans la table `login_history`, ce qui rend cette fonctionnalité possible.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir un indicateur de statut "En ligne"** à côté de chaque utilisateur dans la liste d'administration afin de savoir rapidement qui a été actif récemment.

## 3. Critères d'acceptation

1.  Un nouvel point d'API DOIT être créé (ex: `GET /v1/admin/users/statuses`).
2.  Ce point d'API DOIT retourner une liste d'utilisateurs avec leur ID et leur dernière date de connexion réussie, extraite de la table `login_history`.
3.  Le service frontend (`adminService.ts` ou un nouveau service) DOIT appeler ce nouveau point d'API lors du chargement de la page de gestion des utilisateurs.
4.  Dans le composant `UserListTable.tsx` (ou équivalent), une nouvelle colonne "Statut" ou un indicateur visuel (ex: un point de couleur) DOIT être ajouté.
5.  Un utilisateur DOIT être considéré comme "En ligne" (ex: point vert) si sa dernière connexion réussie date de moins de 15 minutes (ce seuil doit être facilement configurable).
6.  Un utilisateur DOIT être considéré comme "Inactif" (ex: point gris) s'il ne s'est pas connecté récemment.
7.  L'indicateur de statut DOIT se mettre à jour périodiquement (ex: toutes les minutes) ou lors du rechargement de la liste des utilisateurs.

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
