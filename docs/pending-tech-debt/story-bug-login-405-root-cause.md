---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:14.855542
original_path: docs/stories/story-bug-login-405-root-cause.md
---

# Story (Bug): Diagnostic et Correction de l'Erreur 405 sur l'Endpoint de Connexion

**ID:** STORY-BUG-LOGIN-405-ROOT-CAUSE
**Titre:** Diagnostic et Correction de la Cause Racine de l'Erreur 405 sur l'Endpoint de Connexion
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Bloquant)

---

## Objectif

**En tant qu'** Architecte,  
**Je veux** diagnostiquer et corriger la cause racine de l'erreur `405 Not Allowed` qui se produit lors de la connexion en environnement de développement,  
**Afin de** débloquer tous les tests fonctionnels et de garantir la fiabilité de l'environnement de développement.

## Contexte

Un problème persistant d'erreur `405 Not Allowed` (venant de Nginx) empêche toute connexion à l'application en environnement de développement local. Les tentatives de correction au niveau du proxy Vite ont échoué, ce qui suggère un problème plus profond dans la configuration du réseau Docker ou de Nginx en mode développement.

**Informations Collectées :**
- **Erreur :** `405 Not Allowed` retournée par Nginx.
- **Console Navigateur :** `Failed to load resource: the server responded with a status of 405 (Not Allowed)` sur `auth/login`.
- **Comportement :** Se produit sur toutes les tentatives de connexion, qu'elles soient valides ou non.
- **Fichiers Inspectés :** `frontend/vite.config.js`, `frontend/nginx.conf`, `frontend/src/stores/authStore.ts`.

## Critères d'Acceptation

1.  La cause racine du problème de routage/proxy des requêtes `POST` en environnement de développement est identifiée et documentée.
2.  La configuration (Docker, Nginx, ou autre) est corrigée de manière définitive.
3.  La connexion à l'application via le formulaire de login est fonctionnelle en environnement de développement.

## Notes Techniques pour l'Architecte

-   **Pistes d'investigation :**
    -   Analyser la manière dont le conteneur `frontend` (qui exécute le serveur de développement Vite) communique avec le conteneur `api` via le réseau Docker.
    -   Vérifier s'il n'y a pas un conflit entre la configuration du proxy de Vite et la manière dont Nginx est (ou n'est pas) utilisé en mode développement.
    -   Inspecter les logs de Nginx (si possible) et du serveur de développement Vite au moment de la requête pour voir comment elle est traitée et pourquoi la méthode `POST` est rejetée.

## Definition of Done

- [ ] La cause racine de l'erreur 405 est identifiée et corrigée.
- [ ] La connexion à l'application est fonctionnelle en environnement de développement.
- [ ] La solution est documentée.
- [ ] La story a été validée par le Product Owner.
