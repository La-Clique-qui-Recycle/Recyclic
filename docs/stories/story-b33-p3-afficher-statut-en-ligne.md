# Story b33-p3: Afficher le Statut "En Ligne"

**Statut:** Prêt pour développement
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
