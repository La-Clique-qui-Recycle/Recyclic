## Epic Tech-Debt: Refonte de l'Authentification

**Objectif :** Remplacer le système d'authentification basé sur l'ID Telegram par un système standard et sécurisé basé sur un couple **Nom d'utilisateur/Mot de passe**,
**Afin de** répondre aux exigences réelles d'ergonomie et de sécurité du projet.

### Story A: Mise à Jour de la Base de Données
**En tant que** développeur,
**Je veux** modifier la table `users` pour y inclure un champ `username` unique et un champ `hashed_password`,
**Afin de** pouvoir stocker les informations nécessaires à une authentification par nom d'utilisateur et mot de passe.

**Critères d'Acceptation :**
1.  Un champ `username` (unique, non-nul) est ajouté à la table `users`.
2.  Un champ `email` (optionnel, non-unique) est conservé pour la communication.
3.  Un champ `hashed_password` (string, non-nul) est ajouté à la table `users`.
4.  Le champ `telegram_id` est rendu optionnel (nullable).
5.  Une migration Alembic est créée pour appliquer ces changements au schéma de la base de données.

### Story B: Adaptation du Backend et de la CLI
**En tant que** développeur,
**Je veux** adapter la logique du backend pour gérer la création et la vérification des mots de passe, en utilisant un algorithme de hashage robuste comme **bcrypt**,
**Afin de** permettre une authentification sécurisée.

**Critères d'Acceptation :**
1.  La commande CLI `create-super-admin` est mise à jour pour accepter un **nom d'utilisateur** et un mot de passe, et elle enregistre correctement le mot de passe hashé.
2.  Un nouvel endpoint `POST /auth/login` est créé. Il accepte un **nom d'utilisateur** et un mot de passe, les vérifie, et retourne un token JWT en cas de succès.
3.  La logique de `get_current_user` reste fonctionnelle avec le token JWT.

### Story C: Mise à Jour du Frontend
**En tant que** développeur,
**Je veux** remplacer l'interface de connexion actuelle par une interface basée sur **Nom d'utilisateur/Mot de passe**,
**Afin que** les utilisateurs puissent se connecter de manière standard.

**Critères d'Acceptation :**
1.  La page `/login` est mise à jour avec des champs **"Nom d'utilisateur"** et "Mot de passe".
2.  Le formulaire de connexion appelle le nouvel endpoint `/auth/login`.
3.  Le token JWT reçu est correctement stocké et utilisé pour les requêtes suivantes.
4.  En cas d'échec de connexion (ex: identifiants incorrects), un message d'erreur clair et non-spécifique comme "Nom d'utilisateur ou mot de passe invalide" est affiché à l'utilisateur.
5.  Le système de `ProtectedRoute` et de déconnexion est fonctionnel avec ce nouveau flux.

### Story D: Ajout de la Robustesse et de l'Observabilité
**En tant que** mainteneur du système,
**Je veux** que le nouveau service d'authentification soit performant et observable,
**Afin de** garantir une expérience utilisateur fiable et de pouvoir diagnostiquer les problèmes de sécurité ou de performance.

**Critères d'Acceptation :**
1.  L'endpoint `POST /auth/login` a un temps de réponse moyen inférieur à 300ms en conditions de charge normales.
2.  Les tentatives de connexion réussies sont enregistrées (log) au niveau `INFO`, en incluant l'ID de l'utilisateur.
3.  Les tentatives de connexion échouées sont enregistrées (log) au niveau `WARN`, en incluant le **nom d'utilisateur** utilisé et l'adresse IP source.
4.  Un monitoring de base est en place pour suivre le taux d'erreur de l'endpoint `/auth/login`.