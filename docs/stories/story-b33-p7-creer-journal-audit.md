# Story b33-p7: Créer le Journal d'Audit Centralisé

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Actuellement, les actions importantes des administrateurs et du système sont soit loggées dans des fichiers, soit dispersées dans les historiques individuels des utilisateurs. Il manque une "tour de contrôle" centralisée qui permettrait aux administrateurs d'avoir une vue d'ensemble de l'activité sur la plateforme, ce qui est essentiel pour la sécurité, la traçabilité et le diagnostic.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **accéder à un journal d'audit centralisé, consultable et filtrable** afin d'avoir une vision globale de toutes les actions de gestion et de sécurité importantes qui ont eu lieu sur la plateforme.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau modèle de données `AuditLog` DOIT être créé pour stocker les événements d'audit de manière structurée (ex: `timestamp`, `actor_id`, `actor_username`, `action_type`, `target_id`, `target_type`, `details_json`).
2.  Une fonction utilitaire `log_audit(action_type, actor, target, details)` DOIT être créée pour faciliter l'enregistrement d'événements depuis n'importe où dans le code.
3.  Les actions critiques existantes et futures DOIVENT être modifiées pour appeler cette fonction `log_audit`. Exemples à couvrir :
    -   Forçage de mot de passe (Story b33-p4).
    -   Réinitialisation de PIN (Story b33-p6).
    -   Changement de rôle ou de permissions (Story b33-p5).
    -   Création/suppression d'un utilisateur.
    -   Connexions réussies/échouées.
4.  Un nouveau point d'API `GET /v1/admin/audit-log` DOIT être créé pour récupérer les entrées du journal, avec des options de filtrage (par date, par type d'action, par acteur) et de pagination.

**Frontend (Admin) :**
5.  Une nouvelle page d'administration "Journal d'Audit" DOIT être créée.
6.  Cette page DOIT afficher les événements d'audit dans un tableau ou une liste, du plus récent au plus ancien.
7.  L'interface DOIT fournir des contrôles pour filtrer les événements par plage de dates, par type d'événement et/ou par administrateur ayant réalisé l'action.
8.  Une fonctionnalité de recherche simple (par ID de cible ou par détail) DOIT être implémentée.
9.  La pagination DOIT être gérée pour naviguer à travers un grand nombre d'événements.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1` (Pour générer des événements d'audit critiques et consulter le journal)
- **Compte Admin :** `admintest1` (Pour consulter le journal)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Commencez par définir le modèle `AuditLog` et la fonction `log_audit`. Vous pourrez ensuite l'intégrer dans les autres stories (S4, S5, S6) au fur et à mesure de leur développement. La page de consultation peut être développée en parallèle avec des données de test.

## 6. Notes Techniques

-   La table `AuditLog` peut potentiellement devenir très volumineuse. Une stratégie d'archivage ou de purge pourrait être envisagée à long terme, mais n'est pas dans le périmètre de cette story.
-   L'indexation de la base de données sur les colonnes fréquemment filtrées (`timestamp`, `action_type`, `actor_id`) sera cruciale pour les performances.
-   Le champ `details_json` offrira la flexibilité de stocker des contextes variés pour différents types d'événements (ex: `{"old_role": "USER", "new_role": "ADMIN"}` pour un changement de rôle).
-   Cette story a une forte dépendance avec les autres stories de l'Épique, car elle doit enregistrer les actions qui y sont définies.
