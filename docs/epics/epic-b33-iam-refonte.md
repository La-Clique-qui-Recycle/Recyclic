# Epic b33: Refonte de l'Identité et de la Gestion des Accès (IAM)

**Version:** 1.0
**Statut:** Ouvert
**PO:** Sarah

## 1. Contexte et Objectif

Ce document définit un Épique Brownfield visant à refondre et à améliorer en profondeur la gestion des utilisateurs, de leurs accès et de leurs données au sein de la plateforme Recyclic. L'objectif est de corriger les bugs existants, de renforcer la sécurité, d'enrichir les profils pour mieux correspondre aux besoins de l'association (gestion des bénévoles), et de poser des fondations techniques saines pour les futures évolutions (permissions, modules de caisse/réception).

Cet Épique adresse des problèmes de sécurité, d'expérience utilisateur (pour les admins et les utilisateurs finaux) et de gouvernance des données.

## 2. Stories Constitutives

Ce batch `b33` est composé des 7 stories suivantes :

- **[b33-p1: Fiabiliser l'Historique Utilisateur](./../stories/story-b33-p1-fiabiliser-historique-utilisateur.md)**
  - **Description:** Corriger le bug d'affichage de l'historique des utilisateurs dans l'interface d'administration en le connectant à l'API réelle.

- **[b33-p2: Compléter les Profils Utilisateur](./../stories/story-b33-p2-completer-profils-utilisateur.md)**
  - **Description:** Enrichir le modèle utilisateur avec des champs nécessaires à la gestion des bénévoles (`téléphone`, `adresse`, `notes`, `compétences`, `disponibilités`) et les intégrer aux interfaces `/profile` et `/admin/users`.

- **[b33-p3: Afficher le Statut "En Ligne"](./../stories/story-b33-p3-afficher-statut-en-ligne.md)**
  - **Description:** Implémenter un indicateur visuel pour voir rapidement si un utilisateur est récemment actif sur la plateforme.

- **[b33-p4: Solidifier la Gestion des Mots de Passe](./../stories/story-b33-p4-solidifier-gestion-mots-de-passe.md)**
  - **Description:** Auditer et finaliser tous les flux de changement et de réinitialisation de mot de passe (public, admin, super-admin) pour garantir la sécurité et la fluidité.

- **[b33-p5: Mettre en place les Permissions par Groupes](./../stories/story-b33-p5-permissions-par-groupes.md)**
  - **Description:** Créer une architecture de permissions basée sur des groupes ("Équipe Caisse", etc.) pour simplifier la gestion des accès aux différents modules.

- **[b33-p6: Activer la Gestion du Code PIN](./../stories/story-b33-p6-activer-gestion-code-pin.md)**
  - **Description:** Mettre en place l'infrastructure permettant aux utilisateurs de gérer un code PIN personnel, en préparation du futur "fast user switching".

- **[b33-p7: Créer le Journal d'Audit Centralisé](./../stories/story-b33-p7-creer-journal-audit.md)**
  - **Description:** Développer une interface "tour de contrôle" pour que les admins puissent consulter et rechercher toutes les actions de gestion et de sécurité importantes sur la plateforme.
