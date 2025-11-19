# Story Technique: Métriques de Performance IA vs Humain

- **Statut**: Draft
- **Type**: Dette Technique
- **Priorité**: Moyenne
- **Epic**: 4 - Bot IA & Classification

---

## Story

**En tant que** Product Owner,
**Je veux** des métriques précises sur la performance de la classification IA comparée aux corrections humaines,
**Afin de** pouvoir mesurer la précision du modèle et décider des futures améliorations.

---

## Contexte

Cette story est une suite de la story 4.3. Le rapport de QA a recommandé d'ajouter un suivi de performance pour évaluer l'efficacité de l'IA.

---

## Critères d'Acceptation

1.  Un nouveau service ou une nouvelle fonction est créé pour calculer et stocker les métriques de performance.
2.  Les métriques doivent inclure, au minimum : le taux de validation directe par l'utilisateur, le taux de correction, et la distribution des catégories corrigées.
3.  Ces métriques sont stockées dans une nouvelle table `ia_performance_metrics` ou ajoutées à un document de monitoring.
4.  Un endpoint d'API (protégé) est créé pour exposer ces métriques.

---

## Dev Notes

- **Source**: Recommandation du rapport de QA de la story 4.3.
- **Fichiers à considérer**: `api/src/recyclic_api/utils/performance_monitor.py` a été suggéré comme un emplacement potentiel pour cette logique.
