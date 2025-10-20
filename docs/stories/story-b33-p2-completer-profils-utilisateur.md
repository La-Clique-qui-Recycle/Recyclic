# Story b33-p2: Compléter les Profils Utilisateur

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

Les profils utilisateurs actuels sont basiques et ne permettent pas de stocker des informations essentielles pour la gestion des bénévoles. De plus, des informations clés comme l'email ne sont pas intégrées de manière cohérente dans toutes les vues de l'administration. Cette story vise à enrichir le modèle de données utilisateur et à harmoniser les interfaces.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **consulter et gérer un profil utilisateur enrichi** avec des informations de contact et de gestion (téléphone, adresse, notes, etc.) afin d'avoir une vue à 360° des membres de l'association.

En tant qu'**Utilisateur**, je veux **pouvoir mettre à jour mes propres informations de contact** (téléphone, adresse) sur ma page de profil afin de maintenir mes données à jour.

## 3. Critères d'acceptation

**Backend :**
1.  Le modèle de données `User` (`api/src/recyclic_api/models/user.py`) DOIT être étendu pour inclure les nouveaux champs (tous optionnels) :
    -   `phone_number: str`
    -   `address: str`
    -   `notes: str` (texte long)
    -   `skills: str` (texte long)
    -   `availability: str` (texte long)
2.  Les schémas Pydantic (`api/src/recyclic_api/schemas/user.py` et `admin.py`) DOIVENT être mis à jour pour exposer ces nouveaux champs.
3.  Les points d'API de récupération (`GET /users/{id}`) et de mise à jour (`PUT /users/{id}`) DOIVENT supporter la lecture et la modification de ces champs.

**Frontend (Admin) :**
4.  La vue de détail d'un utilisateur dans `/admin/users` DOIT afficher tous les nouveaux champs (`email`, `phone_number`, `address`, `notes`, `skills`, `availability`).
5.  Le formulaire de modification du profil en mode admin DOIT permettre de modifier tous ces champs.
6.  Le formulaire de création d'un nouvel utilisateur DOIT inclure le champ `email` et les nouveaux champs pertinents.

**Frontend (Utilisateur) :**
7.  La page `/profile` DOIT permettre à l'utilisateur connecté de voir et de modifier son `phone_number` et son `address`.
8.  Les champs `notes`, `skills`, et `availability` NE DOIVENT PAS être visibles ni modifiables par l'utilisateur sur sa page `/profile`.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (Pour tester les vues d'administration)
- **Compte Utilisateur :** `usertest1` (Pour tester la page `/profile`)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Après avoir modifié le modèle `User` dans `api/src/recyclic_api/models/user.py`, n'oubliez pas de générer la migration de base de données avec `alembic revision --autogenerate -m 'add_iam_user_fields'` et de l'appliquer avec `alembic upgrade head`.

## 6. Notes Techniques

-   Le champ `email` existe déjà dans le modèle. Le travail consiste principalement à l'intégrer dans les vues admin où il est manquant.
-   Il faudra générer une nouvelle migration de base de données (Alembic) pour refléter les changements sur le modèle `User`.
-   La séparation des données (ce qui est visible par l'utilisateur vs l'admin) est un point crucial de l'implémentation.
-   Penser à la validation des données (ex: format du numéro de téléphone, même si une validation simple côté client est suffisante pour commencer).
