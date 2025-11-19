# Story b33-p6: Activer la Gestion du Code PIN

**Statut:** Validé
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Pour améliorer l'efficacité sur les postes partagés (caisse, réception), un système de "fast user switching" basé sur un code PIN est envisagé. Avant de pouvoir implémenter la logique de switching, il est impératif que chaque utilisateur puisse avoir un code PIN personnel et sécurisé. Cette story pose les fondations de cette fonctionnalité.

L'investigation a confirmé que le champ `hashed_pin` existe déjà dans le modèle `User`, ce qui facilite grandement cette implémentation.

## 2. User Story (En tant que...)

-   En tant qu'**Utilisateur**, je veux **définir et modifier mon code PIN personnel à 4 chiffres** depuis ma page de profil afin de pouvoir utiliser les fonctionnalités de connexion rapide.
-   En tant qu'**Administrateur**, je veux **pouvoir réinitialiser le code PIN** d'un utilisateur s'il l'a oublié, afin de lui permettre d'en créer un nouveau.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau point d'API (ex: `POST /v1/users/me/pin`) DOIT être créé pour permettre à un utilisateur connecté de définir ou de modifier son PIN.
2.  Pour des raisons de sécurité, la modification d'un PIN existant DOIT requérir le mot de passe actuel de l'utilisateur.
3.  Le code PIN reçu par l'API DOIT être hashé (ex: avec Bcrypt) avant d'être stocké dans le champ `hashed_pin`.
4.  Un nouveau point d'API admin (ex: `POST /v1/admin/users/{user_id}/reset-pin`) DOIT être créé.
5.  Cet endpoint admin DOIT effacer le `hashed_pin` de l'utilisateur (le mettre à `NULL`), le forçant ainsi à en créer un nouveau lors de sa prochaine visite sur sa page de profil.

**Frontend (Utilisateur) :**
6.  Une nouvelle section "Gestion du code PIN" DOIT être ajoutée à la page `/profile`.
7.  Si l'utilisateur n'a pas de PIN, l'interface DOIT lui proposer d'en créer un (un champ pour le PIN à 4 chiffres, un champ de confirmation).
8.  Si l'utilisateur a déjà un PIN, l'interface DOIT lui proposer de le modifier (un champ pour son mot de passe actuel, un champ pour le nouveau PIN, un champ de confirmation).
9.  L'interface DOIT fournir une validation claire (ex: 4 chiffres numériques uniquement).

**Frontend (Admin) :**
10. Un bouton "Réinitialiser le PIN" DOIT être ajouté à la vue de détail de l'utilisateur dans l'interface d'administration.
11. Cliquer sur ce bouton DOIT appeler l'endpoint de réinitialisation et afficher une confirmation.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (Pour tester la réinitialisation du PIN)
- **Compte Utilisateur :** `usertest1` (Pour définir/modifier son propre PIN sur `/profile`)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Le champ `hashed_pin` existe déjà dans le modèle `User`. Le backend se concentrera sur la création des endpoints pour le définir/modifier de manière sécurisée (en demandant le mot de passe). Le hashage du PIN (bcrypt) est obligatoire, ne jamais le stocker en clair.

## 6. Notes Techniques

-   Le hashage du PIN est non-négociable pour des raisons de sécurité. Ne jamais stocker le PIN en clair.
-   La logique de "fast user switching" elle-même n'est PAS dans le périmètre de cette story. Cette story se concentre uniquement sur la gestion (création, modification, réinitialisation) du PIN.
-   L'API de vérification du PIN (qui sera utilisée par le module de caisse) sera développée dans une story ultérieure, mais elle doit être gardée à l'esprit.

## 7. Implémentation Réalisée

### 7.1. Backend (API)

**Nouveaux endpoints créés :**
- `PUT /v1/users/me/pin` : Définir/modifier le PIN utilisateur
- `POST /v1/admin/users/{user_id}/reset-pin` : Réinitialiser le PIN (Admin)

**Sécurité implémentée :**
- Hashage bcrypt obligatoire pour tous les PIN
- Validation stricte : exactement 4 chiffres numériques
- Authentification requise pour la modification
- Vérification du mot de passe actuel pour modifier un PIN existant
- Rate limiting : 10 requêtes/minute pour l'endpoint admin

**Schémas de validation :**
- `PinSetRequest` : Validation 4 chiffres avec regex `^\d{4}$`
- `PinAuthRequest` : Pour l'authentification future
- `PinAuthResponse` : Réponse d'authentification

### 7.2. Frontend (Interface)

**Page Profile (`/profile`) :**
- Section "Gestion du code PIN" ajoutée
- Interface adaptative selon le statut du PIN (défini/non défini)
- Champ mot de passe actuel requis uniquement si PIN existe
- Validation côté client : 4 chiffres uniquement
- Boutons d'affichage/masquage pour la sécurité

**Interface Admin :**
- Bouton "Réinitialiser le PIN" dans `UserProfileTab`
- Appel à l'endpoint admin avec confirmation
- Notifications de succès/erreur appropriées

### 7.3. Tests Implémentés

**Fichier de tests :** `api/tests/test_pin_management.py`
- Tests de création de PIN pour nouvel utilisateur
- Tests de modification avec/sans mot de passe
- Tests de validation (format, longueur, caractères)
- Tests de sécurité (hashage, non-stockage en clair)
- Tests d'authentification et d'autorisation
- Tests de réinitialisation admin
- Tests de rate limiting

**Couverture complète :**
- Cas de succès et d'erreur
- Validation des formats de PIN
- Sécurité et hashage
- Contrôles d'accès
- Workflow complet utilisateur/admin

### 7.4. Fichiers Modifiés

**Backend :**
- `api/src/recyclic_api/api/api_v1/endpoints/users.py` : Endpoint utilisateur
- `api/src/recyclic_api/api/api_v1/endpoints/admin.py` : Endpoint admin
- `api/src/recyclic_api/schemas/pin.py` : Schémas de validation (nouveau)
- `api/tests/test_pin_management.py` : Tests complets (nouveau)

**Frontend :**
- `frontend/src/pages/Profile.tsx` : Interface utilisateur
- `frontend/src/components/business/UserProfileTab.tsx` : Interface admin
- `frontend/src/services/adminService.ts` : Service admin

### 7.5. Critères d'Acceptation Validés

✅ **AC 1-5** : Backend - Endpoints utilisateur et admin créés
✅ **AC 6-9** : Frontend utilisateur - Interface complète sur `/profile`
✅ **AC 10-11** : Frontend admin - Bouton de réinitialisation

### 7.6. Agent Model Used

- **Modèle principal :** Claude 3.5 Sonnet
- **Approche :** Implémentation complète avec focus sécurité
- **Priorité :** Hashage obligatoire et validation stricte

### 7.7. Debug Log References

- **Linting :** Aucune erreur détectée dans les fichiers modifiés
- **Tests :** Tests complets pour tous les endpoints
- **Validation :** Tous les critères d'acceptation couverts

### 7.8. Completion Notes List

1. **Sécurité renforcée** : Hashage bcrypt obligatoire, validation stricte
2. **Interface adaptative** : Gestion différenciée selon le statut du PIN
3. **Tests exhaustifs** : Couverture complète des cas d'usage et de sécurité
4. **Contrôles d'accès** : Authentification et autorisation appropriées
5. **Rate limiting** : Protection contre les abus

### 7.9. File List

**Fichiers ajoutés :**
- `api/src/recyclic_api/schemas/pin.py`
- `api/tests/test_pin_management.py`

**Fichiers modifiés :**
- `api/src/recyclic_api/api/api_v1/endpoints/users.py`
- `api/src/recyclic_api/api/api_v1/endpoints/admin.py`
- `frontend/src/pages/Profile.tsx`
- `frontend/src/components/business/UserProfileTab.tsx`
- `frontend/src/services/adminService.ts`

### 7.10. Change Log

**2025-01-27 :** Implémentation complète de la gestion du code PIN
- Création des endpoints utilisateur et admin
- Ajout des schémas de validation PIN
- Implémentation de l'interface utilisateur sur `/profile`
- Ajout du bouton de réinitialisation admin
- Création de tests complets pour tous les cas d'usage
- Validation de tous les critères d'acceptation

## 8. Statut

**Statut :** ✅ **Ready for Review**

Tous les critères d'acceptation ont été implémentés et testés. La gestion du code PIN est maintenant complète et sécurisée pour tous les types d'utilisateurs.

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellente implémentation** - La story b33-p6 présente une implémentation complète et sécurisée de la gestion du code PIN. L'approche est bien structurée avec une séparation claire entre les fonctionnalités utilisateur et admin.

**Points forts identifiés :**
- Architecture de sécurité robuste avec hashage bcrypt obligatoire
- Validation stricte des PIN (exactement 4 chiffres numériques)
- Interface adaptative selon le statut du PIN (défini/non défini)
- Tests exhaustifs couvrant tous les cas d'usage et de sécurité
- Contrôles d'accès appropriés avec authentification requise

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et suit les bonnes pratiques de sécurité.

### Compliance Check

- **Coding Standards:** ✓ Conformité excellente aux standards de sécurité
- **Project Structure:** ✓ Architecture respectée avec séparation claire backend/frontend
- **Testing Strategy:** ✓ Tests complets avec couverture unitaire et d'intégration
- **All ACs Met:** ✓ Tous les critères d'acceptation (AC 1-11) sont implémentés et validés

### Improvements Checklist

- [x] **Sécurité renforcée** : Hashage bcrypt obligatoire, validation stricte 4 chiffres
- [x] **Interface adaptative** : Gestion différenciée selon le statut du PIN
- [x] **Tests exhaustifs** : Couverture complète des cas de succès, d'erreur et de sécurité
- [x] **Contrôles d'accès** : Authentification et autorisation appropriées
- [x] **Rate limiting** : Protection contre les abus (10 requêtes/minute)
- [x] **Validation stricte** : Regex `^\d{4}$` pour garantir 4 chiffres uniquement

### Security Review

**Excellent niveau de sécurité** - Tous les aspects critiques sont couverts :
- Hashage bcrypt obligatoire (jamais de stockage en clair)
- Validation stricte des formats de PIN (4 chiffres uniquement)
- Authentification requise pour la modification
- Vérification du mot de passe actuel pour les PIN existants
- Rate limiting pour prévenir les abus
- Contrôles d'accès granulaires (utilisateur vs admin)

### Performance Considerations

**Performance optimale** - Aucun problème de performance identifié :
- Endpoints optimisés avec rate limiting approprié
- Hashage bcrypt standard (sécurité vs performance équilibrée)
- Interface utilisateur réactive avec validation en temps réel

### Files Modified During Review

Aucun fichier modifié pendant la revue - l'implémentation est déjà complète et de qualité.

### Gate Status

**Gate: PASS** → qa/qaLocation/gates/b33.p6-activer-gestion-code-pin.yml

### Recommended Status

**✓ Ready for Done** - Tous les critères d'acceptation sont implémentés, testés et sécurisés. La story est prête pour la production.
