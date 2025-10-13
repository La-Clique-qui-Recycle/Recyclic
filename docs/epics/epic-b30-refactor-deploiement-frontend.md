# Epic: Refactorisation Complète de l'Architecture de Déploiement Frontend

**ID:** EPIC-B30
**Titre:** Clean Slate V2 - Standardiser et Fiabiliser le Déploiement Frontend
**Thème:** Dette Technique & Infrastructure
**Statut:** Proposé

---

## Problème

Le processus de déploiement actuel du frontend est fragile, incohérent et sujet à des erreurs difficiles à déboguer. Les configurations pour les environnements de développement local et de production ont divergé, entraînant des "workarounds" (multiples fichiers `docker-compose`, patchs manuels) qui ne sont pas pérennes. Cela a causé des erreurs critiques en production ("Mixed Content") et a cassé l'environnement de développement local, rendant la maintenance et les futurs déploiements risqués et inefficaces.

### Historique du Débogage

Une longue série d'investigations a révélé une cascade de problèmes interconnectés :
1.  **Problème de Proxy Uvicorn (Story B18-P0) :** La cause initiale suspectée était que Uvicorn ne respectait pas les en-têtes de proxy `X-Forwarded-Proto`, causant des redirections en `http`. La solution a été de forcer les arguments de proxy via la directive `command:` dans Docker Compose.
2.  **Problème de "Mixed Content" Persistant :** Malgré la correction, l'erreur persistait, indiquant que le code source lui-même faisait des appels en `http`.
3.  **Hypothèse du "Client Fantôme" :** L'enquête a révélé que le client API auto-généré (`src/generated/api.ts`) et d'autres services avaient leur propre logique de `baseURL` défectueuse, ignorant la configuration centrale.
4.  **Contradiction Finale :** Même après avoir corrigé tout le code source localement, le problème persistait sur le serveur, prouvant une désynchronisation entre le code source, le dépôt Git et/ou l'environnement de build Docker sur le serveur.

Cet épique a pour but de résoudre **toutes** ces causes racines en une seule opération.

## Objectif

Cet épique a pour but de refactoriser entièrement l'architecture de build et de déploiement du frontend pour la rendre **standard, robuste, prédictible et facile à maintenir**. L'objectif est d'adopter les meilleures pratiques recommandées par Vite et Docker pour gérer de multiples environnements, et de permettre la mise en place facile d'un environnement de **staging**.

## Stories Associées

*   **STORY-B30-P1 :** Refactorisation du Code et de la Configuration Docker
*   **STORY-B30-P2 :** Création de la Documentation de Déploiement Unifiée

## Critères de Succès de l'Épique

- Le projet peut être déployé de manière fiable en local, en staging et en production avec des commandes claires et distinctes.
- Il n'y a plus d'erreurs de type "Mixed Content" ou de `404` liés à la configuration.
- L'environnement de développement local est de nouveau pleinement fonctionnel.
- La maintenance et l'ajout de nouveaux environnements sont simplifiés.
- La documentation est complète et à jour.
