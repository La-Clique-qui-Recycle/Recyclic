# Story Technique: Cache Redis pour les Sessions de Validation

- **Statut**: Draft
- **Type**: Dette Technique
- **Priorité**: Moyenne
- **Epic**: 4 - Bot IA & Classification

---

## Story

**En tant que** Architecte,
**Je veux** utiliser un cache Redis pour gérer les sessions de validation du bot Telegram,
**Afin de** découpler la gestion de l'état de la mémoire du processus du bot et d'améliorer la scalabilité.

---

## Contexte

Cette story est une suite de la story 4.3. Le rapport de QA a recommandé d'utiliser Redis pour les sessions de validation, ce qui est une pratique plus robuste que la gestion en mémoire.

---

## Critères d'Acceptation

1.  La bibliothèque `python-telegram-bot` est configurée pour utiliser Redis comme backend de persistance pour les `ConversationHandler`.
2.  Les données de session de validation (ex: l'ID du dépôt en cours de validation) sont stockées dans Redis.
3.  Le système est résilient à un redémarrage du service du bot (c'est-à-dire qu'une conversation de validation peut reprendre là où elle s'est arrêtée).
4.  La configuration de la connexion à Redis est gérée via des variables d'environnement.

---

## Dev Notes

- **Source**: Recommandation du rapport de QA de la story 4.3.
- **Implémentation**: La classe `PicklePersistence` de `python-telegram-bot` peut être configurée pour utiliser un backend Redis. Il faudra peut-être une implémentation personnalisée si la persistance par défaut n'est pas suffisante.
