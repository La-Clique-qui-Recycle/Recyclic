# Epic: Gestion Centralisée des Catégories de Produits

**ID:** EPIC-CATEGORIES
**Titre:** Gestion Centralisée des Catégories de Produits
**Statut:** Défini
**Priorité:** P0 (Bloquant)

---

## 1. Objectif de l'Epic

Créer un système centralisé et dynamique pour la gestion des catégories de produits, accessible via une interface d'administration et utilisé par les modules de Réception et de Caisse. L'objectif est d'éliminer les listes de catégories codées en dur, de garantir la cohérence des données à travers toute l'application, et de permettre une gestion flexible par les SuperAdmins.

## 2. Description

Actuellement, les modules de Réception et de Caisse utilisent des listes de catégories différentes et statiques. Cette incohérence empêche une analyse correcte des flux de matière et rend la maintenance difficile. Cet epic met en place une source de vérité unique pour les catégories.

## 3. Stories de l'Epic

Cet epic est composé des 3 stories suivantes, qui doivent être exécutées dans l'ordre :

1.  **Story 1 (Backend) :** API pour la Gestion des Catégories (CRUD).
2.  **Story 2 (Frontend) :** Interface d'Administration pour les Catégories.
3.  **Story 3 (Refactoring) :** Intégration des Catégories Dynamiques dans les Modules de Réception et de Caisse.

## 4. Risques et Plan de Rollback

- **Risque Principal :** La migration des données existantes (si des tickets ont déjà été créés avec les anciennes catégories) devra être gérée avec soin.
- **Mitigation :** Un script de migration devra être écrit pour mapper les anciennes catégories vers les nouvelles.
- **Plan de Rollback :** Les nouvelles fonctionnalités seront activées via un feature flag si nécessaire.

## 5. Definition of Done (pour l'Epic)

- [ ] Les 3 stories sont terminées et validées.
- [ ] Un SuperAdmin peut créer, lire, modifier et supprimer des catégories.
- [ ] Les modules de Réception et de Caisse utilisent les catégories provenant de l'API.
