# Epic: Construction du Dashboard d'Administration Centralisé

**ID:** EPIC-ADMIN-DASHBOARD
**Titre:** Construction du Dashboard d'Administration Centralisé
**Statut:** Terminé

---

## 1. Objectif de l'Epic

Créer une section d'administration centralisée et cohérente, accessible via une page d'accueil `/admin`. Ce hub servira de tableau de bord et de point d'entrée unique pour toutes les fonctionnalités de gestion (utilisateurs, sites, postes de caisse, etc.), améliorant ainsi l'ergonomie et la maintenabilité de l'application.

## 2. Description

### Contexte Existant
L'administration est actuellement fragmentée. L'accès se fait directement via des URLs spécifiques (ex: `/admin/users`), et il n'existe pas de page d'accueil pour la section d'administration. De plus, des fonctionnalités de gestion critiques comme la gestion des "Sites" sont manquantes, et les permissions pour les fonctionnalités existantes (comme la gestion des postes de caisse) sont incorrectes.

### Améliorations Proposées
Cet epic met en œuvre une véritable section d'administration avec :
1.  Une page d'accueil `/admin` servant de tableau de bord.
2.  Une navigation secondaire claire (menu latéral ou autre) pour accéder aux différentes sous-sections.
3.  La fonctionnalité de gestion des "Sites", qui est un prérequis pour la gestion des postes de caisse.
4.  La correction des permissions et l'intégration de la gestion des postes de caisse dans cette nouvelle structure.

## 3. Stories de l'Epic

Cet epic est composé des 3 stories suivantes :

1.  **Story 1 (UX/UI) :** Création de la Page d'Accueil de l'Administration (`/admin`) et de sa navigation.
2.  **Story 2 (Fonctionnalité) :** Implémentation de la gestion des Sites (CRUD).
3.  **Story 3 (Refactoring) :** Intégration et correction de la gestion des Postes de Caisse.

## 4. Risques et Plan de Rollback

- **Risque Principal :** Aucun risque majeur, car il s'agit principalement de la création de nouvelles fonctionnalités et de la réorganisation de l'existant.
- **Mitigation :** Tests manuels complets du nouveau parcours d'administration.
- **Plan de Rollback :** Revert des commits liés à l'epic en cas de problème.

## 5. Definition of Done (pour l'Epic)

- [x] Les 3 stories sont terminées et validées.
- [x] Un administrateur peut naviguer vers `/admin`, voir un tableau de bord, et accéder aux sous-sections.
- [x] La gestion des Sites et des Postes de Caisse est fonctionnelle et accessible depuis le nouveau dashboard.
- [ ] La documentation a été mise à jour pour refléter la nouvelle structure de l'administration.
