# Epic 1: Gestion Utilisateurs & Infrastructure

**Objectif :** Établir la fondation technique complète (Docker, BDD, API FastAPI) et implémenter le système d'authentification Telegram permettant aux bénévoles de s'identifier et aux admins de gérer les autorisations. Cet epic délivre un système fonctionnel où les utilisateurs peuvent s'inscrire via bot et être validés par les admins.

## Story 1.1: Configuration Infrastructure Technique
As a developer,  
I want to set up the foundational technical infrastructure,  
so that the application can run reliably in Docker containers with proper database and API structure.

**Acceptance Criteria:**
1. Docker Compose configuration functional (FastAPI + PostgreSQL + Redis)
2. Structure de projet monorepo créée (api/, bot/, frontend/, docs/)
3. FastAPI API de base avec endpoint `/health` opérationnel
4. Base de données PostgreSQL avec schémas initiaux (users, deposits, sales, categories, sites)
5. Tests d'intégration infrastructure validés
6. Déploiement local via `docker-compose up` fonctionnel

## Story 1.2: Bot Telegram Base & Inscription
As a new volunteer,  
I want to contact the Recyclic bot and get a registration link,  
so that I can request access to use the deposit system.

**Acceptance Criteria:**
1. Bot Telegram répond aux messages de nouveaux utilisateurs non autorisés
2. Bot fournit lien vers formulaire d'inscription web
3. Formulaire web collecte nom, prénom, contacts, ressourcerie
4. Soumission formulaire crée demande d'inscription en BDD
5. Bot notifie tous les admins de nouvelle demande d'inscription
6. Gestion des erreurs (utilisateur déjà inscrit, bot indisponible)

## Story 1.3: Validation Admin & Whitelist
As an admin,  
I want to approve or reject user registration requests,  
so that only authorized volunteers can use the deposit system.

**Acceptance Criteria:**
1. Interface admin web listant demandes d'inscription en attente
2. Boutons Approuver/Rejeter avec notification Telegram requérant
3. Utilisateur approuvé ajouté à whitelist Telegram active
4. Notification automatique aux autres admins "X a validé l'inscription de Y"
5. Utilisateur peut immédiatement utiliser commandes bot après approbation
6. Logs audit complets (qui a validé qui et quand)

---
