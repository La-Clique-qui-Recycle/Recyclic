---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.709200
original_path: docs/stories/story-b17-p2-comparaison-artefacts.md
---

# User Story (Tâche Technique): Comparer les Artefacts de Build

**ID:** STORY-B17-P2
**Titre:** Analyser et comparer les artefacts de build local et serveur
**Epic:** Déploiement & Mise en Production
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** comparer le contenu de l'artefact de build de référence (local) avec l'artefact suspect (serveur),
**Afin de** prouver l'existence d'une divergence et d'identifier la source de la corruption.

## Contexte

C'est la phase finale de l'opération "Autopsie de l'Artefact". Nous avons deux pièces à conviction : une archive du build local (`frontend_build_local.zip`, produite par la story B17-P1) et une archive du build du serveur (`frontend_build_vps.tar.gz`, fournie par l'utilisateur).

## Prérequis

- L'archive `frontend_build_local.zip` doit être disponible (livrable de la story B17-P1).
- L'archive `frontend_build_vps.tar.gz` doit être disponible (fournie par l'utilisateur et placée à la racine du projet).

## Critères d'Acceptation / Plan d'Action

1.  **Préparation :**
    - [ ] Décompresser `frontend_build_local.zip` dans un répertoire nommé `build_local`.
    - [ ] Décompresser `frontend_build_vps.tar.gz` dans un répertoire nommé `build_vps`.

2.  **Comparaison des Dossiers :**
    - [ ] Utiliser un outil de comparaison de dossiers (ex: `diff -r`, WinMerge, ou une extension VS Code) pour comparer `build_local` et `build_vps`.

3.  **Analyse et Rapport :**
    - [ ] **Scénario A (Fichiers identiques) :** Si les fichiers sont identiques, le rapporter immédiatement. La mission prendra une autre direction.
    - [ ] **Scénario B (Fichiers différents) :** Si des différences sont trouvées, l'agent doit :
        - Identifier les fichiers Javascript principaux qui diffèrent (ex: `assets/index-....js`).
        - Ouvrir les deux versions de ce(s) fichier(s) et rechercher la chaîne `http://`.
        - Confirmer la présence de la contamination dans la version `build_vps` et son absence dans la version `build_local`.

## Livrable Final

- [ ] Un rapport d'analyse confirmant soit l'identité des fichiers (Scénario A), soit la divergence et la preuve de la contamination (Scénario B), en incluant les extraits de code pertinents.
