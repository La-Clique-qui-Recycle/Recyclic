# Story b33-p5: Mettre en place les Permissions par Groupes

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

La gestion actuelle des accès est basée sur des rôles (`USER`, `MANAGER`, `ADMIN`) qui sont trop larges. Pour gérer finement l'accès aux futurs modules (Caisse, Réception), il est nécessaire d'avoir un système de permissions plus granulaire. Gérer ces permissions individuellement n'est pas scalable. Cette story propose de mettre en place une gestion des accès basée sur les groupes.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **créer et gérer des groupes d'utilisateurs** (ex: "Équipe Caisse", "Équipe Réception") et **assigner des permissions à ces groupes** afin de gérer les droits d'accès de manière centralisée, simple et scalable.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau modèle de données `Permission` DOIT être créé (ex: `id`, `name`, `description`). Des permissions initiales comme `caisse.access`, `reception.access` DOIVENT être créées par migration.
2.  Un nouveau modèle de données `Group` DOIT être créé (ex: `id`, `name`, `description`).
3.  Des tables de liaison (many-to-many) DOIVENT être créées pour lier :
    -   `Users` <-> `Groups`
    -   `Groups` <-> `Permissions`
4.  De nouveaux points d'API DOIVENT être créés pour la gestion CRUD (Create, Read, Update, Delete) des groupes.
5.  De nouveaux points d'API DOIVENT être créés pour lister les permissions, et pour assigner/retirer des permissions à un groupe.
6.  Un nouveau point d'API DOIT être créé pour assigner/retirer un utilisateur à un groupe.
7.  La logique d'authentification (`core/auth.py`) DOIT être étendue avec une fonction qui vérifie si un utilisateur a une permission spécifique (via les groupes auxquels il appartient).

**Frontend (Admin) :**
8.  Une nouvelle page d'administration "Gestion des Groupes" DOIT être créée.
9.  Cette page DOIT permettre de créer, renommer, et supprimer des groupes.
10. Pour chaque groupe, l'interface DOIT permettre d'assigner/retirer des permissions via une liste (ex: cases à cocher).
11. Dans la vue de détail d'un utilisateur (`/admin/users`), une nouvelle section DOIT permettre de l'assigner ou de le retirer d'un ou plusieurs groupes.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1` (Pour créer des groupes et assigner des permissions critiques)
- **Compte Admin :** `admintest1` (Pour gérer les utilisateurs dans les groupes)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** C'est une modification majeure de l'architecture. Inspirez-vous des relations existantes dans SQLAlchemy (ex: `Deposit` et `User`) pour créer les nouvelles relations many-to-many. Procédez par petites étapes et testez chaque point d'API un par un avant de construire l'interface utilisateur.

## 6. Notes Techniques

-   C'est une story fondamentale qui impacte l'architecture de la sécurité. Elle nécessite des modifications importantes de la base de données (plusieurs migrations Alembic).
-   Le décorateur de dépendance `Depends` de FastAPI sera utilisé pour créer des vérifications de permission réutilisables (ex: `Depends(require_permission("caisse.access"))`).
-   Le chargement des permissions d'un utilisateur doit être optimisé (ex: mis en cache ou chargé une seule fois lors de la connexion et inclus dans le token JWT) pour éviter des requêtes BDD à chaque appel d'API.
-   L'interface utilisateur doit être claire pour bien distinguer la gestion des rôles (qui reste en place) de la gestion des groupes/permissions.
