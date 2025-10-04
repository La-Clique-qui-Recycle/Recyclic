# Epic (Consolidation): Finalisation de la Migration des Catégories

**ID:** EPIC-CONSOLIDATE-CATEGORIES
**Titre:** Finalisation de la Migration vers les Catégories Unifiées
**Statut:** Terminé
**Priorité:** P0 (Critique)

---

## 1. Objectif de l'Epic

Éradiquer complètement l'ancien système de catégories (`dom_category`) et faire en sorte que 100% de l'application (Réception, Caisse, Stats) utilise le nouveau système centralisé (`categories`), afin de garantir la cohérence des données et de stabiliser l'application.

## 2. Description

Un audit a révélé que la migration vers le nouveau système de catégories (initiée dans l'epic B09) est incomplète. Deux systèmes coexistent, créant des conflits et des bugs critiques, notamment dans le module de Caisse. Cet epic a pour but de terminer cette migration, de consolider la base de code sur une source de vérité unique, et de payer cette dette technique majeure.

## 3. Stories de l'Epic

Cet epic est composé de 5 stories séquentielles :

1.  **Story 1 (Backend) :** Faire Évoluer le Modèle de Catégories pour la Hiérarchie.
2.  **Story 2 (Migration) :** Migrer les Données de `dom_category` vers `categories`.
3.  **Story 3 (Refactoring) :** Mettre à Jour les Modules Réception et Stats.
4.  **Story 4 (Refactoring) :** Connecter le Module Caisse.
5.  **Story 5 (Nettoyage) :** Supprimer l'Ancien Modèle `dom_category`.

## 4. Definition of Done (pour l'Epic)

- [x] Les 5 stories sont terminées et validées.
- [x] L'ancien modèle `dom_category` et ses dépendances ont été complètement supprimés du code.
- [x] Tous les modules (Caisse, Réception, Stats, Admin) utilisent la nouvelle table `categories` via son API.
- [x] L'application est stable et toutes les fonctionnalités liées aux catégories sont opérationnelles.
