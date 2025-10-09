# Rapport de Déploiement : Conflit Potentiel entre Traefik et Nginx

**ID:** DEPLOY-REPORT-01
**Titre:** Analyse du Conflit Potentiel entre le Reverse Proxy Traefik du VPS et le Reverse Proxy Nginx de l'Application
**À l'attention de:** Agent de Déploiement

---

## 1. Contexte

L'architecture de notre application (voir `docs/architecture/architecture.md`) utilise un conteneur **Nginx** comme reverse proxy et API Gateway. Son rôle est d'être le point d'entrée unique et de router le trafic vers les services `frontend` et `api`.

Il a été signalé que l'environnement de déploiement sur le VPS utilise **Traefik** comme reverse proxy principal pour gérer tout le trafic entrant sur le serveur.

## 2. Analyse du Conflit

Un conflit est très probable car nous avons deux systèmes qui essaient de faire le même travail de routage du trafic HTTP/HTTPS.

-   **Traefik (sur le VPS) :** Gère les noms de domaine, les certificats SSL (Let's Encrypt), et redirige le trafic vers les applications qui tournent sur le serveur.
-   **Nginx (dans notre Docker Compose) :** Est conçu pour recevoir tout le trafic de l'application et le dispatcher en interne.

Faire cohabiter les deux sans une configuration précise mènera à des erreurs de connexion, des timeouts, ou des configurations de SSL incorrectes.

## 3. Solutions Recommandées

Il existe deux stratégies principales pour résoudre ce conflit. Le choix dépend de la manière dont l'hébergeur a configuré Traefik.

### Option A (Recommandée) : Utiliser Traefik comme Seul Reverse Proxy

**Principe :** On supprime notre Nginx et on laisse Traefik parler directement à nos services `frontend` et `api`.

**Actions à mener :**
1.  **Modifier `docker-compose.yml` :**
    -   Supprimer complètement le service `nginx`.
    -   Exposer les ports de nos services `frontend` et `api` pour que Traefik puisse les voir.
    -   Ajouter des `labels` spécifiques à Traefik sur les services `frontend` et `api`. Ces labels diront à Traefik comment les router.

2.  **Exemple de `labels` pour le service `api` :**
    ```yaml
    services:
      api:
        # ... (configuration existante)
        labels:
          - "traefik.enable=true"
          - "traefik.http.routers.api.rule=Host(`votre-domaine.com`) && PathPrefix(`/api`)"
          - "traefik.http.services.api.loadbalancer.server.port=8000"
    ```

**Avantages :** C'est la solution la plus propre et la plus standard. Elle simplifie notre stack et s'intègre nativement avec l'infrastructure du VPS.

### Option B : Garder Nginx et le Mettre Derrière Traefik

**Principe :** On configure Traefik pour qu'il se contente de transmettre **tout** le trafic de notre domaine à notre conteneur Nginx, qui se chargera ensuite du routage interne.

**Actions à mener :**
1.  **Modifier `docker-compose.yml` :**
    -   Ne pas exposer les ports des services `api` et `frontend` à l'extérieur.
    -   Ajouter des `labels` Traefik uniquement sur le service `nginx`.

2.  **Exemple de `labels` pour le service `nginx` :**
    ```yaml
    services:
      nginx:
        # ... (configuration existante)
        labels:
          - "traefik.enable=true"
          - "traefik.http.routers.recyclic.rule=Host(`votre-domaine.com`)"
          - "traefik.http.services.recyclic.loadbalancer.server.port=80"
    ```

**Avantages :** Cela demande moins de modifications à notre configuration interne.
**Inconvénients :** On garde une couche de proxy supplémentaire, ce qui peut ajouter une légère latence et complexifier le débogage.

## 4. Conclusion et Prochaine Étape

Il est impératif de choisir une de ces deux stratégies avant de poursuivre le déploiement. L'**Option A est fortement recommandée** car elle est plus performante et plus simple à long terme.

**Prochaine action pour l'agent de déploiement :**
1.  Confirmer que le VPS utilise bien Traefik.
2.  Choisir une des deux stratégies (de préférence l'Option A).
3.  Modifier le fichier `docker-compose.yml` en conséquence avant de lancer le déploiement.
