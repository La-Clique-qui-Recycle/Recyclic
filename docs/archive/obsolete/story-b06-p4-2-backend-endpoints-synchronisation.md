# Story (Backend): Implémentation des Endpoints de Synchronisation sur le Serveur Central

**ID:** STORY-B06-P4
**Titre:** Implémentation des Endpoints de Synchronisation sur le Serveur Central
**Epic:** Architecture Hybride avec Synchronisation Offline
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur Backend,  
**Je veux** implémenter les endpoints API sur le serveur central nécessaires pour recevoir et traiter les données envoyées par les serveurs locaux,  
**Afin de** permettre la synchronisation des données collectées en mode offline.

## Contexte

Cette story implémente la partie "réception" de la synchronisation. Elle s'appuie sur le document de design technique produit par la story `STORY-B06-P4`.

## Critères d'Acceptation

1.  Un nouvel endpoint `POST /api/v1/sync/push` est créé.
2.  Cet endpoint est protégé par un mécanisme d'authentification spécifique aux serveurs locaux (ex: clé d'API statique).
3.  L'endpoint accepte un payload contenant un lot de données à synchroniser (ex: nouvelles lignes de réception, tickets fermés), conformément au protocole défini dans le document de design.
4.  La logique de l'endpoint traite les données reçues : insertion des nouvelles données, mise à jour des données existantes, en respectant la stratégie de résolution de conflits définie.
5.  L'endpoint retourne une réponse claire indiquant le succès ou l'échec de la synchronisation pour chaque entité du lot.
6.  Des tests d'intégration sont écrits pour valider le fonctionnement de l'endpoint, en suivant la `testing-strategy.md`.

## Notes Techniques

-   **Dépendance :** Cette story dépend de la story `STORY-B06-P4` (Architecture & Design).
-   **Transactions :** Le traitement du lot de données doit être transactionnel. Si une partie du lot échoue, l'ensemble de la transaction doit être annulé (rollback) pour éviter les données partielles.
-   **Validation :** Les données reçues doivent être validées rigoureusement (schémas Pydantic) avant d'être traitées.

## Definition of Done

- [ ] L'endpoint `POST /api/v1/sync/push` est fonctionnel et sécurisé.
- [ ] Le traitement des données est transactionnel et respecte la stratégie de résolution de conflits.
- [ ] Des tests d'intégration couvrent les cas de succès et d'échec.
- [ ] La story a été validée par le Product Owner.
