---
story_id: 2.1
epic_id: 2
title: "Commande /depot et Enregistrement Vocal"
status: Ready
---

### User Story

**En tant que** bénévole sur le terrain,
**Je veux** utiliser la commande `/depot` sur Telegram et envoyer des enregistrements vocaux,
**Afin de** pouvoir enregistrer rapidement les objets entrants sans avoir à taper de longues descriptions.

### Critères d'Acceptation

1.  La commande `/depot` sur Telegram active une session d'enregistrement pour un utilisateur autorisé.
2.  Le bot accepte les messages vocaux (formats supportés : ogg, mp3, wav).
3.  L'audio est sauvegardé dans un stockage de fichiers (volume Docker local pour commencer).
4.  Le chemin vers le fichier audio est enregistré en base de données dans une nouvelle table `Deposit` avec un statut initial `pending_audio`.
5.  Une session d'enregistrement expire automatiquement après 5 minutes d'inactivité.
6.  Le bot gère correctement les erreurs (format non supporté, fichier trop volumineux, utilisateur non autorisé).

---

### Dev Notes

#### Contexte

Cette story est la porte d'entrée du workflow d'IA. Elle se concentre sur la partie "acquisition de la donnée" (le fichier audio) via le bot Telegram.

#### Références Architecturales Clés

-   **Workflow de Dépôt**: Le diagramme de séquence dans `docs/architecture/architecture.md` (Section 8) est la référence principale.
-   **Modèle de Données `Deposit`**: `docs/architecture/architecture.md` (Section 5) décrit le modèle de données `Deposit` à créer.

#### Implémentation Technique

-   **Gestion de Conversation**: La bibliothèque `python-telegram-bot` fournit des `ConversationHandler` qui sont parfaits pour gérer le flux en plusieurs étapes : `/depot` -> attente du message vocal -> fin.
-   **Stockage Fichiers**: Pour cette story, un simple stockage dans un volume Docker est suffisant. Le chemin du fichier sera une chaîne de caractères.
-   **Communication Bot-API**: Le bot doit appeler l'API backend pour créer l'enregistrement du dépôt en base de données.

---

### Tasks / Subtasks

#### Partie Backend (API)

1.  **Créer le modèle et la migration pour `Deposit` :**
    -   Dans `api/src/recyclic_api/models/`, créer un fichier `deposit.py` avec le modèle SQLAlchemy `Deposit`.
    -   Le modèle doit inclure au minimum : `id`, `user_id`, `audio_file_path`, `status` (avec un Enum `DepositStatus`), `created_at`.
    -   Mettre à jour `api/src/recyclic_api/models/__init__.py`.
    -   Générer une migration Alembic pour créer la table `deposits`.

2.  **Créer l'endpoint de création de dépôt :**
    -   Créer un nouveau fichier de routeur `api/src/recyclic_api/api/api_v1/endpoints/deposits.py`.
    -   Y créer un endpoint `POST /deposits` qui accepte un `user_id` et un `audio_file_path`.
    -   Cet endpoint doit créer une nouvelle entrée dans la table `Deposit` avec le statut `pending_audio`.
    -   Sécuriser cet endpoint pour qu'il ne soit accessible que par le service du bot (ex: via un token de service partagé).

#### Partie Bot (Telegram)

3.  **Créer le `ConversationHandler` pour le dépôt :**
    -   Dans `bot/src/handlers/`, créer un nouveau fichier `depot.py`.
    -   Y définir un `ConversationHandler` qui se déclenche sur la `CommandHandler('depot')`.
    -   Le premier état doit demander à l'utilisateur d'envoyer son fichier audio.
    -   Le deuxième état doit être un `MessageHandler` qui filtre les messages vocaux (`filters.VOICE`).

4.  **Gérer le Fichier Audio :**
    -   Dans le `MessageHandler`, télécharger le fichier audio reçu.
    -   Le sauvegarder dans un répertoire partagé via un volume Docker (ex: `/app/media`).
    -   Appeler l'endpoint `POST /deposits` de l'API avec l'ID de l'utilisateur et le chemin du fichier sauvegardé.

5.  **Finaliser la Conversation :**
    -   Après l'appel à l'API, envoyer un message de confirmation à l'utilisateur (ex: "Audio reçu, en cours de traitement...").
    -   Terminer la conversation avec `ConversationHandler.END`.
    -   Implémenter le timeout de 5 minutes.

#### Tests

6.  **Ajouter les Tests :**
    -   **Backend**: Tests d'intégration pour l'endpoint `POST /deposits`.
    -   **Bot**: Tests unitaires pour le `ConversationHandler`, en mockant le téléchargement de fichier et l'appel à l'API.
