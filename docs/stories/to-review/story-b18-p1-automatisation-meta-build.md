---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.778909
original_path: docs/stories/story-b18-p1-automatisation-meta-build.md
---

# Story: Automatisation des métadonnées de build - Brownfield Addition

**ID:** STORY-B18-P1-AUTOMATISATION-META-BUILD  
**Titre:** Automatiser l’injection des métadonnées de build dans Docker Compose  
**Type:** Brownfield Addition  
**Priorité:** P1  
**Statut:** À planifier

---

## User Story

**En tant que** mainteneur DevOps de Recyclic,  
**Je veux** que le build Docker récupère automatiquement la version SemVer et le commit SHA via un script unique par environnement,  
**Afin de** exposer des informations de version fiables dans l’API et le frontend sans manipulations manuelles ni exports répétitifs.

---

## Story Context

**Existing System Integration**

- **Intègre avec :** `docker-compose.yml`, `docker-compose.staging.yml`, `docker-compose.prod.yml`, endpoint `api/src/recyclic_api/api/api_v1/endpoints/health.py`, frontend `frontend/src/services/buildInfo.js`.
- **Technologie :** Bash, Docker Compose, FastAPI, React/Vite.
- **Pattern suivi :** Build args déjà consommés par `api/Dockerfile` pour propager `APP_VERSION`, `COMMIT_SHA`, etc.
- **Points de contact :** Répertoire `scripts/`, fichiers `.env.*`, guide `docs/guides/version-display-setup.md`.

**Change Scope**

- Préparer les métadonnées de build (version + SHA) via un script commun.
- Fournir trois scripts d’enrobage (`local`, `staging`, `prod`) qui appellent la préparation puis lancent `docker compose ... up -d --build` avec les bons `--env-file`.
- Mettre à jour le guide de versionning pour refléter le nouveau flux.

---

## Acceptance Criteria

### Functional Requirements

1. `scripts/prepare-build-meta.sh` lit `frontend/package.json`, récupère `APP_VERSION`, puis renseigne `COMMIT_SHA` (court), `BRANCH`, `COMMIT_DATE`, `BUILD_DATE` (UTC) depuis Git et écrit toutes les clés dans `.build-meta.env` (format `KEY=VALUE`).
2. `scripts/deploy-local.sh`, `scripts/deploy-staging.sh`, `scripts/deploy-prod.sh` (ou un script unique paramétré) invoquent `prepare-build-meta.sh`, puis exécutent `docker compose ... up -d --build` en chargeant `--env-file` ciblé (`.env` local/staging/production) et `.build-meta.env`.
3. Après exécution d’un script de déploiement, l’endpoint `/api/v1/health/version` renvoie la version du `package.json` ainsi que le SHA, la branche, les dates de commit et de build effectivement utilisés.
4. Les scripts échouent explicitement avec un message clair si Git est absent ou si `frontend/package.json` n’est pas lisible.
5. La documentation `docs/guides/version-display-setup.md` est mise à jour pour refléter ce flux (plus d’exports manuels, instructions de vérification).

### Integration Requirements

6. L’endpoint `/api/v1/health/version` conserve son format JSON actuel et reste accessible via `/api/v1/health/version`.
7. Les fichiers `.env.staging` et `.env.production` demeurent inchangés et continuent à injecter les secrets applicatifs.
8. Les scripts shell utilisent `bash`, `set -euo pipefail`, et respectent la structure actuelle du dépôt sans déplacer de fichiers existants.

### Quality Requirements

9. `.build-meta.env` est ajouté au `.gitignore` si nécessaire pour éviter l’indexation Git.
10. Une section “Vérification” dans le guide documente la commande `curl` (ou équivalent) à exécuter après un déploiement pour confirmer la version.
11. Les scripts affichent dans la sortie standard les métadonnées clés écrites (version et SHA) pour faciliter le débogage.

---

## Technical Notes

- **Integration Approach:** mutualiser la collecte des métadonnées dans `prepare-build-meta.sh`, puis réutiliser ce fichier via `--env-file` afin de résoudre les `${…}` lors du parsing Docker Compose.
- **Existing Pattern Reference:** utilisation des `ARG` dans `api/Dockerfile` pour transformer les valeurs en `ENV` déjà en place.
- **Key Constraints:** compatibilité Bash (VPS Debian/Ubuntu), absence de dépendance à jq (le script peut utiliser `node -p` ou `python` embarqué pour lire `package.json`), nettoyage automatique du fichier existant avant ré-écriture.

---

## Definition of Done

- [ ] Les scripts `prepare-build-meta.sh` et `deploy-*.sh` sont présents dans `scripts/`, exécutables, et testés.
- [ ] `.build-meta.env` est généré automatiquement et ignoré par Git.
- [ ] Un déploiement local de test confirme que `/api/v1/health/version` expose la version + SHA mis à jour.
- [ ] `docs/guides/version-display-setup.md` décrit le nouveau processus (préparation + scripts de déploiement).
- [ ] Aucun comportement existant (API, frontend) n’est régressé.

---

## Risk and Compatibility Check

- **Primary Risk:** oubli d’utiliser les nouveaux scripts pour un ancien déploiement manuel.
- **Mitigation:** messages d’avertissement dans les scripts + documentation mise à jour.
- **Rollback:** supprimer les nouveaux scripts et revenir à l’export manuel documenté (processus décrit dans la version précédente du guide).

**Compatibility Verification**

- [ ] Pas de breaking change des endpoints API.
- [ ] Aucun schéma de base de données modifié.
- [ ] Pas de changement UI attendu (les informations affichées proviennent déjà de l’API).
- [ ] Impact performance négligeable (scripts shell exécutés ponctuellement).

---

## Validation Checklist

- [ ] Story réalisable en une séance de développement (<4h).
- [ ] Intégration simple : scripts + mises à jour Compose, sans refactor majeur.
- [ ] Les points d’intégration sont clairement identifiés.
- [ ] Critères de succès testables et rollback simple.
