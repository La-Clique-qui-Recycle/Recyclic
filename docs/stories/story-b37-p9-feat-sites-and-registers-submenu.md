# Story b37-p9: Feature: Créer une page de sous-menu pour "Sites & Caisses"

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Feature / Frontend

## 1. Contexte

Dans le nouveau dashboard admin, le bouton "Sites & Caisses" regroupe deux fonctionnalités distinctes mais liées. Pour offrir une navigation claire et cohérente avec les autres sections, il est nécessaire de créer une page intermédiaire qui servira de sous-menu pour ces deux options.

Cette approche est basée sur la recommandation de l'audit UX de Sally.

## 2. User Story (En tant que...)

En tant que **Super-Administrateur**, lorsque je clique sur le bouton "Sites & Caisses", je veux **arriver sur une page de sous-menu claire**, afin de pouvoir choisir facilement si je veux gérer les sites ou les postes de caisse.

## 3. Critères d'Acceptation

1.  Une nouvelle route et une nouvelle page DOIVENT être créées (ex: `/admin/sites-and-registers`).
2.  Le bouton "Sites & Caisses" sur le dashboard admin (`/admin`) DOIT maintenant pointer vers cette nouvelle route.
3.  La nouvelle page DOIT contenir un titre clair (ex: "Gestion des Sites et Caisses").
4.  La page DOIT contenir deux boutons ou cartes de navigation distincts et bien visibles :
    *   Un bouton "Gérer les Sites" qui pointe vers `/admin/sites`.
    *   Un bouton "Gérer les Postes de Caisse" qui pointe vers `/admin/cash-registers`.

## 4. Solution Technique Recommandée

-   **Routeur :** Ajouter la nouvelle route dans `frontend/src/App.jsx`.
-   **Composant :** Créer un nouveau composant pour cette page (ex: `frontend/src/pages/Admin/SitesAndRegistersPage.tsx`).
-   **Composant du Dashboard :** Mettre à jour le lien du bouton "Sites & Caisses" dans `frontend/src/pages/Admin/DashboardHomePage.jsx`.

## 5. Prérequis de Test

- Se connecter en tant que `super-admin` (`superadmintest1`).
- Aller sur la page `/admin`.
- Cliquer sur le bouton "Sites & Caisses".
- **Vérification :**
    - L'utilisateur doit être redirigé vers la nouvelle page de sous-menu.
    - La page doit contenir les deux boutons "Gérer les Sites" et "Gérer les Postes de Caisse".
    - Cliquer sur chacun de ces boutons doit mener à la page correspondante.
