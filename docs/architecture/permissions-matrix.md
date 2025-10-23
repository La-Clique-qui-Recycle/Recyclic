# Matrice de Permissions de l'Application Recyclic

**Version:** 1.0
**Date:** 2025-10-22

## 1. Objectif

Ce document définit les règles d'accès pour chaque route (page) de l'application frontend. Il sert de référence pour l'implémentation des `ProtectedRoutes` et la configuration dynamique des menus de navigation.

## 2. Rôles et Permissions

- **Public :** Accessible à tous, même non authentifié.
- **Utilisateur Connecté :** Nécessite une authentification valide, quel que soit le rôle.
- **Bénévole (`user`) :** Rôle de base pour les utilisateurs authentifiés.
- **Admin (`admin`) :** Accès à la plupart des fonctionnalités d'administration.
- **Super Admin (`super-admin`) :** Accès à toutes les fonctionnalités, y compris les paramètres critiques.
- **Permission Spécifique :** Droits granulaires qui peuvent être assignés à des groupes (ex: `caisse.access`).

## 3. Matrice des Routes

| Route (URL) | Page | Accès Requis | Notes |
| :--- | :--- | :--- | :--- |
| `/login` | Connexion | **Public** | Page de connexion. |
| `/signup` | Inscription | **Public** | Page de création de compte. |
| `/forgot-password` | Mot de passe oublié | **Public** | Processus de récupération de mot de passe. |
| `/reset-password` | Réinitialiser le mot de passe | **Public** | Page cible du lien de réinitialisation. |
| `/telegram-auth` | Authentification Telegram | **Public** | Page de liaison de compte Telegram. |
| `/` | Dashboard Principal | **Utilisateur Connecté** | Page d'accueil après connexion. À définir (dashboard bénévole ou admin). |
| `/profil` | Mon Profil | **Utilisateur Connecté** | Page de gestion de son propre profil. |
| `/caisse` | Dashboard Caisse | Permission: `caisse.access` | Accès au module de caisse. |
| `/cash-register/session/open` | Ouvrir une session | Permission: `caisse.access` | |
| `/cash-register/sale` | Écran de Vente | Permission: `caisse.access` | Mode Kiosque. |
| `/cash-register/session/close`| Fermer une session | Permission: `caisse.access` | |
| `/reception` | Dashboard Réception | Permission: `reception.access` | Accès au module de réception. |
| `/reception/ticket` | Créer/Modifier un ticket | Permission: `reception.access` | Mode Kiosque. |
| `/reception/ticket/:id` | Créer/Modifier un ticket | Permission: `reception.access` | Mode Kiosque. |
| `/reception/ticket/:id/view`| Voir un ticket | Permission: `reception.access` | Mode Kiosque. |
| `/depots` | Mes Dépôts | **Utilisateur Connecté** | Historique des dépôts de l'utilisateur. |
| `/rapports` | Mes Rapports | **Utilisateur Connecté** | Rapports personnels de l'utilisateur. |

### 3.1. Routes d'Administration (`/admin`)

Toutes les routes sous `/admin` nécessitent au minimum le rôle **Admin**.

| Route (URL) | Page | Accès Spécifique | Notes |
| :--- | :--- | :--- | :--- |
| `/admin` | Accueil Admin | **Admin** | Page d'accueil de l'administration. |
| `/admin/dashboard` | Dashboard Caisse (legacy) | **Admin** | |
| `/admin/cash-sessions/:id` | Détail Session Caisse | **Admin** | |
| `/admin/reception-stats` | Stats Réception | **Admin** | |
| `/admin/reception-reports`| Rapports Réception | **Admin** | |
| `/admin/users` | Gestion des Utilisateurs | **Admin** | |
| `/admin/pending` | Utilisateurs en attente | **Admin** | |
| `/admin/session-manager` | Gestionnaire de Sessions | **Admin** | |
| `/admin/cash-registers` | Gestion des Postes de Caisse | **Admin** | |
| `/admin/sites` | Gestion des Sites | **Admin** | |
| `/admin/health` | Santé du Système | **Admin** | |
| `/admin/categories` | Gestion des Catégories | **Admin** | Accès plus fin possible via permissions. |
| `/admin/groups` | Gestion des Groupes | **Admin** | |
| `/admin/audit-log` | Journal d'Audit | **Admin** | |
| `/admin/settings` | Paramètres Généraux | **Super Admin** | Accès réservé aux Super Admins. |
