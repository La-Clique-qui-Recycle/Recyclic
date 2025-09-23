# Story (Technique): Rendre la Page d'Inscription Publique

**ID:** STORY-TECH-PUBLIC-REGISTRATION
**Titre:** Rendre la Page d'Inscription Publique
**Epic:** Gestion Utilisateurs & Infrastructure

---

## User Story

**En tant que** nouveau visiteur non authentifié,  
**Je veux** pouvoir accéder au formulaire d'inscription directement via son URL,  
**Afin de** pouvoir créer un compte sans être bloqué par une page de connexion.

## Contexte d'Intégration

- **Problème :** Actuellement, l'URL d'inscription (ex: `/inscription?telegram_id=...`) redirige vers la page de connexion si l'utilisateur n'a pas de session active, ce qui empêche toute nouvelle inscription.
- **Intégration avec :** La couche de routage de l'application (probablement au niveau du reverse proxy Nginx ou du routeur de l'application React).
- **Technologies :** Nginx, React Router.

## Critères d'Acceptation

### Exigences Fonctionnelles

1.  L'accès à l'URL `/inscription` (avec ou sans paramètres) par un utilisateur non authentifié doit afficher le formulaire d'inscription.
2.  L'accès à cette URL ne doit **jamais** rediriger vers la page `/login`.
3.  Les autres routes de l'application qui nécessitent une authentification (ex: le panneau d'administration) doivent continuer à rediriger vers `/login` comme prévu.

### Exigences de Qualité

4.  Le document `docs/architecture/architecture.md` est mis à jour pour spécifier que la route `/inscription` est publique et ne requiert pas d'authentification.
5.  Aucune régression de sécurité n'est introduite.

## Notes Techniques

- **Approche d'intégration :** L'investigation doit déterminer où le middleware d'authentification est appliqué. Il faut l'ajuster pour exclure la route `/inscription`.
- **Risque Principal :** Une mauvaise configuration pourrait rendre publiques des routes qui devraient rester privées. Une vérification des routes principales de l'administration est nécessaire après la modification.

## Definition of Done

- [x] Le formulaire d'inscription est accessible publiquement.
- [x] Les routes privées sont toujours protégées.
- [x] La documentation d'architecture est mise à jour.
- [ ] La story a été validée par le Product Owner.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (claude-sonnet-4-20250514)

### Tasks
- [x] **Investigation de l'architecture d'authentification et de routage** : Analysé le composant `ProtectedRoute` et la structure de routage dans `App.jsx`
- [x] **Suppression de la protection de la route `/inscription`** : Retiré le wrapper `ProtectedRoute` de la route `/inscription` dans `App.jsx`
- [x] **Création de tests d'intégration** : Développé des tests complets pour vérifier l'accessibilité publique de la route d'inscription
- [x] **Correction d'un problème d'import** : Résolu le problème d'import dans `healthService.ts` qui empêchait la compilation
- [x] **Vérification des routes protégées** : Confirmé que les autres routes restent correctement protégées
- [x] **Mise à jour de la documentation** : Mis à jour `docs/architecture/architecture.md` avec la liste des routes publiques
- [x] **Correction de la documentation suite au retour PO** : Restructuré la section "Stratégie de Sécurité" avec des sous-sections "Routes Publiques" et "Routes Protégées" distinctes

### File List
#### Modified Files:
- `frontend/src/App.jsx` - Suppression du wrapper ProtectedRoute pour la route `/inscription`
- `frontend/src/services/healthService.ts` - Correction de l'import de l'instance API
- `frontend/src/test/setup.ts` - Ajout du tag `main` au mock styled-components
- `docs/architecture/architecture.md` - Documentation des routes publiques dans la section sécurité (restructuré avec sous-sections distinctes)
- `frontend/vitest.config.js` - Correction des imports ESM et ajout de la référence vitest types
- `frontend/src/test/integration/public-routes.test.tsx` - Ajout de afterEach(vi.resetAllMocks()) et beforeEach(vi.clearAllMocks()) pour conformité aux standards

#### Created Files:
- `frontend/src/test/integration/public-routes.test.tsx` - Tests d'intégration pour vérifier l'accessibilité des routes publiques
- `frontend/tests/e2e/public-registration.spec.ts` - Tests E2E Playwright pour validation complète

### Completion Notes
La route `/inscription` est maintenant accessible publiquement sans authentification. Les tests confirment que :
1. La page d'inscription se charge correctement sans authentification
2. Les paramètres URL (comme `telegram_id`) sont correctement traités
3. Les autres routes protégées continuent de rediriger vers la page de connexion
4. Les routes publiques existantes (`/login`, `/signup`, etc.) fonctionnent toujours

**Corrections de conformité des tests appliquées :**
- Configuration Vitest corrigée avec imports ESM appropriés
- Tests d'intégration mis à jour avec `afterEach(vi.resetAllMocks())` et `beforeEach(vi.clearAllMocks())`
- Mock lifecycle management amélioré pour isolation des tests
- Utilisation de sélecteurs stables (`getByRole`, `getByLabelText`) et patterns async corrects

**Correction suite au retour PO :**
- Documentation d'architecture restructurée avec des sous-sections "Routes Publiques" et "Routes Protégées" distinctes
- La route `/inscription` est maintenant clairement documentée comme route publique dans la section dédiée

**Validation finale :**
- Tous les tests de routes publiques passent (12/12)
- Aucune régression détectée dans les tests existants
- La story est maintenant prête pour validation PO

### Change Log
- **2025-09-22** : Implémentation de la story technique pour rendre la page d'inscription publique
  - Suppression de la protection d'authentification sur `/inscription`
  - Ajout de tests d'intégration complets
  - Mise à jour de la documentation d'architecture
  - Correction des problèmes de build liés aux imports
  - **Corrections de conformité des tests** : Configuration Vitest et patterns de test alignés avec le guide de test frontend
- **2025-09-22** : Correction suite au retour PO
  - Restructuration de la documentation d'architecture avec sous-sections "Routes Publiques" et "Routes Protégées" distinctes
  - Clarification de la documentation pour répondre aux exigences du Product Owner
  - **Validation finale** : Tous les tests passent (12/12), aucune régression détectée

### Status
Ready for Review

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**ACCEPTÉE**

### Raison de l'Acceptation
La documentation (`docs/architecture/architecture.md`) a été correctement mise à jour pour inclure la section sur les routes publiques, conformément à la demande de la revue précédente. Tous les critères d'acceptation sont maintenant remplis.
