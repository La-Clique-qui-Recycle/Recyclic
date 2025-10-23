# Epic b34: Rattrapage et Sécurisation Post-IAM

**Version:** 1.0
**Statut:** Ouvert
**PO:** Sarah

## 1. Contexte et Objectif

Suite à la finalisation de l'Épique b33 (Refonte IAM), plusieurs bugs bloquants et incohérences ont été découverts lors des tests en conditions réelles. Cet Épique de "rattrapage" vise à corriger ces problèmes critiques, à renforcer la sécurité (notamment sur la gestion des emails), et à clarifier la gestion des permissions pour les différents rôles, afin de rendre la plateforme stable et utilisable.

## 2. Stories Constitutives

Ce batch `b34` est composé des stories suivantes, priorisées par criticité :

- **[b34-p1: Audit et Refonte des Permissions d'Accès](./../stories/story-b34-p1-audit-permissions.md)**
  - **Description:** Mener un audit complet des routes frontend et backend pour documenter et implémenter une matrice de permissions claire (qui peut voir quoi), en particulier pour le rôle "Bénévole".

- **[b34-p2: Correction des Erreurs 404 sur la Page Profil](./../stories/story-b34-p2-fix-profile-404.md)**
  - **Description:** Diagnostiquer et corriger les erreurs 404 qui se produisent lors de la sauvegarde des informations, du mot de passe et du PIN sur la page `/profile`.

- **[b34-p3: Sécurisation de l'Email Utilisateur](./../stories/story-b34-p3-securisation-email.md)**
  - **Description:** Forcer l'unicité de l'adresse email dans la base de données et gérer les erreurs associées pour empêcher la création de comptes multiples avec le même email.

- **[b34-p4: Fiabilisation de la Récupération de Mot de Passe](./../stories/story-b34-p4-fiabilisation-reset-password.md)**
  - **Description:** S'assurer que le service d'envoi d'email est correctement connecté à la fonctionnalité "Mot de passe oublié" et que les emails partent réellement.

- **[b34-p5: Interface de Suivi des Emails](./../stories/story-b34-p5-interface-suivi-emails.md)**
  - **Description:** Créer une interface dans l'administration pour visualiser les logs des emails transactionnels envoyés par le système.

- **[b34-p6: Nettoyage des Rôles Utilisateur](./../stories/story-b34-p6-nettoyage-roles.md)**
  - **Description:** Supprimer le rôle `MANAGER` et renommer `UTILISATEUR` en `BÉNÉVOLE` sur l'ensemble de la plateforme (backend et frontend).

- **[b34-p7: Implémentation du Logout Audité](./../stories/story-b34-p7-logout-audite.md)**
  - **Description:** Créer un endpoint de déconnexion qui enregistre l'événement dans le journal d'audit et déconnecter l'utilisateur côté client.