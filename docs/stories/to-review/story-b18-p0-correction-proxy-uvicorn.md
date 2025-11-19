---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.749613
original_path: docs/stories/story-b18-p0-correction-proxy-uvicorn.md
---

# User Story (Correctif Technique): Correction du Proxy Uvicorn pour HTTPS

**ID:** STORY-B18-P0
**Titre:** Forcer Uvicorn à respecter les en-têtes de proxy pour résoudre les erreurs "Mixed Content"
**Epic:** Déploiement & Mise en Production
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur / DevOps,
**Je veux** que le serveur API Uvicorn interprète correctement les en-têtes `X-Forwarded-Proto` transmis par Traefik,
**Afin de** générer des URL de redirection en `https` et d'éliminer définitivement les erreurs "Mixed Content" en production.

## Contexte

Après un long débogage, la cause racine des erreurs "Mixed Content" a été identifiée : Uvicorn ne recevait pas ou n'interprétait pas les en-têtes de proxy, ce qui le faisait générer des redirections internes en `http://` au lieu de `https://`. Cette story documente la solution finale et pérenne.

## Critères d'Acceptation / Plan d'Action

1.  **Modification de `docker-compose.vps.yml` :**
    - [ ] La méthode de passage des arguments à Uvicorn via la variable d'environnement `UVICORN_CMD_ARGS` est supprimée.
    - [ ] Elle est remplacée par une directive `command:` explicite qui force l'utilisation des bons flags au démarrage du conteneur `api` :
      ```yaml
      command: uvicorn recyclic_api.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
      ```

2.  **Ajout d'un Middleware Traefik :**
    - [ ] Pour garantir que l'en-tête `X-Forwarded-Proto` est toujours correctement défini, un nouveau middleware Traefik est ajouté aux labels du service `api` dans `docker-compose.vps.yml` :
      ```yaml
      - "traefik.http.middlewares.recyclic-setproto.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.routers.recyclic-api.middlewares=recyclic-setproto"
      ```

## Recommandations pour l'Avenir (à intégrer dans la documentation)

- Toujours privilégier la directive `command:` dans Docker Compose pour les flags critiques d'un service.
- Lors de la mise en place d'un reverse proxy, toujours vérifier que les en-têtes `X-Forwarded-Proto` et `X-Forwarded-For` sont bien transmis et interprétés par l'application en amont.

## Definition of Done

- [ ] Les modifications sont appliquées au fichier `docker-compose.vps.yml`.
- [ ] La procédure de redéploiement (`docker compose up -d --build api`) est exécutée avec succès.
- [ ] L'application est entièrement fonctionnelle en production sans aucune erreur "Mixed Content".
- [ ] La story est validée par le Product Owner.
