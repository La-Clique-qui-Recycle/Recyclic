# Story b34-p30: Bug: Intégrer l'assignation de groupes dans la gestion des utilisateurs

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug / Amélioration UX
**Priorité:** Critique

## 1. Contexte

L'audit UX de Sally (`b34-p27`) a identifié comme point de friction le plus critique l'impossibilité d'assigner un utilisateur à un groupe directement depuis la page de gestion des utilisateurs. L'administrateur est obligé de changer de contexte et d'aller sur la page des groupes, ce qui casse complètement le parcours de gestion d'un utilisateur.

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
-   **Logique de mise à jour :** La fonction de sauvegarde du profil utilisateur (`handleUserUpdate` ou similaire) devra être modifiée pour inclure l'envoi des nouveaux IDs de groupe à l'API.
-   **API Backend :** L'endpoint de mise à jour d'un utilisateur (`PUT /v1/users/{id}`) devra probablement être modifié pour accepter une liste d'IDs de groupe.

## 5. Prérequis de Test

- Se connecter en tant qu'admin (`admintest1`).
- Aller sur `/admin/users` et sélectionner un utilisateur.
- **Vérification :**
    - Un champ "Groupes" est visible.
    - Il est possible de sélectionner/désélectionner des groupes.
    - Après sauvegarde, les changements sont bien pris en compte (vérifier en rouvrant le profil de l'utilisateur).
