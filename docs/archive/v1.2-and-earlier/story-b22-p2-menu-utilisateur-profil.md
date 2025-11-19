# Story (Fonctionnalité): Menu Utilisateur et Page "Mon Profil"

**ID:** STORY-B22-P2
**Titre:** Menu Utilisateur et Page "Mon Profil"
**Epic:** Améliorations de l'Expérience Utilisateur
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** utilisateur connecté,  
**Je veux** pouvoir accéder à une page "Mon Profil" pour modifier mes informations personnelles et mon mot de passe,  
**Afin de** pouvoir gérer mon compte de manière autonome.

## Contexte

Actuellement, il n'existe pas d'interface permettant à un utilisateur de modifier ses propres informations. Cette story introduit un menu utilisateur standard et une page de profil dédiée.

## Critères d'Acceptation

### 1. Refonte du Header

-   Dans le header, le nom de l'utilisateur connecté devient un bouton qui, au clic, ouvre un menu déroulant.
-   Ce menu déroulant contient deux options :
    1.  Un lien "Mon Profil" qui redirige vers la page `/profil`.
    2.  Le bouton "Déconnexion", qui est déplacé dans ce menu.

### 2. Création de la Page "Mon Profil" (`/profil`)

-   Une nouvelle page `/profil` est créée et accessible uniquement aux utilisateurs connectés.
-   La page affiche un formulaire permettant de modifier les informations personnelles de l'utilisateur (ex: nom, prénom, email).
-   Une section distincte sur cette page est dédiée au changement de mot de passe. Elle contient :
    -   Un champ "Nouveau mot de passe".
    -   Un champ "Confirmer le nouveau mot de passe".
    -   Une icône "œil" sur chaque champ pour afficher/masquer le mot de passe saisi.
    -   Un texte indicatif rappelant les règles de robustesse du mot de passe.
-   Un bouton "Enregistrer les modifications" sauvegarde les changements.

### 3. Logique Backend

-   Un endpoint API `PUT /api/v1/users/me` doit exister et permettre à l'utilisateur authentifié de mettre à jour ses propres informations (nom, email, etc.).
-   Un endpoint API `PUT /api/v1/users/me/password` doit exister et permettre à l'utilisateur authentifié de changer son mot de passe, en validant que les deux champs correspondent et que le nouveau mot de passe respecte les règles de robustesse.

## Notes Techniques

-   **Composant de Menu :** Utiliser un composant de menu déroulant de la bibliothèque UI (ex: Mantine) pour une implémentation propre.
-   **Validation de Formulaire :** Utiliser une bibliothèque comme `react-hook-form` pour la validation des champs du formulaire de profil et de mot de passe.

## Definition of Done

- [x] Le menu déroulant utilisateur est fonctionnel dans le header.
- [x] La page "Mon Profil" permet de modifier les informations personnelles.
- [x] La page "Mon Profil" permet de changer son mot de passe, avec la validation et l'affichage/masquage.
- [x] Les endpoints API nécessaires sont fonctionnels et sécurisés.
- [x] La story a été validée par le Product Owner.

---

## Dev Agent Record

### Agent Model Used
- James (dev)

### Tasks / Subtasks Checkboxes
- [x] Ajouter menu utilisateur dans le header avec lien Profil et Déconnexion
- [x] Créer la page /profil avec formulaire infos personnelles
- [x] Ajouter section changement de mot de passe avec affichage/masquage et validation
- [x] Implémenter appels API PUT /users/me et /users/me/password côté frontend
- [x] Vérifier/implémenter endpoints backend PUT /users/me et /users/me/password
- [x] Câbler la route protégée /profil dans le routeur React
- [x] Écrire tests (frontend + backend) pour critères d’acceptation

### Debug Log References
- Voir `.ai/debug-log.md` (journal d’exécution de dev)

### Completion Notes
- Menu utilisateur déplacé dans le header avec accès à "Mon Profil" et déconnexion.
- Page `/profil` ajoutée avec édition des champs non sensibles et changement de mot de passe.
- Endpoints self-service ajoutés côté API: `PUT /api/v1/users/me`, `PUT /api/v1/users/me/password`.
- Tests unitaires backend et frontend ajoutés pour couvrir les cas principaux.

### File List
- `api/src/recyclic_api/api/api_v1/endpoints/users.py`
- `api/src/recyclic_api/schemas/user.py`
- `api/tests/test_user_self_endpoints.py`
- `frontend/src/components/Header.jsx`
- `frontend/src/App.jsx`
- `frontend/src/pages/Profile.tsx`
- `frontend/src/test/pages/Profile.test.tsx`

### Change Log
- API: ajout schémas `UserSelfUpdate`, `PasswordChangeRequest` et endpoints self-update/password.
- Frontend: ajout menu utilisateur (profil/déconnexion), route protégée `/profil`, page `Profile.tsx`.
- Tests: couverture basique update profil et mot de passe côté API + test UI profil.

### Status
- Ready for Review

## QA Results

**Gate:** PASS

**Rationale (résumé):**
- Header: le nom utilisateur ouvre un menu avec « Mon Profil » (→ `/profil`) et « Déconnexion ». Le bouton de déconnexion a été déplacé dans ce menu.
- Route protégée: `/profil` est protégée par `ProtectedRoute`.
- Backend: endpoints self-service opérationnels; `PUT /users/me` persiste correctement (commit + refresh), `PUT /users/me/password` met à jour le mot de passe avec commit.
- Tests UI: la page Profil met à jour les infos et le mot de passe (tests verts).

**Evidence:**
- Menu utilisateur: `frontend/src/components/Header.jsx` (menu déroulant, navigation vers `/profil`, déconnexion)
- Route protégée: `frontend/src/App.jsx` (ligne avec `<Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />`)
- Backend update profil: `api/src/recyclic_api/api/api_v1/endpoints/users.py` (`update_me` avec `db.commit()` puis `db.refresh`)
- Backend change mot de passe: `users.py` (`change_my_password` avec `db.commit()`)
- Tests UI: `frontend/src/test/pages/Profile.test.tsx`

**Décision:** PASS — critères d’acceptation respectés et vérifiés.

---

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**ACCEPTÉE**

### Raison de l'Acceptation
Le QA a validé que toutes les fonctionnalités demandées ont été implémentées. La story est terminée.
