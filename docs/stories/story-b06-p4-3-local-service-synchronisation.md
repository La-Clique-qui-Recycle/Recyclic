# Story (Local Server): Développement du Service de Synchronisation (Sync Agent)

**ID:** STORY-B06-P4
**Titre:** Développement du Service de Synchronisation sur le Serveur Local (Sync Agent)
**Epic:** Architecture Hybride avec Synchronisation Offline
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur,  
**Je veux** développer un service de synchronisation (Sync Agent) qui tourne en arrière-plan sur le serveur local,  
**Afin de** détecter les nouvelles données, les mettre en file d'attente et les envoyer de manière fiable au serveur central.

## Contexte

Cette story implémente la partie "émission" de la synchronisation. Le Sync Agent est le cœur du fonctionnement en mode `local`. Il doit être résilient aux coupures de connexion.

## Critères d'Acceptation

1.  Un nouveau service (ou une tâche de fond) est créé et ne s'active que si l'application est en mode `local` (`APP_MODE=local`).
2.  Le service scanne périodiquement la base de données locale pour détecter les nouvelles données non synchronisées (en se basant sur un flag `is_synced` ou un timestamp `last_sync_at`).
3.  Les nouvelles données sont mises en file d'attente (ex: dans une table dédiée ou en mémoire avec persistance).
4.  Le service essaie d'envoyer la file d'attente à l'endpoint `POST /api/v1/sync/push` du serveur central.
5.  En cas d'échec de la connexion, le service attend et réessaie plus tard (avec une stratégie d'attente exponentielle - exponential backoff).
6.  Une fois les données synchronisées avec succès, elles sont marquées comme telles dans la base de données locale pour ne pas être renvoyées.

## Notes Techniques

-   **Dépendance :** Cette story dépend de la story `STORY-B06-P4` (Architecture & Design) et peut être développée en parallèle de `STORY-B06-P4` (Backend Endpoints) en utilisant un mock de l'API centrale.
-   **Robustesse :** Le Sync Agent doit être conçu pour gérer les redémarrages du serveur local sans perdre la file d'attente de synchronisation.
-   **Configuration :** L'URL du serveur central (`CENTRAL_API_URL`) et la clé d'API pour la synchronisation doivent être lues depuis les variables d'environnement.

## Definition of Done

- [ ] Le Sync Agent est fonctionnel et s'active uniquement en mode `local`.
- [ ] Le service détecte, met en file d'attente et envoie les données de manière fiable.
- [ ] La gestion des échecs de connexion et les tentatives ultérieures sont implémentées.
- [ ] La story a été validée par le Product Owner.
