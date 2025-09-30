# Story (Bug): Correction du Crash au Démarrage du Bot

**ID:** STORY-BUG-BOT-STARTUP
**Titre:** Correction du Crash au Démarrage du Bot Telegram
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)
**Statut:** Terminée

---

## User Story

**En tant que** mainteneur du système,
**Je veux** que le conteneur du bot Telegram démarre sans erreur,
**Afin que** les fonctionnalités d'interaction avec les utilisateurs, comme l'inscription, soient opérationnelles.

## Acceptance Criteria

1.  Le conteneur Docker `bot` doit démarrer et rester opérationnel sans planter.
2.  Les logs du conteneur `bot` ne doivent plus contenir l'erreur `TypeError: persistence must be based on telegram.ext.BasePersistence`.
3.  La classe `RedisPersistence` dans `bot/src/services/redis_persistence.py` DOIT hériter de `telegram.ext.BasePersistence`.

## Tasks / Subtasks

- [x] **Correction :** Dans le fichier `bot/src/services/redis_persistence.py`, ajouter l'importation : `from telegram.ext import BasePersistence`.
- [x] **Correction :** Dans le même fichier, modifier la définition de la classe pour qu'elle hérite de `BasePersistence` : `class RedisPersistence(BasePersistence):`.
- [x] **Validation :** Reconstruire l'image Docker du bot (`docker-compose up --build -d bot`).
- [x] **Vérification :** Inspecter les logs (`docker-compose logs bot`) pour confirmer que l'erreur de type a disparu et que le bot a démarré correctement.

## Dev Notes

-   **Cause Racine :** La classe `RedisPersistence` personnalisée n'hérite pas de la classe de base `BasePersistence` requise par la librairie `python-telegram-bot`, ce qui provoque une `TypeError` à l'initialisation.
-   **Fichiers Impactés :** `bot/src/services/redis_persistence.py` et `bot/src/main.py` (où l'erreur se manifeste).
-   **Risque :** Très faible. La modification est une mise en conformité avec la documentation de la librairie tierce.

## Definition of Done

- [x] Tous les critères d'acceptation sont remplis.
- [x] Le conteneur `bot` démarre et fonctionne de manière stable.
- [x] La correction a été validée par un agent QA.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References
None

### Completion Notes
- Successfully fixed the bot startup crash by making `RedisPersistence` inherit from `telegram.ext.BasePersistence`
- Added required import: `from telegram.ext import BasePersistence, PersistenceInput`
- Modified class definition: `class RedisPersistence(BasePersistence):`
- Implemented all required abstract methods: `drop_chat_data`, `drop_user_data`, `flush`, `get_conversations`, `refresh_bot_data`, `refresh_chat_data`, `refresh_user_data`
- Updated method signatures to match `BasePersistence` interface (e.g., `get_user_data()` now returns `Dict[int, Dict[str, Any]]` instead of taking user_id parameter)
- Added proper `PersistenceInput` configuration with `callback_data=False` to avoid ExtBot requirement
- Resolved Docker cache issue by force rebuilding container image
- **VERIFIED**: Container now starts successfully with logs showing "Application started" and no persistence errors
- All tasks completed successfully, original `TypeError: persistence must be based on telegram.ext.BasePersistence` error resolved

### File List
- `bot/src/services/redis_persistence.py` - Modified to inherit from BasePersistence and implement required methods

### Change Log
- **2025-09-24**: Fixed bot startup crash by implementing proper BasePersistence inheritance and required abstract methods