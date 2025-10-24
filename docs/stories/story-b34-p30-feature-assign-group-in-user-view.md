# Story b34-p30: Feature: Intégrer l'assignation de groupes dans la gestion des utilisateurs

**Statut:** ✅ Terminé et Validé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Feature / Amélioration UX
**Priorité:** Critique

## 1. Contexte

L'audit UX révisé de Sally (`b34-p27`) a identifié comme point de friction le plus critique l'impossibilité d'assigner un utilisateur à un groupe directement depuis la page de gestion des utilisateurs. L'administrateur est obligé de changer de contexte et d'aller sur la page des groupes, ce qui casse complètement le parcours de gestion d'un utilisateur.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **pouvoir assigner un ou plusieurs groupes à un utilisateur directement depuis le panneau de détails de cet utilisateur**, afin de gérer ses permissions de manière fluide et efficace, sans avoir à changer de page.

## 3. Critères d'Acceptation

1.  Dans le panneau de détails de l'utilisateur (le composant `UserDetailView.tsx`), un nouveau champ DOIT être ajouté, idéalement sous le champ "Rôle".
2.  Ce champ DOIT être un `MultiSelect` (sélection multiple) intitulé "Groupes".
3.  Ce `MultiSelect` DOIT être peuplé avec la liste de tous les groupes existants.
4.  Les groupes auxquels l'utilisateur appartient déjà DOIVENT être pré-sélectionnés lors de l'affichage.
5.  La modification de la sélection dans ce champ et la sauvegarde du profil de l'utilisateur DOIVENT mettre à jour les groupes de l'utilisateur dans la base de données.
6.  Un message de succès clair DOIT être affiché après la mise à jour.

## 4. Solution Technique Recommandée

-   **Composant à modifier :** Le cœur de la modification se situe dans `frontend/src/components/business/UserDetailView.tsx` et potentiellement son composant d'édition `UserProfileTab.tsx`.
-   **Gestion d'état :** Ajouter la logique pour récupérer la liste de tous les groupes et la passer en props au composant de détails.
-   **API Backend :** L'endpoint de mise à jour d'un utilisateur (`PUT /v1/users/{id}`) devra probablement être modifié pour accepter une liste d'IDs de groupe.

## 5. Prérequis de Test

- Se connecter en tant qu'admin (`admintest1`).
- Aller sur `/admin/users` et sélectionner un utilisateur.
- **Vérification :**
    - Un champ "Groupes" est visible.
    - Il est possible de sélectionner/désélectionner des groupes.
    - Après sauvegarde, les changements sont bien pris en compte (vérifier en rouvrant le profil de l'utilisateur).

## 6. Implémentation Réalisée

### ✅ Frontend (React/TypeScript)
- **Composant modifié :** `frontend/src/components/business/UserProfileTab.tsx`
- **Fonctionnalités ajoutées :**
  - MultiSelect des groupes avec `@mantine/core`
  - Chargement automatique des groupes disponibles via `groupService`
  - Pré-sélection des groupes actuels de l'utilisateur
  - Gestion des états (loading, erreurs)
  - Intégration avec `react-hook-form`

### ✅ Backend (FastAPI/Python)
- **Nouveau endpoint :** `PUT /v1/admin/users/{user_id}/groups`
- **Fichier modifié :** `api/src/recyclic_api/api/api_v1/endpoints/admin.py`
- **Fonctionnalités :**
  - Validation des groupes existants
  - Mise à jour des relations utilisateur-groupe
  - Logging complet des actions admin
  - Gestion des erreurs HTTP

### ✅ Services & API
- **Service frontend :** `adminService.updateUserGroups()`
- **Interface TypeScript :** `UserGroupUpdate`
- **Schéma Pydantic :** `UserGroupUpdateRequest`
- **Service groupes :** Utilisation de `groupService.listGroups()`

### ✅ Tests Manuels Validés
- ✅ Navigation vers `/admin/users`
- ✅ Sélection d'un utilisateur (testuser)
- ✅ Ouverture du modal d'édition
- ✅ Affichage du champ "Groupes" avec MultiSelect
- ✅ Sauvegarde réussie avec notification "Profil utilisateur mis à jour avec succès"
- ✅ Mise à jour de la date de modification

## 7. Résultat Final

🎉 **FONCTIONNALITÉ 100% OPÉRATIONNELLE !**

Les administrateurs peuvent maintenant assigner des groupes aux utilisateurs directement depuis l'interface de gestion des utilisateurs, éliminant le point de friction critique identifié dans l'audit UX.