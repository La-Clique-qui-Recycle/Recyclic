# Story b34-p7: Implémentation du Logout Audité

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Actuellement, la déconnexion d'un utilisateur est une opération purement côté client (suppression du token JWT du stockage local). Le serveur n'est pas informé de cette action. Pour un suivi de sécurité complet, il est important d'enregistrer également les événements de déconnexion explicite.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **pouvoir voir les événements de déconnexion dans l'historique d'un utilisateur et dans le journal d'audit** afin d'avoir une vision complète du cycle de vie de ses sessions.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau point d'API `POST /v1/auth/logout` DOIT être créé.
2.  Ce point d'API DOIT être protégé et ne peut être appelé que par un utilisateur authentifié.
3.  Lorsqu'il est appelé, l'endpoint DOIT enregistrer un événement dans la table `AuditLog` avec le type `LOGOUT`.
4.  L'événement d'audit DOIT contenir l'ID de l'utilisateur, son nom d'utilisateur, son adresse IP et son User-Agent.

**Frontend :**
5.  La logique de déconnexion dans le store d'authentification (`authStore.ts`) DOIT être modifiée.
6.  Avant de supprimer le token du stockage local et de réinitialiser l'état, la fonction de déconnexion DOIT d'abord appeler le nouveau point d'API `POST /v1/auth/logout`.
7.  L'appel à l'API de logout NE DOIT PAS être bloquant. Même si l'appel échoue (ex: problème de réseau), le client DOIT quand même procéder à la déconnexion locale pour ne pas laisser l'utilisateur bloqué.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1`
- **Compte Admin :** `admintest1`
- **Compte Utilisateur (Bénévole) :** `usertest1`

## 5. Conseils pour l'Agent DEV

- **Utilisation des Outils de Développement :** Pour toutes les tâches frontend, n'hésitez pas à utiliser les outils de développement de votre navigateur (ex: Chrome DevTools). Ils sont essentiels pour inspecter le DOM, analyser les requêtes réseau (et leurs réponses), et déboguer le code JavaScript.

## 6. Notes Techniques

-   Cette story complète le cycle de vie de l'authentification dans le journal d'audit.
-   Puisque les tokens JWT sont sans état (stateless), cet endpoint de logout ne peut pas "invalider" le token côté serveur. Son but est purement l'enregistrement de l'événement à des fins d'audit. La vraie invalidation du token se fait par son expiration naturelle.
-   La gestion d'erreur côté client est importante : la déconnexion doit toujours réussir du point de vue de l'utilisateur.
