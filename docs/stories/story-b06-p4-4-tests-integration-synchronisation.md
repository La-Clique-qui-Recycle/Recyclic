# Story (Tests): Création d'une Suite de Tests d'Intégration pour la Synchronisation Offline

**ID:** STORY-B06-P4
**Titre:** Création d'une Suite de Tests d'Intégration pour la Synchronisation Offline
**Epic:** Architecture Hybride avec Synchronisation Offline
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur,  
**Je veux** créer une suite de tests d'intégration complète pour le mécanisme de synchronisation,  
**Afin de** garantir sa robustesse, de prévenir la perte de données et de valider le comportement en cas de déconnexion et de conflit.

## Contexte

La synchronisation de données est une fonctionnalité critique et à haut risque. Une suite de tests dédiée est indispensable pour la valider de manière fiable avant tout déploiement.

## Critères d'Acceptation

1.  Une nouvelle suite de tests d'intégration est créée (`api/tests/test_integration_sync.py`).
2.  Les tests simulent un environnement avec un serveur local et un serveur central.
3.  Les scénarios suivants sont couverts par des tests :
    -   **Cas Nominal :** Le serveur local est en ligne, crée des données, et les synchronise avec succès.
    -   **Cas Offline :** Le serveur local est hors ligne, accumule des données, puis se reconnecte et synchronise tout le lot en attente.
    -   **Cas d'Échec Partiel :** Le serveur local envoie un lot de données dont une partie est invalide. La transaction doit être annulée (rollback) et le lot doit être marqué comme échoué.
    -   **Cas de Conflit :** Un test simule un conflit de données (selon la stratégie définie dans le document de design) et vérifie que la résolution de conflit est appliquée correctement.
4.  Tous les tests de la suite passent avec succès.

## Notes Techniques

-   **Dépendance :** Cette story dépend de toutes les autres stories de l'epic.
-   **Mocks :** Utiliser des mocks pour simuler la connexion réseau (ex: `httpx.MockTransport`) et pour contrôler les moments où le Sync Agent peut atteindre le serveur central.
-   **Assertions :** Les tests doivent vérifier l'état des deux bases de données (locale et centrale) après chaque opération de synchronisation pour garantir la cohérence.

## Definition of Done

- [ ] La suite de tests d'intégration pour la synchronisation est créée.
- [ ] Les tests couvrent les scénarios nominaux, offline, d'échec et de conflit.
- [ ] Tous les tests passent.
- [ ] La story a été validée par le Product Owner.
