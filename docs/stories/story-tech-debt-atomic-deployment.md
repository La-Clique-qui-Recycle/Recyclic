# Story Technique: Rendre le script de déploiement atomique

- **Statut**: Draft
- **Type**: Dette Technique (Infrastructure)
- **Sévérité**: Moyenne

---

## Story

**En tant que** DevOps,
**Je veux** rendre le script de déploiement atomique,
**Afin de** garantir qu'une mise en production ne puisse pas causer d'interruption de service totale en cas d'échec.

---

## Contexte et Problème à Résoudre

Le script de déploiement actuel arrête les anciens conteneurs (`docker-compose down`) avant de démarrer les nouveaux (`docker-compose up`). En cas d'échec au démarrage de la nouvelle version, l'application restera complètement hors ligne.

---

## Critères d'Acceptation

1.  Le déploiement d'une nouvelle version ne doit pas présenter de risque d'interruption de service prolongée.
2.  Une stratégie de déploiement plus sûre est implémentée (ex: blue-green, ou health checks post-lancement avant de couper l'ancienne version).
3.  Si le démarrage de la nouvelle version échoue, le système bascule automatiquement et proprement sur la version précédente qui reste fonctionnelle.

---

## Fichier Concerné

- `.github/workflows/deploy.yaml`
