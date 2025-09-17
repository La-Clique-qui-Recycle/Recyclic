# Epic Tech-Debt: Refonte de l'Authentification - Stories Suivantes

Ce document détaille les stories à exécuter après la finalisation de la **Story A : Mise à Jour de la Base de Données**.

---

### Story B: Adaptation du Backend et de la CLI

**En tant que** développeur,
**Je veux** adapter la logique du backend pour gérer la création et la vérification des mots de passe basés sur un nom d'utilisateur,
**Afin de** permettre une authentification sécurisée.

**Critères d'Acceptation :**
1.  La commande CLI `create-super-admin` est mise à jour pour accepter un `--username` et un `--password`.
2.  La commande hash le mot de passe fourni avant de le sauvegarder en base de données.
3.  Un nouvel endpoint `POST /auth/login` est créé. Il accepte un `username` et un mot de passe, les vérifie, et retourne un token JWT en cas de succès.
4.  L'endpoint retourne une erreur 401 claire en cas d'échec d'authentification.

---

### Story C: Mise à Jour du Frontend (Connexion)

**En tant que** développeur,
**Je veux** remplacer l'interface de connexion actuelle par une interface basée sur un nom d'utilisateur et un mot de passe,
**Afin que** les utilisateurs puissent se connecter de manière standard et sécurisée.

**Critères d'Acceptation :**
1.  La page `/login` est mise à jour avec des champs "Nom d'utilisateur" et "Mot de passe".
2.  Le store Zustand `authStore` est utilisé pour gérer l'état de la connexion.
3.  La soumission du formulaire appelle le nouvel endpoint `/auth/login`.
4.  En cas de succès, le token JWT reçu est correctement stocké et l'état de l'application est mis à jour.
5.  En cas d'échec, un message d'erreur clair est affiché à l'utilisateur.

---

### Story D: Nouveau Workflow d'Inscription Utilisateur

**En tant que** nouvel utilisateur,
**Je veux** pouvoir créer mon propre compte avec un nom d'utilisateur et un mot de passe,
**Afin de** ne pas dépendre d'une validation manuelle pour commencer le processus d'inscription.

**Critères d'Acceptation :**
1.  Une nouvelle page `/signup` est créée avec un formulaire (Nom d'utilisateur, Email (optionnel), Mot de passe, Confirmation du mot de passe).
2.  Un nouvel endpoint API `POST /auth/signup` est créé.
3.  Cet endpoint crée un nouvel utilisateur avec le `role` par défaut (`user`) et le `status` par défaut (`pending`).
4.  Le mot de passe est hashé avant d'être stocké.
5.  Après l'inscription, l'utilisateur est informé que son compte est en attente de validation par un administrateur.

---

### Story E: Gestion du Mot de Passe Oublié

**En tant qu**'utilisateur ayant oublié son mot de passe,
**Je veux** un moyen de réinitialiser mon mot de passe de manière autonome,
**Afin de** pouvoir récupérer l'accès à mon compte sans aide manuelle.

**Critères d'Acceptation :**
1.  Un lien "Mot de passe oublié ?" est présent sur la page `/login`.
2.  Ce lien mène à une page où l'utilisateur peut entrer son adresse email (utilisée pour la communication).
3.  Un nouvel endpoint API `POST /auth/forgot-password` est créé. Il génère un token de réinitialisation unique et l'envoie à l'email de l'utilisateur (nécessite un service d'envoi d'emails).
4.  Une nouvelle page `/reset-password?token=<token>` permet à l'utilisateur de définir un nouveau mot de passe.
5.  Un nouvel endpoint API `POST /auth/reset-password` valide le token et met à jour le mot de passe hashé de l'utilisateur.