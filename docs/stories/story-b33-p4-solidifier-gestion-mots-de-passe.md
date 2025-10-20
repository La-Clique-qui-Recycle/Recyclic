# Story b33-p4: Solidifier la Gestion des Mots de Passe

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

La gestion des mots de passe est une fonctionnalité de sécurité critique. Actuellement, plusieurs mécanismes existent (formulaire sur `/profile`, bouton en admin, potentiel flux public) mais ils ne sont pas harmonisés, entièrement fonctionnels ou sécurisés. Cette story vise à auditer, finaliser et sécuriser tous les parcours liés à la gestion des mots de passe.

## 2. User Story (En tant que...)

-   En tant qu'**Utilisateur**, je veux **pouvoir réinitialiser mon mot de passe si je l'ai oublié** via un processus simple et sécurisé depuis la page de connexion.
-   En tant qu'**Utilisateur connecté**, je veux **pouvoir changer mon propre mot de passe** depuis ma page de profil.
-   En tant qu'**Administrateur**, je veux **pouvoir envoyer un email de réinitialisation** à un utilisateur pour l'aider en cas de problème.
-   En tant que **Super Administrateur**, je veux **pouvoir forcer un nouveau mot de passe** pour un utilisateur en cas d'urgence ou de compromission de compte.

## 3. Critères d'acceptation

**Flux Public "Mot de passe oublié" :**
1.  Le lien "Mot de passe oublié ?" sur la page de connexion (`Login.tsx`) DOIT être fonctionnel.
2.  Il DOIT mener à une page (`ForgotPassword.tsx`) où l'utilisateur peut entrer son email.
3.  La soumission de l'email DOIT appeler un point d'API qui envoie un email à l'utilisateur avec un lien de réinitialisation contenant un token sécurisé et à durée de vie limitée.
4.  Ce lien DOIT mener à une page (`ResetPassword.tsx`) où l'utilisateur peut définir un nouveau mot de passe.

**Flux Utilisateur Connecté (`/profile`) :**
5.  Le formulaire "Changer le mot de passe" sur la page `/profile` DOIT être fonctionnel.
6.  Il DOIT demander le mot de passe actuel et une confirmation du nouveau mot de passe.
7.  La soumission DOIT appeler un point d'API sécurisé pour mettre à jour le `hashed_password` de l'utilisateur.

**Flux Admin (Support) :**
8.  Le bouton "Réinitialiser le mot de passe" dans la vue admin DOIT appeler le point d'API `POST /v1/admin/users/{user_id}/reset-password`.
9.  L'appel DOIT fonctionner si l'utilisateur a une adresse email enregistrée.
10. Une notification de succès ou d'échec DOIT être affichée à l'admin.

**Flux Super Admin (Urgence) :**
11. Un nouveau point d'API (ex: `POST /v1/admin/users/{user_id}/force-password`) DOIT être créé.
12. Cet endpoint DOIT être protégé pour n'être accessible qu'aux `SUPER_ADMINS`.
13. Une nouvelle interface (ex: bouton + modal) DOIT être ajoutée dans la vue admin, visible uniquement par les `SUPER_ADMINS`.
14. Cette interface DOIT permettre de définir un nouveau mot de passe pour l'utilisateur cible.
15. L'action de forçage de mot de passe DOIT être enregistrée de manière détaillée dans le journal d'audit / l'historique de l'utilisateur.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Super Admin :** `superadmintest1` (Pour tester le forçage de mot de passe)
- **Compte Admin :** `admintest1` (Pour tester l'envoi de l'email de réinitialisation)
- **Compte Utilisateur :** `usertest1` (Pour tester le changement depuis `/profile`)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** La sécurité est la priorité absolue ici. Assurez-vous que tous les mots de passe sont hashés avec bcrypt et que les tokens de réinitialisation (JWT) sont à usage unique et ont une courte durée de vie. Testez chaque flux (public, utilisateur, admin, super admin) de manière isolée.

## 6. Notes Techniques

-   Cette story nécessite des interventions à la fois sur le backend (création d'endpoint, sécurisation) and le frontend (formulaires, appels API).
-   La sécurité est primordiale : utilisation de tokens JWT à usage unique pour la réinitialisation, politique de mot de passe robuste (longueur minimale), et hashage systématique des mots de passe (Bcrypt).
-   La logique d'envoi d'email via le service existant (Brevo, etc.) sera utilisée.
-   La différenciation des droits (`ADMIN` vs `SUPER_ADMIN`) doit être rigoureusement implémentée et testée.
