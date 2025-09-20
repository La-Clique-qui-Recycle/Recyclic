---
story_id: debt.externalize-versions
epic_id: tech-debt
title: "Externaliser les versions de Node.js et Python du workflow CI/CD"
priority: Low
status: Done
---

### Story de Dette Technique

**Titre :** `story-tech-debt-externalize-versions`

**Description :**
As a developer,
I want the CI/CD workflow to read language versions from dedicated configuration files,
so that version management is centralized and future updates are simplified.

**Contexte :**
Les numéros de version pour Node.js (18) et Python (3.11) sont inscrits en dur dans le fichier `.github/workflows/deploy.yaml`. Mettre à jour une version de langage requiert de modifier le workflow, ce qui est moins pratique et plus sujet à l'oubli.

### Critères d'Acceptation

1.  Un fichier `.nvmrc` est créé à la racine du répertoire `frontend/` et contient la version de Node.js (ex: `18`).
2.  Un fichier `.python-version` est créé à la racine du répertoire `api/` et contient la version de Python (ex: `3.11`).
3.  Le fichier `.github/workflows/deploy.yaml` est mis à jour pour utiliser ces fichiers comme source pour les actions `setup-node` et `setup-python`.
4.  La pipeline CI/CD reste fonctionnelle après la modification.

---

### Tasks / Subtasks

- [x] **(AC: 1)** **Créer le fichier `.nvmrc` :**
    - [x] Créer le fichier `frontend/.nvmrc`.
    - [x] Y inscrire la version actuelle de Node.js utilisée par le projet.

- [x] **(AC: 2)** **Créer le fichier `.python-version` :**
    - [x] Créer le fichier `api/.python-version`.
    - [x] Y inscrire la version actuelle de Python utilisée par le projet.

- [x] **(AC: 3)** **Mettre à jour le workflow CI/CD :**
    - [x] Modifier l'étape `setup-node` dans `.github/workflows/deploy.yaml` pour qu'elle lise la version depuis le fichier `.nvmrc`.
    - [x] Modifier l'étape `setup-python` pour qu'elle lise la version depuis le fichier `.python-version`.

### Tasks / Subtasks

---

### Validation Finale du Scrum Master (2025-09-18)

**Statut :** Done

**Vérification :** Les fichiers `.nvmrc` et `.python-version` ont été créés et le workflow CI/CD a été mis à jour pour les utiliser. La dette technique est résolue.

---

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Création des fichiers de version : `frontend/.nvmrc` (Node.js 18) et `api/.python-version` (Python 3.11)
- Modification du workflow CI/CD : `.github/workflows/deploy.yaml` pour utiliser `node-version-file` et `python-version-file`
- Test de validation : Script de test créé et exécuté avec succès via WSL

### Completion Notes List
- ✅ Fichier `.nvmrc` créé dans `frontend/` avec la version Node.js 18
- ✅ Fichier `.python-version` créé dans `api/` avec la version Python 3.11  
- ✅ Workflow CI/CD modifié pour lire les versions depuis les fichiers dédiés
- ✅ Validation complète : tous les tests passent, les fichiers sont correctement référencés
- ✅ Centralisation des versions réussie : futures mises à jour simplifiées

### File List
- **Créés** : `frontend/.nvmrc`, `api/.python-version`
- **Modifiés** : `.github/workflows/deploy.yaml`
- **Supprimés** : `test-version-files.sh` (fichier de test temporaire)

### Change Log
- **2025-01-27** : Externalisation des versions Node.js et Python dans des fichiers dédiés
  - Création de `.nvmrc` et `.python-version` 
  - Mise à jour du workflow CI/CD pour utiliser ces fichiers
  - Validation complète de la solution

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellent** - Implémentation propre et bien structurée. La solution respecte parfaitement les bonnes pratiques DevOps en externalisant la configuration des versions.

### Compliance Check

- **Coding Standards**: ✅ Conformité parfaite - fichiers de version standardisés
- **Project Structure**: ✅ Respect de la structure - fichiers placés aux bons endroits
- **Testing Strategy**: ✅ Validation complète via tests automatisés
- **All ACs Met**: ✅ Tous les critères d'acceptation satisfaits

### Security Review

**Aucun impact sur la sécurité** - Cette modification ne concerne que la configuration des versions de langages, sans impact sur la sécurité de l'application.

### Performance Considerations

**Aucun impact sur les performances** - L'externalisation des versions est une configuration statique qui n'affecte pas les performances.

### Files Modified During Review

Aucun fichier modifié pendant la review - l'implémentation était déjà complète et correcte.

### Gate Status

**Gate: PASS** → docs/qa/gates/debt.externalize-versions-externalize-versions.yml

### Recommended Status

✅ **Ready for Done** - Story complètement implémentée et validée