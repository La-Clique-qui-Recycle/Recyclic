---
story_id: auth.D
epic_id: auth-refactoring
title: "Story D: Nouveau Workflow d'Inscription Utilisateur"
status: Done
---

### User Story

**En tant que** nouvel utilisateur,
**Je veux** pouvoir créer mon propre compte avec un nom d'utilisateur et un mot de passe,
**Afin de** ne pas dépendre d'une validation manuelle pour commencer le processus d'inscription.

### Critères d'Acceptation

1.  Une nouvelle page `/signup` est créée avec un formulaire (Nom d'utilisateur, Email (optionnel), Mot de passe, Confirmation du mot de passe).
2.  Un nouvel endpoint API `POST /auth/signup` est créé.
3.  Cet endpoint crée un nouvel utilisateur avec le `role` par défaut (`user`) et le `status` par défaut (`pending`).
4.  Le mot de passe est hashé avant d'être stocké.
5.  Après l'inscription, l'utilisateur est informé que son compte est en attente de validation par un administrateur.

---

### Dev Notes

#### Contexte

Cette story introduit la fonctionnalité d'auto-inscription. Elle nécessite des ajouts à la fois sur le backend et le frontend.

#### Références Architecturales Clés

1.  **Architecture Générale**: `docs/architecture/architecture.md`. Les nouveaux endpoints et composants doivent suivre les patterns existants.
2.  **Utilitaires de Sécurité**: Le fichier `api/src/recyclic_api/core/security.py` contient la fonction `hash_password` qui **doit** être utilisée.

#### Fichiers Cibles

-   **Endpoint Signup**: `api/src/recyclic_api/api/api_v1/endpoints/auth.py` (ajouter la nouvelle route ici).
-   **Page Signup**: Créer `frontend/src/pages/Signup.tsx`.
-   **Store d'Authentification**: Ajouter une fonction `signup` dans `frontend/src/stores/authStore.ts`.

---

### Tasks / Subtasks

### Tasks / Subtasks

---

### Validation du Scrum Master (2025-09-17)

**Statut :** Done

---

#### Partie Backend

- [x] **(AC: 2, 3, 4)** **Créer l'endpoint `POST /auth/signup`**:
    -   Dans `api/src/recyclic_api/api/api_v1/endpoints/auth.py`, ajouter une nouvelle route `POST /signup`.
    -   Créer un nouveau schéma Pydantic pour la requête de signup (ex: `SignupRequest`) qui inclut `username`, `password`, et `email` (optionnel).
    -   L'endpoint doit vérifier si le `username` existe déjà et retourner une erreur si c'est le cas.
    -   Utiliser la fonction `hash_password` pour hasher le mot de passe.
    -   Créer une nouvelle instance du modèle `User` avec `role='user'` et `status='pending'`.
    -   Sauvegarder le nouvel utilisateur en base de données.

#### Partie Frontend

- [x] **(AC: 1)** **Créer la page `Signup.tsx`**:
    -   Créer le composant de page `frontend/src/pages/Signup.tsx`.
    -   Implémenter un formulaire avec les champs requis : `username`, `email` (optionnel), `password`, et une confirmation de mot de passe.
    -   Ajouter une validation côté client pour s'assurer que les deux mots de passe correspondent.

- [x] **(AC: 5)** **Mettre à jour le `authStore.ts`**:
    -   Ajouter une nouvelle fonction `signup(username, password, email)` au store.
    -   Cette fonction doit appeler l'endpoint `POST /auth/signup` via le client API généré.
    -   Gérer les états de chargement et d'erreur.

- [x] **(AC: 5)** **Connecter le formulaire et gérer la redirection**:
    -   Dans `Signup.tsx`, appeler la fonction `signup` du store lors de la soumission du formulaire.
    -   En cas de succès, ne **pas** connecter l'utilisateur. Afficher un message clair indiquant que le compte a été créé et est en attente de validation.
    -   En cas d'erreur (ex: nom d'utilisateur déjà pris), afficher le message d'erreur retourné par l'API.

#### Tests

- [x] **Ajouter des Tests**:
    -   **Backend**: Écrire des tests d'intégration pour l'endpoint `POST /auth/signup`, couvrant le cas de succès et les cas d'erreur (utilisateur existant).
    -   **Frontend**: Écrire des tests pour le composant `Signup.tsx` et la nouvelle fonction `signup` dans `authStore.ts`.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (claude-sonnet-4-20250514)

### File List
**Backend Files:**
- `api/src/recyclic_api/schemas/auth.py` - Ajout des schémas SignupRequest et SignupResponse
- `api/src/recyclic_api/api/api_v1/endpoints/auth.py` - Ajout de l'endpoint POST /auth/signup
- `api/tests/test_auth_signup_endpoint.py` - Tests complets pour l'endpoint signup

**Frontend Files:**
- `frontend/src/pages/Signup.tsx` - Nouveau composant page pour l'inscription
- `frontend/src/stores/authStore.ts` - Ajout de la fonction signup au store
- `frontend/src/App.jsx` - Ajout de la route /signup
- `frontend/src/test/stores/authStore.test.ts` - Tests pour la fonction signup du store
- `frontend/src/test/pages/Signup.test.tsx` - Tests complets pour le composant Signup

### Completion Notes
- ✅ **AC1**: Page `/signup` créée avec formulaire complet (username, email optionnel, password, confirmation)
- ✅ **AC2**: Endpoint `POST /auth/signup` implémenté avec validation et gestion d'erreurs
- ✅ **AC3**: Utilisateur créé avec role='user' et status='pending' par défaut
- ✅ **AC4**: Mot de passe haché avec bcrypt avant stockage
- ✅ **AC5**: Message de confirmation affiché après inscription (compte en attente de validation)
- ✅ Validation côté client pour correspondance des mots de passe
- ✅ Gestion des erreurs (username déjà pris, etc.)
- ✅ Tests backend complets (12 cas de test)
- ✅ Tests frontend complets (composant et store)
- ✅ Rate limiting appliqué sur l'endpoint signup (5/minute)
- ✅ Respect des patterns existants du projet

### Change Log
**2025-09-17**
- Implémentation complète du workflow d'inscription utilisateur
- Ajout des schémas Pydantic pour signup avec validation
- Endpoint sécurisé avec vérification d'unicité du username
- Composant React avec validation temps réel des mots de passe
- Tests exhaustifs backend et frontend
- Intégration dans le routage de l'application

### Status
Ready for Review

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellente implémentation avec une architecture solide et une attention particulière aux aspects de sécurité. Le code respecte les standards du projet avec une séparation claire des responsabilités entre backend et frontend. L'implémentation utilise les patterns appropriés (Repository, Service layer) et suit les bonnes pratiques de développement.

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et optimisé.

### Compliance Check

- Coding Standards: ✓ Respecte TypeScript strict mode, patterns d'architecture, gestion d'erreurs standardisée
- Project Structure: ✓ Suit la structure définie avec séparation claire backend/frontend
- Testing Strategy: ✓ Tests exhaustifs (12 cas backend + tests frontend complets)
- All ACs Met: ✓ Tous les critères d'acceptation sont implémentés et testés

### Improvements Checklist

- [x] Rate limiting implémenté (5 requêtes/minute)
- [x] Validation des entrées côté client et serveur
- [x] Hachage sécurisé des mots de passe (bcrypt)
- [x] Gestion d'erreurs robuste
- [x] Tests complets pour tous les scénarios
- [x] Interface utilisateur intuitive avec validation temps réel
- [ ] Considérer l'ajout d'un indicateur de force du mot de passe
- [ ] Considérer l'ajout d'un workflow de vérification email

### Security Review

Sécurité excellente :
- Rate limiting appliqué sur l'endpoint signup
- Mots de passe hachés avec bcrypt (salt automatique)
- Validation stricte des entrées (longueur, format)
- Vérification d'unicité du nom d'utilisateur
- Gestion appropriée des erreurs sans exposition d'informations sensibles

### Performance Considerations

Performance optimale :
- Requêtes base de données efficaces avec index sur username
- Pas de requêtes N+1
- Validation côté client pour réduire les appels serveur
- Gestion appropriée des états de chargement

### Files Modified During Review

Aucun fichier modifié lors de la révision - le code était déjà de qualité production.

### Gate Status

Gate: PASS → docs/qa/gates/auth.D-signup-workflow.yml
Risk profile: Aucun risque identifié
NFR assessment: Tous les NFRs validés (sécurité, performance, fiabilité, maintenabilité)

### Recommended Status

✓ Ready for Done - Implémentation complète et robuste prête pour la production
