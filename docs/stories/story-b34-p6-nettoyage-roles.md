# Story b34-p6: Nettoyage des Rôles Utilisateur

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Les rôles utilisateurs actuels contiennent des termes qui ne sont pas alignés avec le vocabulaire de l'association. Le rôle `MANAGER` n'est pas utilisé, et le terme `UTILISATEUR` devrait être remplacé par `BÉNÉVOLE` pour plus de clarté et de cohérence.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir et gérer des rôles avec des noms clairs et pertinents** ("Bénévole" au lieu de "Utilisateur") afin d'éviter toute confusion.

## 3. Critères d'acceptation

**Backend :**
1.  Dans le fichier `api/src/recyclic_api/models/user.py`, l'énumération `UserRole` DOIT être modifiée : le membre `MANAGER` doit être supprimé.
2.  Une migration de base de données (Alembic) DOIT être créée pour mettre à jour le type `Enum` dans la base de données et supprimer la valeur `manager`.
3.  **(Optionnel)** Cette migration DEVRAIT aussi contenir une requête `UPDATE` pour migrer tous les utilisateurs ayant potentiellement le rôle `manager` vers le rôle `user` avant de supprimer la valeur, pour éviter les erreurs de données.

**Frontend :**
4.  Sur l'ensemble de l'application frontend (ex: `UserListTable.tsx`, `UserProfileTab.tsx`, filtres de recherche), le libellé "Utilisateur" DOIT être remplacé par "Bénévole".
5.  Le filtre par rôle et le sélecteur de rôle dans les formulaires NE DOIVENT PLUS proposer l'option "Manager".

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1`
- **Compte Admin :** `admintest1`
- **Compte Utilisateur (Bénévole) :** `usertest1`

## 5. Conseils pour l'Agent DEV

- **Utilisation des Outils de Développement :** Pour toutes les tâches frontend, n'hésitez pas à utiliser les outils de développement de votre navigateur (ex: Chrome DevTools). Ils sont essentiels pour inspecter le DOM, analyser les requêtes réseau (et leurs réponses), et déboguer le code JavaScript.

## 6. Notes Techniques

-   La modification d'un type `Enum` en production avec Alembic peut être délicate. La documentation d'Alembic et de PostgreSQL doit être consultée pour la bonne procédure.
-   C'est principalement une tâche de "recherche et remplacement" sur le frontend, mais la partie backend (migration de l'Enum) demande de la précision.
-   Il faut s'assurer que la suppression du rôle `MANAGER` ne casse aucune logique de permission qui pourrait en dépendre (peu probable, mais à vérifier).

## QA Results

### Review Date: 2025-01-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellent nettoyage** avec une migration sécurisée et une cohérence parfaite dans toute l'application. Le code est maintenant plus clair et aligné avec le vocabulaire de l'association.

### Refactoring Performed

- **Migration Alembic sécurisée** : Mise à jour des utilisateurs existants avant suppression du rôle
- **Nettoyage frontend complet** : Remplacement cohérent de "Utilisateur" par "Bénévole"
- **Tests mis à jour** : Correction des tests unitaires et E2E pour refléter les nouveaux rôles
- **Types TypeScript corrigés** : Suppression des références au rôle Manager

### Compliance Check

- Coding Standards: ✓ Conformité parfaite aux standards du projet
- Project Structure: ✓ Architecture respectée
- Testing Strategy: ✓ Tests mis à jour et cohérents
- All ACs Met: ✓ Tous les critères d'acceptation respectés

### Improvements Checklist

- [x] Suppression du rôle MANAGER de l'enum UserRole
- [x] Migration Alembic avec UPDATE des utilisateurs existants
- [x] Remplacement "Utilisateur" par "Bénévole" dans RoleSelector
- [x] Mise à jour des types dans authStore
- [x] Correction des tests unitaires
- [x] Correction des tests E2E
- [x] Vérification de l'absence de références au rôle Manager

### Security Review

**Excellent** - Migration sécurisée avec sauvegarde des données utilisateur et possibilité de rollback.

### Performance Considerations

**Très bon** - Migration optimisée avec transaction unique, pas d'impact sur les performances.

### Files Modified During Review

- `api/src/recyclic_api/models/user.py` - Suppression MANAGER de UserRole
- `api/migrations/versions/07d1d205a8c6_remove_manager_role_from_userrole_enum.py` - Migration complète
- `frontend/src/components/business/RoleSelector.tsx` - Libellé 'Bénévole'
- `frontend/src/stores/authStore.ts` - Types mis à jour
- `frontend/src/test/components/business/RoleSelector.test.tsx` - Tests corrigés
- `frontend/tests/e2e/admin.spec.ts` - Tests E2E mis à jour

### Gate Status

Gate: **PASS** → docs/qa/gates/b34.p6-nettoyage-roles.yml
Risk profile: Aucun risque identifié
NFR assessment: Tous les NFR respectés

### Recommended Status

✓ **Ready for Done** - Nettoyage complet et cohérent des rôles utilisateur
