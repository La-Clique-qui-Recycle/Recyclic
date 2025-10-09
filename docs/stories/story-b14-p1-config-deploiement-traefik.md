# Story (Amélioration): Configuration de Déploiement pour Traefik

**ID:** STORY-B14-P1
**Titre:** Créer une Configuration de Déploiement Alternative pour VPS avec Traefik
**Epic:** Déploiement & Mise en Production
**Priorité:** P2 (Haute)

---

## Objectif

**En tant que** Administrateur Système utilisant Traefik comme reverse proxy sur mon VPS,
**Je veux** un fichier `docker-compose.vps.yml` dédié et une documentation mise à jour,
**Afin de** pouvoir déployer l'application Recyclic de manière intégrée à mon infrastructure existante, sans avoir à gérer Nginx.

## Contexte

Suite à la finalisation d'un guide de déploiement standard basé sur Nginx, une optimisation a été identifiée pour les serveurs utilisant déjà Traefik. Cette story a pour but de fournir une configuration "prête à l'emploi" pour ce scénario, afin de simplifier le déploiement et la maintenance.

La solution proposée est basée sur un patch fourni par l'utilisateur, qui connaît parfaitement la configuration de son serveur.

## Critères d'Acceptation

1.  **Création du Fichier de Configuration :**
    -   Un nouveau fichier nommé `docker-compose.vps.yml` est créé à la racine du projet.
    -   Ce fichier doit contenir la configuration Docker Compose adaptée pour une utilisation avec Traefik.

2.  **Implémentation du Patch Traefik :**
    -   Le contenu du `docker-compose.vps.yml` doit intégrer les modifications suivantes :
        -   Suppression complète du service `nginx`.
        -   Ajout d'un réseau externe `proxy` pour la communication avec Traefik.
        -   Modification des services `backend` et `frontend` pour qu'ils utilisent le réseau `proxy` et incluent les labels Traefik spécifiques.

3.  **Mise à Jour du Guide de Déploiement :**
    -   Le document `docs/guides/deploiement-vps.md` doit être mis à jour.
    -   Une nouvelle section (ou une note proéminente) doit être ajoutée pour présenter cette méthode de déploiement alternative avec Traefik.
    -   La documentation doit clairement indiquer quand utiliser `docker-compose.yml` (standard/Nginx) et quand utiliser `docker-compose.vps.yml` (VPS avec Traefik).
    -   Les commandes spécifiques à cette méthode doivent être incluses dans le guide, notamment :
        ```bash
        docker network create proxy || true
        docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build
        ```

---

## Notes Techniques : Patch de Référence

Voici le détail complet du patch à appliquer pour créer le `docker-compose.vps.yml`. Ce fichier ne doit contenir que les surcharges et ajouts par rapport au `docker-compose.yml` principal.

```yaml
# docker-compose.vps.yml
# Contient les surcharges pour un déploiement derrière Traefik

version: '3.8'

networks:
  proxy:
    external: true

services:
  backend:
    networks:
      - proxy
      - default # 'default' remplace 'recyclic' dans ce contexte
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.recyclic-api.rule=Host(`recyclic.ton-domaine.tld`) && PathPrefix(`/api`)"
      - "traefik.http.routers.recyclic-api.entrypoints=websecure"
      - "traefik.http.routers.recyclic-api.tls=true"
      - "traefik.http.services.recyclic-api.loadbalancer.server.port=8000"

  frontend:
    networks:
      - proxy
      - default
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.recyclic-front.rule=Host(`recyclic.ton-domaine.tld`) && PathPrefix(`/`)"
      - "traefik.http.routers.recyclic-front.entrypoints=websecure"
      - "traefik.http.routers.recyclic-front.tls=true"
      - "traefik.http.services.recyclic-front.loadbalancer.server.port=4444"

  # Le service nginx n'est pas défini ici, 
  # il faut s'assurer qu'il n'est pas démarré lors de l'utilisation de ce fichier.

```

## Definition of Done

- [x] Le fichier `docker-compose.vps.yml` est créé et conforme aux spécifications.
- [x] Le guide `deploiement-vps.md` est mis à jour avec la nouvelle section sur Traefik.
- [ ] La story a été validée par le Product Owner.

---

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5-20250929

### File List
- `docker-compose.vps.yml` (created)
- `docs/guides/deploiement-vps.md` (modified)

### Change Log
- Created `docker-compose.vps.yml` with Traefik labels and proxy network configuration
- Updated `docs/guides/deploiement-vps.md` to add comprehensive Traefik deployment section
- Added table of contents entry for Traefik section

### Completion Notes
- Docker Compose override file created with Traefik-specific configuration
- Documentation includes clear decision matrix for choosing between Nginx and Traefik
- Complete commands and troubleshooting steps provided
- Comparison table added to highlight differences between deployment methods
