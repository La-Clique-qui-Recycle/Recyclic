# Story (Tâche Technique): Création du Guide de Déploiement VPS

**ID:** STORY-B13-P1
**Titre:** Créer un Guide de Déploiement Pas-à-Pas pour un VPS
**Epic:** Déploiement & Mise en Production
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur / Administrateur Système,
**Je veux** un guide de déploiement complet et facile à suivre pour installer l'application sur un serveur VPS de production,
**Afin de** pouvoir déployer l'application de manière fiable, sécurisée et reproductible.

## Contexte

Avec la fin du MVP, il est crucial de disposer d'une documentation claire pour le déploiement en production. Ce guide servira de référence unique pour toutes les installations futures et garantira qu'aucune étape critique n'est oubliée.

## Critères d'Acceptation

1.  Un nouveau document est créé à l'emplacement `docs/guides/deploiement-vps.md`.
2.  Le guide est rédigé en Markdown et structuré de manière claire.
3.  Le guide inclut les sections suivantes, comme discuté :
    -   **Pré-requis :** Logiciels nécessaires sur le serveur (Docker, Docker Compose, etc.).
    -   **Installation :** Cloner le projet, configurer les variables d'environnement de production (`.env`).
    -   **Lancement :** Démarrer les services avec `docker-compose`.
    -   **Post-Installation - Étape 1 :** Création du compte Super-Administrateur via le script `create_admin.sh`.
    -   **Post-Installation - Étape 2 :** Import des données initiales (catégories, etc.) à partir du fichier CSV. La commande ou la procédure à suivre doit être décrite.
    -   **Phase de Test :** Instructions pour permettre aux utilisateurs de tester l'application avec des données factices.
    -   **Post-Installation - Étape 3 :** Procédure pour purger les données de test avant le lancement officiel. Le script de "reset" est défini dans la story `STORY-B13-P3`.
    -   **Go-Live :** Les dernières vérifications avant de donner l'accès final aux utilisateurs.

## Definition of Done

- [ ] Le fichier `deploiement-vps.md` est créé.
- [ ] Toutes les sections listées dans les critères d'acceptation sont présentes et remplies.
- [ ] La procédure est testée et validée comme étant fonctionnelle.
- [x] La story a été validée par le Product Owner.
