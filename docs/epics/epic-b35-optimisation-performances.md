# Epic: Optimisation des Performances Système

**ID:** EPIC-B35
**Titre:** Optimisation des Performances Système et Réduction de la Consommation CPU
**Thème:** Dette Technique & Performance
**Statut:** Terminé
**Priorité:** P0 (Critique)

---

## Problème

Un audit a révélé une surconsommation CPU significative et persistante sur les conteneurs frontend et backend, causée par une cascade de problèmes : configurations de développement actives en production, appels API excessifs, requêtes N+1, et inefficacences dans la gestion de l'état et du cache. Ces problèmes dégradent la réactivité de l'application et augmentent inutilement les coûts d'infrastructure.

## Objectif

Cet epic a pour but de résoudre méthodiquement les 15 points identifiés dans le rapport d'audit sur la performance. L'objectif est de réduire drastiquement la consommation CPU, d'améliorer la fluidité de l'application, et de mettre en place des configurations robustes et différenciées pour chaque environnement (développement, staging, production).

## Stories Associées

*   **STORY-B35-P1 :** Optimisation des Configurations Frontend pour Production
*   **STORY-B35-P2 :** Optimisation des Appels API Backend
*   **STORY-B35-P3 :** Optimisation des Appels API Frontend
*   **STORY-B35-P4 :** Optimisation de l'Infrastructure et du Bot
*   **STORY-B35-P5 :** Optimisation de l'Environnement de Développement Local

## Critères de Succès de l'Épique

- La consommation CPU moyenne des conteneurs en production est significativement réduite.
- Les erreurs de type "double rendu" et les appels API redondants sont éliminés.
- Les configurations de développement (`--reload`, `StrictMode`) sont garanties d'être inactives en production.
- L'application est visiblement plus réactive pour l'utilisateur final.
