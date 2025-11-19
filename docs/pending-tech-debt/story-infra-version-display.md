---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.436390
original_path: docs/stories/story-infra-version-display.md
---

# Story (Infrastructure): Activer l'Affichage de la Version dans l'Application

**ID:** STORY-INFRA-VERSION-DISPLAY
**Titre:** Activer l'Affichage Dynamique de la Version et du Commit
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Équipe de Développement,
**Je veux** que la version et l'identifiant de commit du code déployé s'affichent dans l'interface d'administration,
**Afin de** savoir avec une certitude absolue quelle version exacte du code est en cours d'exécution sur n'importe quel environnement.

## Contexte

Le processus de versioning est maintenant documenté dans `docs/guides/processus-release.md`. Cette story a pour but d'implémenter la partie technique : l'affichage de ces informations dans l'application.

## Acceptance Criteria

1.  Le fichier `frontend/package.json` est à la version `1.0.0`.
2.  Le numéro de version et le SHA court du commit sont automatiquement lus pendant le build et affichés dans l'interface d'administration (ex: "Version: 1.0.0 (a1b2c3d)").

## Tasks / Subtasks

- [x] **Initialisation de la Version :**
    - [x] Vérifier que le champ `version` dans `frontend/package.json` est bien `"1.0.0"`.
- [x] **Configuration de Vite :**
    - [x] Modifier `frontend/vite.config.js` pour lire la version depuis `package.json` et l'exposer via `import.meta.env.VITE_APP_VERSION`.
    - [x] Dans le même fichier, s'assurer que la variable d'environnement `VITE_APP_COMMIT_SHA` (qui sera fournie par Docker) est également exposée à l'application.
- [x] **Configuration Docker :**
    - [x] Modifier `docker-compose.yml` (et les autres si nécessaire) pour passer le SHA du commit au processus de build du frontend. L'approche recommandée est d'utiliser un argument de build (`args`) qui exécute `git rev-parse --short HEAD`.
- [x] **Modification de l'Interface :**
    - [x] Modifier un composant de l'administration (ex: `AdminLayout.jsx`) pour afficher le texte "Version: {VITE_APP_VERSION} ({VITE_APP_COMMIT_SHA})", avec un affichage conditionnel si le SHA n'est pas disponible.

## Dev Notes

-   Cette story est la contrepartie technique du guide `processus-release.md`.
-   L'affichage de ces informations est un outil de diagnostic extrêmement puissant pour le débogage entre les environnements.

## Definition of Done

- [x] La version et l'identifiant de commit s'affichent dans l'interface d'administration.
- [ ] La story a été validée par un agent QA.

## Dev Agent Record

### Agent Model Used
James (Full Stack Developer) - BMad/agents/dev

### Debug Log References
- Vérifié que `frontend/package.json` contient bien la version "1.0.0"
- Modifié `frontend/vite.config.js` pour exposer `VITE_APP_VERSION` et `VITE_APP_COMMIT_SHA`
- Mis à jour `docker-compose.yml` pour passer le commit SHA au build frontend
- Modifié `frontend/Dockerfile.dev` pour accepter l'argument de build
- Ajouté l'affichage de version dans `frontend/src/components/AdminLayout.jsx`

### Completion Notes List
- ✅ Version 1.0.0 confirmée dans package.json
- ✅ Configuration Vite mise à jour pour exposer les variables d'environnement
- ✅ Docker Compose configuré pour passer le commit SHA
- ✅ Interface d'administration mise à jour avec affichage de version
- ✅ Services testés et fonctionnels (frontend accessible sur port 4444)
- ✅ Affichage de version déplacé sous le logo Recyclic (plus discret)
- ✅ Commit SHA réel (8c55cc47) configuré et fonctionnel

### File List
- `frontend/package.json` - Version confirmée à 1.0.0
- `frontend/vite.config.js` - Configuration mise à jour pour exposer VITE_APP_VERSION et VITE_APP_COMMIT_SHA
- `docker-compose.yml` - Ajout des arguments de build pour le commit SHA
- `docker-compose.staging.yml` - Ajout du support du commit SHA pour staging
- `docker-compose.prod.yml` - Ajout du support du commit SHA pour production
- `frontend/Dockerfile.dev` - Ajout de l'argument VITE_APP_COMMIT_SHA
- `frontend/src/components/AdminLayout.jsx` - Ajout de l'affichage de version sous le logo
- `scripts/get-commit-sha.sh` - Script pour récupérer automatiquement le commit SHA
- `scripts/setup-env.sh` - Script pour configurer les variables d'environnement
- `scripts/start-with-version.sh` - Script de démarrage unifié pour tous les environnements
- `docs/guides/version-display-setup.md` - Guide de configuration de l'affichage de version

### Change Log
- 2025-01-27: Implémentation complète de l'affichage de version
  - Configuration Vite pour lire la version depuis package.json
  - Configuration Docker pour passer le commit SHA
  - Interface utilisateur mise à jour avec affichage conditionnel
  - Tests de fonctionnement effectués
  - Amélioration UX: déplacement de l'affichage sous le logo (plus discret)
  - Correction du commit SHA pour afficher la valeur réelle (8c55cc47)
  - Solution centralisée: scripts automatiques pour tous les environnements
  - Support multi-environnement: dev, staging, production
  - Documentation complète avec guide d'utilisation

### Status
Ready for Review