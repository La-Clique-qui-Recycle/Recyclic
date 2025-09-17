# Epic 3 : Gestion Administrative

## Objectif de l'Epic

Fournir une interface d'administration sécurisée pour gérer les utilisateurs, leurs rôles et leurs inscriptions, garantissant un contrôle d'accès adéquat et une gestion centralisée des utilisateurs de la plateforme Recyclic.

## Description de l'Epic

Cet epic permet aux administrateurs de gérer efficacement les utilisateurs de la plateforme, d'approuver ou rejeter les demandes d'inscription, et de maintenir un système de rôles sécurisé.

## Stories

### Story 3.1 : Création du Super-Admin et Modèle de Rôles

**Titre** : Mettre en place le système de rôles et créer le premier super-admin.

**Description** : Mettre à jour le modèle `User` pour inclure un champ `role` et un champ `status`. Créer une commande CLI `create-super-admin` qui prend un email/id et un mot de passe (si nécessaire) pour créer le premier utilisateur avec le rôle `super-admin`.

**Critères d'Acceptation :**
- [x] Modèle `User` étendu avec champ `role` (user, admin, super-admin)
- [x] Champ `status` pour le statut d'inscription (pending, approved, rejected)
- [x] Commande CLI `create-super-admin` fonctionnelle
- [x] Migration Alembic pour les nouveaux champs
- [x] Tests unitaires pour le système de rôles

### Story 3.2 : API et Interface d'Administration pour la Gestion des Utilisateurs

**Titre** : Développer l'API et l'interface pour lister et modifier les utilisateurs.

**Description** : Créer les endpoints API sécurisés pour lister les utilisateurs et modifier leur rôle. Développer l'interface frontend correspondante où un admin peut voir la liste des utilisateurs et changer leur rôle via un menu déroulant.

**Critères d'Acceptation :**
- [x] Endpoints API sécurisés sous `/api/v1/admin/`
- [x] Interface admin pour lister tous les utilisateurs
- [x] Fonctionnalité de modification des rôles
- [x] Protection des endpoints avec `require_role("admin")`
- [x] Interface responsive et intuitive

### Story 3.3 : API et Interface pour la Validation des Inscriptions

**Titre** : Mettre en place la gestion des demandes d'inscription.

**Description** : Créer les endpoints API pour lister les utilisateurs avec un statut "en attente" et pour approuver ou rejeter leur inscription. Développer la section correspondante dans l'interface d'administration.

**Critères d'Acceptation :**
- [x] Interface admin listant les demandes d'inscription en attente
- [x] Boutons Approuver/Rejeter avec notification Telegram
- [x] Utilisateur approuvé ajouté à whitelist Telegram active
- [x] Notification automatique aux autres admins
- [x] Logs audit complets (qui a validé qui et quand)

## Exigences de Compatibilité

- [x] Les APIs existantes doivent rester inchangées et fonctionnelles
- [x] Les changements de schéma de base de données doivent être rétrocompatibles et gérés via des migrations Alembic
- [x] Les changements dans l'interface utilisateur doivent suivre les patterns et le guide de style existants
- [ ] L'impact sur les performances doit être minimal

## Atténuation des Risques

**Risque principal** : Accès non autorisé aux fonctionnalités d'administration.

**Atténuation** : Mettre en place une autorisation stricte basée sur les rôles pour tous les endpoints de l'API d'administration en utilisant des dépendances comme `require_role("admin")`. Des tests d'intégration approfondis seront écrits pour vérifier la sécurité.

**Plan de retour en arrière** : Les changements seront introduits via des feature flags si nécessaire. Les migrations de base de données auront des scripts de `downgrade` pour annuler les changements.

## Définition de "Terminé" (Definition of Done)

- [ ] Toutes les stories sont terminées et leurs critères d'acceptation sont remplis
- [ ] Les fonctionnalités existantes ont été vérifiées par des tests de régression
- [ ] Les points d'intégration fonctionnent correctement
- [ ] La documentation de l'API (Swagger/OpenAPI) est mise à jour pour les nouveaux endpoints
- [ ] Aucune régression n'est introduite dans les fonctionnalités existantes
