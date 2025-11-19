# Story: Nettoyage et organisation du répertoire stories

**Story ID:** CLEANUP.1
**Épic:** Maintenance et organisation documentaire
**Type:** Chore - Organisation
**Status:** Ready for Development

## Contexte

Le répertoire `docs/stories/` contient actuellement plus de 200 fichiers mélangés :
- Stories terminées des versions précédentes
- Propositions pour futures versions
- Dettes techniques en cours
- Stories obsolètes

Cette situation crée de la confusion et empêche l'agent SM de travailler efficacement sur la v1.3.0.

## User Story

En tant que **mainteneur du projet**, je veux **organiser automatiquement le répertoire stories** afin de **séparer les stories terminées des actives** pour **faciliter la navigation et éviter les confusions**.

## Critères d'Acceptation

### ✅ Fonctionnel
- [ ] Toutes les stories terminées sont déplacées vers `docs/archive/v1.2-and-earlier/`
- [ ] Les propositions futures sont déplacées vers `docs/archive/future-versions/`
- [ ] Les dettes techniques actives restent dans `docs/pending-tech-debt/`
- [ ] Les stories incertaines sont placées dans `docs/stories/to-review/`
- [ ] Des symlinks sont créés pour maintenir la compatibilité

### ✅ Technique
- [ ] Aucun fichier n'est perdu lors du déplacement
- [ ] La structure des archives respecte la nomenclature existante
- [ ] Un rapport détaillé est généré avec la liste des actions effectuées
- [ ] Les métadonnées de catégorisation sont ajoutées aux fichiers

### ✅ Qualité
- [ ] Vérification manuelle possible des déplacements
- [ ] Possibilité de rollback si nécessaire
- [ ] Documentation du processus de nettoyage

## Tâches de Développement

### Phase 1: Analyse automatique
- Scanner tous les fichiers .md dans docs/stories/
- Analyser chaque fichier pour détecter les indicateurs de status
- Créer une liste de fichiers à déplacer avec leur destination

### Phase 2: Tri par catégories
- **Terminées** : Status "Terminé", "Done", sections de validation présentes
- **Futures** : Contiennent "Proposition", "Future", versions > 1.3
- **Tech Debt** : Contiennent "tech-debt", "dette", "stabilization"
- **À vérifier** : Status incertain ou indicateurs mixtes

### Phase 3: Déplacement sécurisé
- Créer les backups avant déplacement
- Déplacer les fichiers vers leur destination
- Créer les symlinks de compatibilité
- Ajouter les métadonnées YAML

### Phase 4: Rapport et validation
- Générer le rapport détaillé des actions
- Vérifier l'intégrité des déplacements
- Tester l'accès via symlinks

## Dev Agent Record

### Agent Model Used
James (dev agent) - Full Stack Developer

### Tasks / Subtasks Checkboxes
- [x] **Phase 1: Analyse automatique**
  - [x] Scanner tous les fichiers .md dans docs/stories/
  - [x] Analyser chaque fichier pour détecter les indicateurs de status
  - [x] Créer une liste de fichiers à déplacer avec leur destination
- [x] **Phase 2: Tri par catégories**
  - [x] **Terminées** : Status "Terminé", "Done", sections de validation présentes (3 fichiers identifiés)
  - [x] **Futures** : Contiennent "Proposition", "Future", versions > 1.3 (11 fichiers identifiés)
  - [x] **Tech Debt** : Contiennent "tech-debt", "dette", "stabilization" (32 fichiers identifiés)
  - [x] **À vérifier** : Status incertain ou indicateurs mixtes (51 fichiers identifiés)
- [ ] **Phase 3: Déplacement sécurisé**
  - [ ] Créer les backups avant déplacement
  - [ ] Déplacer les fichiers vers leur destination
  - [ ] Créer les symlinks de compatibilité
  - [ ] Ajouter les métadonnées YAML
- [ ] **Phase 4: Rapport et validation**
  - [ ] Générer le rapport détaillé des actions
  - [ ] Vérifier l'intégrité des déplacements
  - [ ] Tester l'accès via symlinks

### Debug Log References
- None

### Completion Notes List
- Phase 1 completed: Analyzed 97 files, categorized 3 terminated, 11 future, 32 tech debt, 51 to-review
- Analysis results saved to docs/story-analysis-results.json and docs/story-cleanup-analysis-report.md

### File List
- Modified: `docs/stories/story-cleanup-stories-directory.md` (added Dev Agent Record)
- Created: `scripts/story-cleanup-analyzer.py` (analysis script)
- Created: `docs/story-analysis-results.json` (analysis data)
- Created: `docs/story-cleanup-analysis-report.md` (analysis report)

### Change Log
- Added Dev Agent Record section for proper task tracking

## Tests d'Acceptation

### Test 1: Stories terminées archivées
```bash
# Vérifier qu'une story terminée est bien archivée
ls docs/archive/v1.2-and-earlier/story-b33-p1-*.md
# Doit retourner le fichier
```

### Test 2: Symlinks fonctionnels
```bash
# Vérifier que les symlinks marchent
cat docs/stories/story-b33-p1-filename.md
# Doit afficher le contenu archivé
```

### Test 3: Rapport généré
```bash
# Vérifier le rapport
cat docs/story-cleanup-report.md
# Doit contenir la liste détaillée des déplacements
```

## Risques et Mitigation

### Risque: Fichiers importants supprimés
**Mitigation:** Créer des backups avant tout déplacement

### Risque: Mauvaise catégorisation
**Mitigation:** Dossier "to-review" pour validation manuelle

### Risque: Liens cassés
**Mitigation:** Utiliser des symlinks relatifs pour compatibilité

## Métriques de Succès

- Stories actives restantes: < 20 fichiers
- Taux d'archivage automatique: > 80%
- Fichiers nécessitant revue manuelle: < 10%
- Temps d'exécution: < 30 minutes
