# Epic: Architecture de Déploiement V3 - Stacks Indépendantes

**ID:** EPIC-B31-INDEPENDENT-STACKS
**Titre:** Architecture de Déploiement V3 - Stacks Indépendantes pour Staging et Production
**Thème:** Dette Technique & Infrastructure
**Statut:** Défini
**Priorité:** P0 (Critique)

---

## Problème

L'architecture de déploiement actuelle (issue de l'epic B30), bien qu'unifiée dans un seul `docker-compose.yml` avec des profiles, a révélé une limitation critique : elle ne permet pas de faire tourner simultanément les environnements de `staging` et de `production` sur le même serveur. Les services partagent le même "project name" Docker, ce qui crée des conflits insolubles. Cela nous empêche d'avoir un véritable environnement de pré-production pour valider les changements sans impacter la production.

## Objectif

Cet epic a pour but de mettre en place l'architecture de déploiement finale et pérenne, en revenant à une approche plus robuste de **stacks Docker complètement indépendantes** pour chaque environnement distant (`staging` et `prod`). L'objectif est de garantir une isolation parfaite entre les environnements, tout en conservant un workflow de développement local simple.

## Stories Associées

*   **STORY-B31-P1 :** Refactorisation de l'Architecture Docker pour des Stacks Indépendantes.
*   **STORY-B31-P2 :** Mise à Jour de la Documentation de Déploiement.

## Critères de Succès de l'Épique

- Les environnements de staging et de production peuvent tourner simultanément sur le même serveur sans aucun conflit.
- Chaque environnement est complètement isolé (services, réseaux, volumes).
- Le déploiement et la maintenance de chaque environnement sont indépendants et clairement documentés.
- Le workflow de développement local reste inchangé et simple (`docker compose --profile dev up`).
