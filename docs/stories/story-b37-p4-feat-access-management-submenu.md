# Story b37-p4: Feature: Créer une page de sous-menu pour "Utilisateurs & Groupes"

**Statut:** ❌ Annulée

**Note :** Cette story est annulée car la fonctionnalité de sous-menu sera intégrée directement dans une future refonte plus globale de la navigation admin.
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Feature / Frontend

## 1. Contexte

Dans le nouveau dashboard admin, le bouton "Utilisateurs & Groupes" regroupe deux fonctionnalités distinctes. Pour éviter toute ambiguïté et offrir une navigation claire, il est nécessaire de créer une page intermédiaire qui servira de sous-menu pour ces deux options.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, lorsque je clique sur le bouton "Utilisateurs & Groupes", je veux **arriver sur une page de sous-menu claire**, afin de pouvoir choisir facilement si je veux gérer les utilisateurs ou les groupes.

## 3. Critères d'Acceptation

1.  Une nouvelle route et une nouvelle page DOIVENT être créées (ex: `/admin/access-management`).
2.  Le bouton "Utilisateurs & Groupes" sur le dashboard admin (`/admin`) DOIT maintenant pointer vers cette nouvelle route.
3.  La nouvelle page DOIT contenir un titre clair (ex: "Gestion des Accès").
4.  La page DOIT contenir deux boutons ou cartes de navigation distincts et bien visibles :
    *   Un bouton "Gérer les Utilisateurs" qui pointe vers `/admin/users`.
    *   Un bouton "Gérer les Groupes" qui pointe vers `/admin/groups`.

## 4. Solution Technique Recommandée

-   **Routeur :** Ajouter la nouvelle route dans `frontend/src/App.jsx`.
-   **Composant :** Créer un nouveau composant pour cette page (ex: `frontend/src/pages/Admin/AccessManagementPage.tsx`).
-   **Composant du Dashboard :** Mettre à jour le lien du bouton "Utilisateurs & Groupes" dans `frontend/src/pages/Admin/DashboardHomePage.jsx`.

## 5. Prérequis de Test

- Se connecter en tant qu'admin (`admintest1`).
- Aller sur la page `/admin`.
- Cliquer sur le bouton "Utilisateurs & Groupes".
- **Vérification :**
    - L'utilisateur doit être redirigé vers la nouvelle page de sous-menu.
    - La page doit contenir les deux boutons "Gérer les Utilisateurs" et "Gérer les Groupes".
    - Cliquer sur chacun de ces boutons doit mener à la page correspondante.
