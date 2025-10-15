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
    - [x] Un nouveau fichier `docs/guides/guide-deploiement-unifie.md` est créé (ou le `README.md` principal est mis à jour de manière significative).

2.  **Contenu pour le Développement Local :**
    - [x] La procédure pour lancer l'environnement de développement local doit être décrite, incluant :
        - La création d'un fichier `.env` local si nécessaire.
        - La commande `docker compose --profile dev up`.
        - L'URL d'accès (`http://localhost:4444`).

3.  **Contenu pour l'Environnement de Staging :**
    - [x] La procédure pour déployer sur un environnement de staging (ex: `devrecyclic.jarvos.eu`) doit être décrite, incluant :
        - La configuration DNS requise.
        - La création du fichier `.env.staging`.
        - La commande de déploiement `docker compose --profile staging up --build`.

4.  **Contenu pour l'Environnement de Production :**
    - [x] La procédure pour déployer en production (`recyclic.jarvos.eu`) doit être décrite, incluant :
        - La création du fichier `.env.production`.
        - La commande de déploiement `docker compose --profile prod up --build`.

5.  **Explications Claires :**
    - [x] Le document doit expliquer brièvement le rôle des fichiers `.env` et des "profiles" Docker pour que le concept soit compréhensible par un nouveau venu.
    - [x] Une section "Dépannage" doit mentionner les erreurs courantes rencontrées (ex: "Mixed Content") et leurs causes (ex: mauvaise configuration des en-têtes de proxy).
    - [x] **(Recommandation de B30-P1.1)** Une section "Maintenance" doit expliquer quand et comment utiliser la commande `npm run codegen` après une mise à jour de la spécification OpenAPI.

## Definition of Done

- [x] Le guide de déploiement est créé et complet.
- [x] Les instructions pour les trois environnements (local, staging, production) sont présentes et correctes.
- [x] La documentation est facile à comprendre et à suivre.
- [ ] La story a été validée par le Product Owner.

## QA Results

- Gate: PASS → `docs/qa/gates/b30.p2-documentation-deploiement.yml`
- Rationale: 
  - ✅ Guide complet dans `docs/guides/guide-deploiement-unifie.md` (469 lignes)
  - ✅ Sections pour les 3 environnements (dev, staging, prod) avec procédures détaillées
  - ✅ Explications des concepts (.env, profiles Docker) avec diagramme d'architecture
  - ✅ Section dépannage avec erreurs courantes (Mixed Content, services unhealthy)
  - ✅ Section maintenance incluant `npm run codegen` (recommandation B30-P1.1)
  - ✅ Commandes de diagnostic et monitoring
- Validation: Documentation complète et professionnelle, prête pour utilisation.

## Dev Agent Record

### Completion Notes
- Guide de déploiement unifié créé dans `docs/guides/guide-deploiement-unifie.md`
- Sections complètes : développement local, staging, production
- Explications des concepts (.env, profiles Docker)
- Section dépannage avec erreurs courantes (Mixed Content, services unhealthy)
- Section maintenance incluant `npm run codegen` (recommandation B30-P1.1)
- Architecture des services documentée avec diagramme

### File List
- Ajout: `docs/guides/guide-deploiement-unifie.md`
- Modifié: `docs/stories/story-b30-p2-documentation-deploiement.md`

### Change Log
- Création du guide de déploiement unifié complet
- Intégration de la recommandation B30-P1.1 pour `npm run codegen`
- Documentation des trois environnements avec procédures détaillées
