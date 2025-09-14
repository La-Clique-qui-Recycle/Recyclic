# Story 3.3: API et Interface pour la Validation des Inscriptions

- **Statut**: Ready
- **Type**: Feature
- **Priorité**: Haute
- **Dépend de**: story-3.2

---

## Story

**En tant qu**'administrateur,
**Je veux** une interface pour voir et gérer les demandes d'inscription en attente,
**Afin de** pouvoir approuver ou rejeter les nouveaux utilisateurs de manière sécurisée et tracée.

---

## Critères d'Acceptation

1.  Une nouvelle section "Demandes d'inscription" est ajoutée à l'interface d'administration.
2.  Cette section liste tous les utilisateurs ayant le statut `pending`.
3.  Pour chaque utilisateur en attente, l'admin peut cliquer sur "Approuver" ou "Rejeter".
4.  **Approuver** un utilisateur change son statut à `approved` et envoie une notification de bienvenue sur Telegram.
5.  **Rejeter** un utilisateur change son statut à `rejected`.
6.  Toutes les actions (approbation, rejet) sont enregistrées dans un log d'audit (qui, quoi, quand).
7.  Une notification est envoyée aux autres administrateurs lorsqu'une inscription est traitée.

---

## Tâches / Sous-tâches

- [ ] **Backend (API)**:
    - [ ] Créer un endpoint GET `/api/v1/admin/users/pending` qui retourne la liste des utilisateurs avec le statut `pending`.
    - [ ] Créer un endpoint POST `/api/v1/admin/users/{user_id}/approve` qui change le statut de l'utilisateur à `approved`.
    - [ ] Créer un endpoint POST `/api/v1/admin/users/{user_id}/reject` qui change le statut de l'utilisateur à `rejected`.
    - [ ] Sécuriser ces trois endpoints pour qu'ils ne soient accessibles qu'aux utilisateurs avec le rôle `admin`.
    - [ ] Implémenter la logique pour envoyer une notification Telegram lors de l'approbation.
    - [ ] Mettre en place le logging d'audit pour chaque action.
- [ ] **Frontend (UI)**:
    - [ ] Créer une nouvelle page ou un nouvel onglet dans la section d'administration pour lister les inscriptions en attente.
    - [ ] Afficher la liste des utilisateurs en attente avec leurs informations pertinentes.
    - [ ] Ajouter les boutons "Approuver" et "Rejeter" pour chaque utilisateur.
    - [ ] Lier ces boutons aux nouveaux endpoints de l'API.
- [ ] **Tests**:
    - [ ] Tests unitaires pour les nouveaux endpoints de l'API.
    - [ ] Tests d'intégration pour le workflow complet de validation.
    - [ ] Tests pour les nouveaux composants de l'interface.

---

## Dev Notes

### Références Architecturales Clés
- **Modèle de données User**: `docs/architecture/architecture.md` (Section 5)
- **Stratégie de Sécurité (RBAC)**: `docs/architecture/architecture.md` (Section 9.2)
- **Bot Telegram**: `docs/architecture/architecture.md` (Section 4)

### Implémentation du Logging d'Audit

Pour répondre au critère d'acceptation #6, il est recommandé de créer une nouvelle table `AuditLog` dans la base de données avec les colonnes suivantes : `id`, `timestamp`, `admin_user_id`, `target_user_id`, `action` (ex: 'approve_user', 'reject_user'), `details` (JSONB).

### Notifications Telegram

Le service du bot Telegram doit exposer une fonction (ex: `send_notification(user_id, message)`) que l'API peut appeler. L'implémentation exacte de cette communication inter-services devra être définie.
