# Story b33-p6: Activer la Gestion du Code PIN

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Pour améliorer l'efficacité sur les postes partagés (caisse, réception), un système de "fast user switching" basé sur un code PIN est envisagé. Avant de pouvoir implémenter la logique de switching, il est impératif que chaque utilisateur puisse avoir un code PIN personnel et sécurisé. Cette story pose les fondations de cette fonctionnalité.

L'investigation a confirmé que le champ `hashed_pin` existe déjà dans le modèle `User`, ce qui facilite grandement cette implémentation.

## 2. User Story (En tant que...)

-   En tant qu'**Utilisateur**, je veux **définir et modifier mon code PIN personnel à 4 chiffres** depuis ma page de profil afin de pouvoir utiliser les fonctionnalités de connexion rapide.
-   En tant qu'**Administrateur**, je veux **pouvoir réinitialiser le code PIN** d'un utilisateur s'il l'a oublié, afin de lui permettre d'en créer un nouveau.

## 3. Critères d'acceptation

**Backend :**
1.  Un nouveau point d'API (ex: `POST /v1/users/me/pin`) DOIT être créé pour permettre à un utilisateur connecté de définir ou de modifier son PIN.
2.  Pour des raisons de sécurité, la modification d'un PIN existant DOIT requérir le mot de passe actuel de l'utilisateur.
3.  Le code PIN reçu par l'API DOIT être hashé (ex: avec Bcrypt) avant d'être stocké dans le champ `hashed_pin`.
4.  Un nouveau point d'API admin (ex: `POST /v1/admin/users/{user_id}/reset-pin`) DOIT être créé.
5.  Cet endpoint admin DOIT effacer le `hashed_pin` de l'utilisateur (le mettre à `NULL`), le forçant ainsi à en créer un nouveau lors de sa prochaine visite sur sa page de profil.

**Frontend (Utilisateur) :**
6.  Une nouvelle section "Gestion du code PIN" DOIT être ajoutée à la page `/profile`.
7.  Si l'utilisateur n'a pas de PIN, l'interface DOIT lui proposer d'en créer un (un champ pour le PIN à 4 chiffres, un champ de confirmation).
8.  Si l'utilisateur a déjà un PIN, l'interface DOIT lui proposer de le modifier (un champ pour son mot de passe actuel, un champ pour le nouveau PIN, un champ de confirmation).
9.  L'interface DOIT fournir une validation claire (ex: 4 chiffres numériques uniquement).

**Frontend (Admin) :**
10. Un bouton "Réinitialiser le PIN" DOIT être ajouté à la vue de détail de l'utilisateur dans l'interface d'administration.
11. Cliquer sur ce bouton DOIT appeler l'endpoint de réinitialisation et afficher une confirmation.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (Pour tester la réinitialisation du PIN)
- **Compte Utilisateur :** `usertest1` (Pour définir/modifier son propre PIN sur `/profile`)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Le champ `hashed_pin` existe déjà dans le modèle `User`. Le backend se concentrera sur la création des endpoints pour le définir/modifier de manière sécurisée (en demandant le mot de passe). Le hashage du PIN (bcrypt) est obligatoire, ne jamais le stocker en clair.

## 6. Notes Techniques

-   Le hashage du PIN est non-négociable pour des raisons de sécurité. Ne jamais stocker le PIN en clair.
-   La logique de "fast user switching" elle-même n'est PAS dans le périmètre de cette story. Cette story se concentre uniquement sur la gestion (création, modification, réinitialisation) du PIN.
-   L'API de vérification du PIN (qui sera utilisée par le module de caisse) sera développée dans une story ultérieure, mais elle doit être gardée à l'esprit.
