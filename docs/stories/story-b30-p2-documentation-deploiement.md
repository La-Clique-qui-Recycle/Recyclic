# User Story (Documentation): Créer la Documentation de Déploiement Unifiée

**ID:** STORY-B30-P2
**Titre:** Rédiger un guide de déploiement unique pour les environnements local, staging et production
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P1 (Haute)

---

## Objectif

**En tant que** Développeur ou Administrateur Système,
**Je veux** une documentation unique, claire et à jour qui explique comment déployer et gérer l'application dans tous les environnements (local, staging, production),
**Afin de** pouvoir prendre en main le projet rapidement, réduire les erreurs de déploiement et faciliter la maintenance.

## Contexte

Suite à la refactorisation de l'architecture de déploiement (Story B30-P1), l'ancienne documentation est obsolète. Cette story a pour but de créer un nouveau guide de référence qui reflète la nouvelle architecture basée sur les "profiles" Docker et les fichiers `.env`. Il est crucial que cette documentation capture également les leçons apprises lors des précédents débogages pour éviter de futures erreurs.

## Critères d'Acceptation

1.  **Création du Fichier :**
    - [ ] Un nouveau fichier `docs/guides/guide-deploiement-unifie.md` est créé (ou le `README.md` principal est mis à jour de manière significative).

2.  **Contenu pour le Développement Local :**
    - [ ] La procédure pour lancer l'environnement de développement local doit être décrite, incluant :
        - La création d'un fichier `.env` local si nécessaire.
        - La commande `docker compose --profile dev up`.
        - L'URL d'accès (`http://localhost:4444`).

3.  **Contenu pour l'Environnement de Staging :**
    - [ ] La procédure pour déployer sur un environnement de staging (ex: `devrecyclic.jarvos.eu`) doit être décrite, incluant :
        - La configuration DNS requise.
        - La création du fichier `.env.staging`.
        - La commande de déploiement `docker compose --profile staging up --build`.

4.  **Contenu pour l'Environnement de Production :**
    - [ ] La procédure pour déployer en production (`recyclic.jarvos.eu`) doit être décrite, incluant :
        - La création du fichier `.env.production`.
        - La commande de déploiement `docker compose --profile prod up --build`.

5.  **Explications Claires :**
    - [ ] Le document doit expliquer brièvement le rôle des fichiers `.env` et des "profiles" Docker pour que le concept soit compréhensible par un nouveau venu.
    - [ ] Une section "Dépannage" doit mentionner les erreurs courantes rencontrées (ex: "Mixed Content") et leurs causes (ex: mauvaise configuration des en-têtes de proxy).

## Definition of Done

- [ ] Le guide de déploiement est créé et complet.
- [ ] Les instructions pour les trois environnements (local, staging, production) sont présentes et correctes.
- [ ] La documentation est facile à comprendre et à suivre.
- [ ] La story a été validée par le Product Owner.