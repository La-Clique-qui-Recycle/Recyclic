# Story (Dette Technique): Suppression du Code Mort du Bot Telegram

**ID:** STORY-TECH-DEBT-B36-BOT-CLEANUP
**Titre:** [TECH-DEBT] Suppression du Code Mort et des Dépendances du Bot Telegram
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Basse)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** supprimer tout le code source (backend et frontend) lié au service du bot Telegram qui a été désactivé,
**Afin de** nettoyer la base de code, de réduire sa complexité et de faciliter la maintenance future.

## Contexte

Suite à la décision de désactiver le service du bot Telegram (story `STORY-B36-P3`), un audit a révélé que de nombreuses références à ce service (31 fichiers dans l'API, 80 dans le frontend) existent toujours dans le code. Ce code est maintenant "mort" et doit être supprimé pour maintenir une base de code saine.

## Acceptance Criteria

1.  Les services backend liés au bot (`telegram_service.py`, `telegram_link_service.py`, etc.) sont supprimés.
2.  Les endpoints API liés au bot sont supprimés.
3.  Les champs liés à Telegram (ex: `telegram_id`) sont supprimés des modèles de base de données et des schémas Pydantic, avec une migration Alembic pour appliquer les changements.
4.  La page frontend `TelegramAuth.jsx` et sa route sont supprimées.
5.  Tous les appels au service de notification Telegram dans le reste de l'application sont supprimés.

## Tasks / Subtasks

- [ ] **Nettoyage Backend :**
    - [ ] Supprimer les fichiers de service : `telegram_service.py`, `telegram_link_service.py`.
    - [ ] Supprimer les endpoints API liés au bot.
    - [ ] Modifier les modèles de données (ex: `User`) pour supprimer les champs `telegram_id`.
    - [ ] Créer une migration Alembic pour supprimer les colonnes correspondantes de la base de données.
    - [ ] Supprimer les schémas Pydantic et les références dans les autres services.
- [ ] **Nettoyage Frontend :**
    - [ ] Supprimer la page `frontend/src/pages/TelegramAuth.jsx`.
    - [ ] Supprimer la route correspondante dans `frontend/src/App.jsx`.
    - [ ] Nettoyer le store (`authStore.ts`) et les types générés des références à Telegram.
- [ ] **Validation :**
    - [ ] S'assurer que l'application continue de fonctionner parfaitement après ce nettoyage.
    - [ ] Lancer la suite de tests complète pour vérifier qu'aucune régression n'a été introduite.

## Dev Notes

-   Cette story est la suite logique de l'audit réalisé dans `STORY-B36-P3`.
-   C'est un travail de refactoring pur. L'objectif est de supprimer du code, pas d'en ajouter.

## Definition of Done

- [ ] Toutes les références au code du bot Telegram ont été supprimées de l'application.
- [ ] L'application est entièrement fonctionnelle après le nettoyage.
- [ ] La story a été validée par un agent QA.