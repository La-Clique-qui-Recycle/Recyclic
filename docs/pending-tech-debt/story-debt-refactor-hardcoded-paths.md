---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.155743
original_path: docs/stories/story-debt-refactor-hardcoded-paths.md
---

# Story (Dette Technique): Remplacer les Chemins d'Accès Absolus

**ID:** STORY-DEBT-REFACTOR-PATHS
**Titre:** Remplacer les Chemins d'Accès Absolus par des Chemins Relatifs
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Normal)

---

## Objectif

**En tant que** Développeur,
**Je veux** que le code source et les scripts n'utilisent que des chemins relatifs ou des variables d'environnement,
**Afin de** garantir que le projet soit portable, robuste et utilisable par n'importe quel développeur sur n'importe quelle machine.

## Contexte

Plusieurs fichiers du projet contiennent des chemins d'accès absolus "en dur" (ex: `D:\Users\Strophe\...`). Cette pratique pose des problèmes majeurs :
- Le projet n'est pas portable et ne fonctionne que sur la machine où les chemins ont été définis.
- Tout changement dans l'arborescence des dossiers locaux (comme renommer un dossier parent) casse les scripts.
- Cela complique l'intégration continue et le déploiement.

Cette dette technique a été identifiée lors de la gestion de modifications locales suite à un renommage de dossier.

## Critères d'Acceptation

1.  Tous les chemins d'accès absolus dans les fichiers de code source et les scripts sont supprimés.
2.  Ils sont remplacés par des chemins relatifs (ex: `../scripts`, `./src`) ou par l'utilisation de variables d'environnement lorsque c'est pertinent.
3.  Les scripts et fonctionnalités impactés continuent de fonctionner comme attendu après la modification.
4.  Les fichiers suivants (et tout autre fichier découvert pendant la tâche) sont corrigés :
    - `api/start-api.bat`
    - `docs/qa/rollback-test-guide.md`
    - `test_cli.py`

## Definition of Done

- [x] Le refactoring est terminé et testé.
- [x] Le code est portable et ne contient plus de chemins absolus.
- [x] La story a été validée par le Product Owner.

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Recherche de chemins absolus avec grep
- Validation de la syntaxe des scripts modifiés
- Tests de fonctionnement des chemins relatifs

### Completion Notes List
- **api/start-api.bat** : Remplacé `D:\Users\Strophe\Documents\°IA\La Clique Qui Recycle\Recyclic\api\src` par `%~dp0src` (chemin relatif basé sur l'emplacement du script)
- **docs/qa/rollback-test-guide.md** : Remplacé `/mnt/d/Users/Strophe/Documents/°IA/La\ Clique\ Qui\ Recycle/Recyclic/` par `"$(dirname "$0")/../.."` et `/path/to/recyclic/scripts/rollback.sh` par `../scripts/rollback.sh`
- **test_cli.py** : Remplacé `/mnt/d/Users/Strophe/Documents/°IA/La\ Clique\ Qui\ Recycle/Recyclic/api` par `api` (chemin relatif)

### File List
- `api/start-api.bat` (modifié)
- `docs/qa/rollback-test-guide.md` (modifié)
- `test_cli.py` (modifié)

### Change Log
- 2025-01-27 : Refactoring complet des chemins absolus vers des chemins relatifs
- 2025-01-27 : Validation de la syntaxe et du fonctionnement des scripts modifiés
- 2025-01-27 : Vérification qu'aucun chemin absolu ne subsiste dans les fichiers ciblés

### Status
Completed
