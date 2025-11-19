---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.162221
original_path: docs/stories/archive/bug-bot-container-import-error.md
---

# Bug: Le conteneur du bot ne démarre pas (ImportError)

- **Statut**: Done
- **Type**: Bug
- **Priorité**: Critique

---

## Description du Bug

Le conteneur Docker du service `bot` ne parvient pas à démarrer. Les logs indiquent une `ImportError` dans le fichier `src/main.py`.

**Erreur exacte :**
`ImportError: cannot import name 'setup_handlers' from 'src.handlers' (/app/src/handlers/__init__.py)`

Le point d'entrée de l'application bot essaie d'importer `setup_handlers` depuis le module `handlers`, mais ne le trouve pas, ce qui cause le crash du conteneur.

---

## Critères d'Acceptation

1.  La cause de l'erreur d'importation est identifiée et corrigée.
2.  Le conteneur Docker du service `bot` démarre avec succès et sans erreur.
3.  La solution n'introduit aucune régression dans le fonctionnement du bot.

---

## Tâches de Résolution

- [x] **Analyse du code du Bot**:
    - [x] Examiner le fichier `bot/src/handlers/__init__.py` pour voir quels noms sont exportés.
    - [x] Examiner les fichiers dans le dossier `bot/src/handlers/` pour trouver où la fonction `setup_handlers` est (ou devrait être) définie.
    - [x] Vérifier s'il y a une faute de frappe ou si la fonction a été renommée.
- [x] **Correction**:
    - [x] Si la fonction a été renommée, mettre à jour l'import dans `bot/src/main.py`.
    - [x] Si la fonction n'est pas exportée, l'ajouter dans `bot/src/handlers/__init__.py`.
    - [x] Si la fonction n'existe pas, la recréer en se basant sur la logique attendue (probablement l'enregistrement des différents `CommandHandler` et `MessageHandler` du bot).
- [x] **Validation**:
    - [x] Démarrer le conteneur du bot et vérifier qu'il n'y a plus d'erreur dans les logs.
    - [x] Exécuter les tests existants pour le bot pour s'assurer qu'aucune régression n'a été introduite.

---

## Dev Agent Record

### Résolution Effectuée
**Cause identifiée** : Conflit de noms entre le fichier `handlers.py` et le dossier `handlers/`. Python privilégie les packages (dossiers) aux modules (fichiers) lors des imports, causant l'erreur `ImportError: cannot import name 'setup_handlers'`.

**Solution appliquée** :
1. Renommage du fichier `bot/src/handlers.py` → `bot/src/bot_handlers.py`
2. Mise à jour des imports dans :
   - `bot/src/main.py` : `from .bot_handlers import setup_handlers`
   - `bot/src/webhook_server.py` : `from .bot_handlers import setup_handlers`

### Validation
- ✅ Le conteneur Docker du bot démarre maintenant sans erreur d'import
- ✅ Le message "Starting Recyclic Telegram Bot in polling mode..." apparaît dans les logs
- ✅ L'ImportError original est résolu

### Fichiers Modifiés
- `bot/src/handlers.py` → `bot/src/bot_handlers.py` (renommé)
- `bot/src/main.py` (import corrigé)
- `bot/src/webhook_server.py` (import corrigé)
- `bot/src/handlers/__init__.py` (nettoyé)

### Statut : ✅ Résolu

---

## QA Results

- Décision de Gate: PASS
- Justification: Conflit package/module résolu par renommage explicite et mise à jour des imports. Démarrage conteneur vérifié sans ImportError.
- Éléments de preuve: Logs de démarrage affichent le message d'init; absence d'exception d'import.
- Risques/Surveillances: Éviter la cohabitation d'un dossier et fichier du même nom; ajouter règle de lint ou convention de nommage.
- Suivis: Ajouter un check CI qui fail si un module et un package partagent le même nom.
- Relecteur QA: Quinn (Test Architect)
- Date: 2025-09-16
