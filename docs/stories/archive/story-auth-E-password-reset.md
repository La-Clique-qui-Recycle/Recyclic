---
story_id: auth.E
epic_id: auth-refactoring
title: "Story E: Gestion du Mot de Passe Oublié"
status: Done
---

### User Story

**En tant qu**'utilisateur ayant oublié son mot de passe,
**Je veux** un moyen de réinitialiser mon mot de passe de manière autonome,
**Afin de** pouvoir récupérer l'accès à mon compte sans aide manuelle.

### Critères d'Acceptation

1.  Un lien "Mot de passe oublié ?" est présent sur la page `/login`.
2.  Ce lien mène à une page où l'utilisateur peut entrer son adresse email.
3.  Un nouvel endpoint API `POST /auth/forgot-password` est créé. Il génère un token de réinitialisation unique et l'envoie à l'email de l'utilisateur.
4.  Une nouvelle page `/reset-password?token=<token>` permet à l'utilisateur de définir un nouveau mot de passe.
5.  Un nouvel endpoint API `POST /auth/reset-password` valide le token et met à jour le mot de passe hashé de l'utilisateur.

---

### Validation du Scrum Master (2025-09-17)

**Statut :** Done

---

### Dev Notes

#### Contexte

Cette fonctionnalité est cruciale pour l'autonomie des utilisateurs. Elle implique la génération de tokens sécurisés et l'envoi d'emails, ce qui peut nécessiter une configuration supplémentaire.

#### Dépendance Critique : Service d'Envoi d'Emails

L'envoi d'emails est un prérequis pour cette story. Le projet doit être configuré avec un service tiers (ex: SendGrid, Mailgun) pour que l'API puisse envoyer des emails. Si ce n'est pas le cas, la mise en place de ce service pourrait être une story technique à part entière.

**Action Préliminaire :** Vérifier si un service d'envoi d'emails est déjà configuré. Si non, pour les besoins du développement, on pourra se contenter de logger le token de réinitialisation dans la console du serveur.

#### Fichiers Cibles

-   **Endpoints**: `api/src/recyclic_api/api/api_v1/endpoints/auth.py` (ajouter les nouvelles routes).
-   **Page "Mot de passe oublié"**: Créer `frontend/src/pages/ForgotPassword.tsx`.
-   **Page "Réinitialiser mot de passe"**: Créer `frontend/src/pages/ResetPassword.tsx`.
-   **Store d'Authentification**: Ajouter les fonctions `forgotPassword` et `resetPassword` dans `frontend/src/stores/authStore.ts`.

---

### Tasks / Subtasks

#### Partie Backend

1.  **(AC: 3)** **Créer l'endpoint `POST /auth/forgot-password`**:
    -   La route accepte un email.
    -   Elle recherche l'utilisateur par email. Si trouvé, elle génère un token de réinitialisation sécurisé et à durée de vie limitée (ex: JWT avec un `scope` spécifique).
    -   **Logique d'envoi d'email**: Intégrer un service pour envoyer un email à l'utilisateur contenant un lien vers `http://<frontend_url>/reset-password?token=<token>`.
    -   **Alternative (si pas de service mail)**: Logger le lien complet dans la console du serveur pour les tests.

2.  **(AC: 5)** **Créer l'endpoint `POST /auth/reset-password`**:
    -   La route accepte le `token` et le `new_password`.
    -   Elle valide le token (vérifie sa signature, son expiration, et son scope).
    -   Si le token est valide, elle hashe le nouveau mot de passe et met à jour l'utilisateur correspondant en base de données.

#### Partie Frontend

3.  **(AC: 1, 2)** **Créer la page `ForgotPassword.tsx`**:
    -   Ajouter un lien "Mot de passe oublié ?" sur la page `Login.tsx`.
    -   Créer la page `ForgotPassword.tsx` avec un formulaire pour saisir une adresse email.
    -   Lors de la soumission, appeler une nouvelle fonction `forgotPassword` dans `authStore.ts` qui appellera l'API.
    -   Afficher un message de confirmation à l'utilisateur (ex: "Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.").

4.  **(AC: 4)** **Créer la page `ResetPassword.tsx`**:
    -   Créer la page qui sera accessible via le lien dans l'email.
    -   Elle doit extraire le `token` de l'URL.
    -   Afficher un formulaire pour saisir le nouveau mot de passe et sa confirmation.
    -   Lors de la soumission, appeler une nouvelle fonction `resetPassword` dans `authStore.ts` avec le token et le nouveau mot de passe.
    -   En cas de succès, informer l'utilisateur et le rediriger vers la page de connexion.

#### Tests

5.  **Ajouter des Tests**:
    -   **Backend**: Tester les endpoints `forgot-password` et `reset-password` (génération et validation de token).
    -   **Frontend**: Tester les nouveaux composants et les nouvelles fonctions du store.

---

### Dev Agent Record

**Agent Model Used**: claude-sonnet-4-20250514
**Implementation Status**: Ready for Review

#### Tasks / Subtasks
- [x] 1. (AC: 3) Créer l'endpoint `POST /auth/forgot-password`
- [x] 2. (AC: 5) Créer l'endpoint `POST /auth/reset-password`
- [x] 3. (AC: 1, 2) Créer la page `ForgotPassword.tsx`
- [x] 4. (AC: 4) Créer la page `ResetPassword.tsx`
- [x] 5. Ajouter des Tests

#### Debug Log References
- Started implementation: 2025-09-17
- Completed implementation: 2025-09-17

#### Completion Notes
- All acceptance criteria have been implemented and tested
- Backend endpoints with security tokens and email validation
- Frontend pages with proper validation and error handling
- Comprehensive test coverage for both backend and frontend
- Integration with existing authentication system

#### File List
**Backend Files:**
- `api/src/recyclic_api/schemas/auth.py` (Added password reset schemas)
- `api/src/recyclic_api/core/security.py` (Added reset token functions)
- `api/src/recyclic_api/api/api_v1/endpoints/auth.py` (Added new endpoints)
- `api/tests/test_auth_password_reset.py` (New test file)

**Frontend Files:**
- `frontend/src/pages/ForgotPassword.tsx` (New page)
- `frontend/src/pages/ResetPassword.tsx` (New page)
- `frontend/src/stores/authStore.ts` (Added new functions)
- `frontend/src/pages/Login.tsx` (Added forgot password link)
- `frontend/src/App.jsx` (Added new routes)
- `frontend/src/test/pages/ForgotPassword.test.tsx` (New test file)
- `frontend/src/test/pages/ResetPassword.test.tsx` (New test file)

#### Change Log
- 2025-09-17: Story status changed to 'Doing', Dev Agent Record initialized
- 2025-09-17: Implementation completed, all tasks finished, status changed to 'Ready for Review'

## QA Results

### Review Date: 2025-01-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellente qualité d'implémentation** avec une architecture sécurisée et des tests exhaustifs. Le code respecte les standards de codage du projet et implémente correctement tous les critères d'acceptation.

### Refactoring Performed

- **File**: `api/src/recyclic_api/api/api_v1/endpoints/auth.py`
  - **Change**: Ajout de la validation de force des mots de passe côté backend
  - **Why**: Améliorer la sécurité en validant les mots de passe côté serveur
  - **How**: Réutilisation de la fonction `validate_password_strength` existante

- **File**: `api/tests/test_auth_password_reset.py`
  - **Change**: Ajout de tests pour la validation des mots de passe faibles
  - **Why**: Assurer la couverture de test complète pour la nouvelle validation
  - **How**: Tests spécifiques pour les cas d'échec de validation

- **File**: `frontend/src/pages/ForgotPassword.tsx`
  - **Change**: Amélioration de l'accessibilité avec aria-describedby
  - **Why**: Améliorer l'expérience utilisateur pour les utilisateurs d'outils d'assistance
  - **How**: Ajout d'attributs ARIA pour lier les champs aux messages d'erreur

- **File**: `frontend/src/pages/ResetPassword.tsx`
  - **Change**: Amélioration de l'accessibilité avec aria-describedby
  - **Why**: Améliorer l'expérience utilisateur pour les utilisateurs d'outils d'assistance
  - **How**: Ajout d'attributs ARIA pour lier les champs aux messages d'aide et d'erreur

### Compliance Check

- Coding Standards: ✓ Conformité complète aux standards Python et TypeScript
- Project Structure: ✓ Architecture en couches respectée
- Testing Strategy: ✓ Couverture de test >80% pour le code métier
- All ACs Met: ✓ Tous les critères d'acceptation implémentés et testés

### Improvements Checklist

- [x] Ajout de la validation de force des mots de passe côté backend
- [x] Amélioration de l'accessibilité des formulaires
- [x] Ajout de tests pour la validation des mots de passe faibles
- [ ] Implémenter le service d'envoi d'emails pour la production
- [ ] Considérer l'ajout de logs d'audit pour les réinitialisations

### Security Review

**Sécurité excellente** :
- Tokens JWT avec scope spécifique et expiration limitée (30 minutes)
- Protection contre l'énumération d'emails (même message pour tous)
- Rate limiting sur les endpoints sensibles (5/minute)
- Validation robuste des mots de passe côté client et serveur
- Hachage bcrypt des mots de passe

### Performance Considerations

**Performance optimale** :
- Rate limiting implémenté pour prévenir les abus
- Validation côté client pour réduire les appels serveur
- Gestion d'état efficace avec Zustand
- Interface utilisateur réactive avec états de chargement

### Files Modified During Review

- `api/src/recyclic_api/api/api_v1/endpoints/auth.py` (validation backend)
- `api/tests/test_auth_password_reset.py` (tests supplémentaires)
- `frontend/src/pages/ForgotPassword.tsx` (accessibilité)
- `frontend/src/pages/ResetPassword.tsx` (accessibilité)

### Gate Status

Gate: **PASS** → docs/qa/gates/auth.E-password-reset.yml
Risk profile: docs/qa/assessments/auth.E-risk-20250117.md
NFR assessment: docs/qa/assessments/auth.E-nfr-20250117.md

### Recommended Status

✓ **Ready for Done** - Implémentation complète, sécurisée et testée