# UI/UX Refactor Specification: Refonte du Tableau de Bord d'Administration

**Version:** 1.0
**Date:** 2025-10-08
**Auteur:** Sally (UX Expert)
**Contexte:** Ce document fait suite à l'analyse de la page `/admin` existante et aux retours de l'agent PO. Il a pour objectif de fournir un plan de refonte clair pour résoudre les problèmes de layout et d'organisation.

---

## 1. Problème à Résoudre

La page d'administration actuelle (`Admin/Dashboard.tsx`) est une longue liste verticale qui oblige l'utilisateur à scroller. Elle manque de structure thématique, ce qui la rend peu intuitive. L'objectif est de la transformer en un véritable tableau de bord, compact et organisé.

---

## 2. Solution de Design : Un Hub d'Administration en Grille

La page sera réorganisée en une grille sur 2 colonnes, avec des cartes regroupant les liens par thèmes fonctionnels. Chaque lien doit pointer vers le composant page existant correspondant.

### Colonne 1 : CONFIGURATION DU SYSTÈME
*(Regroupe les réglages et la configuration des données de base.)*

**Carte 1 : GESTION DES ACCÈS**
- **Description :** "Gérer les comptes utilisateurs, leurs rôles et les inscriptions en attente."
- **Liens :**
    - `Utilisateurs` (doit pointer vers la page `Users.tsx`)
    - `Utilisateurs en attente` (doit pointer vers la page `PendingUsers.tsx`)

**Carte 2 : GESTION DU CATALOGUE & DES SITES**
- **Description :** "Configurer les objets (catégories, prix), les sites et les postes de caisse."
- **Liens :**
    - `Catégories & Prix` (doit pointer vers la page `Categories.tsx`)
    - `Sites de collecte` (doit pointer vers la page `Sites.tsx`)
    - `Postes de caisse` (doit pointer vers la page `CashRegisters.tsx`)

### Colonne 2 : SUPERVISION & OPÉRATIONS
*(Regroupe la surveillance de l'activité et les réglages avancés.)*

**Carte 3 : RAPPORTS & JOURNAUX**
- **Description :** "Consulter les rapports de ventes, de réception et les journaux d'activité."
- **Liens :**
    - `Rapports Généraux` (doit pointer vers la page `Reports.tsx`)
    - `Rapports de Réception` (doit pointer vers la page `ReceptionReports.tsx`)
    - `Détail des Sessions de Caisse` (doit pointer vers la page `CashSessionDetail.tsx`)

**Carte 4 : TABLEAUX DE BORD & SANTÉ**
- **Description :** "Visualiser l'état des différents modules en temps réel."
- **Liens :**
    - `Dashboard de Réception` (doit pointer vers la page `ReceptionDashboard.tsx`)
    - `Dashboard de Santé Système` (doit pointer vers la page `HealthDashboard.tsx`)

**Carte 5 : PARAMÈTRES GÉNÉRAUX**
- **Description :** "Accéder aux réglages avancés de l'application."
- **Lien :** `Paramètres` (doit pointer vers la page `Settings.tsx`)

---

## 3. Instructions pour le Développement

1.  **Modifier le Fichier Principal :** Le travail principal se situe dans le fichier `frontend/src/pages/Admin/Dashboard.tsx` (ou `DashboardHomePage.jsx`).
2.  **Implémenter la Grille :** Remplacer la structure de liste verticale par un layout en grille à 2 colonnes (utiliser CSS Grid ou Flexbox).
3.  **Créer les Cartes :** Pour chaque regroupement thématique, créer un composant "Carte" qui contient le titre, la description et la liste des liens.
4.  **Mapper les Liens :** S'assurer que chaque lien dans les cartes pointe vers la bonne route de l'application, correspondant aux composants `.tsx` identifiés.
5.  **Assurer la Responsivité :** La grille doit s'adapter sur les écrans plus petits (par exemple, passer à une seule colonne sur mobile).
