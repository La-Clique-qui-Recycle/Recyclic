# Story (Feature): Création d'un Nouvel Utilisateur

**ID:** STORY-FEATURE-USER-CREATION
**Titre:** Implémentation de la Création d'un Nouvel Utilisateur
**Epic:** Construction du Dashboard d'Administration Centralisé
**Priorité:** P2 (Élevée)
**Statut:** Draft

---

## User Story

**En tant qu'** administrateur,
**Je veux** créer de nouveaux utilisateurs directement depuis l'interface d'administration,
**Afin de** pouvoir provisionner de nouveaux comptes facilement.

## Acceptance Criteria

1.  Un bouton "Créer un utilisateur" est présent sur la page de la liste des utilisateurs.
2.  Cliquer sur ce bouton ouvre une modale ou un formulaire pour saisir les informations du nouvel utilisateur (prénom, nom, email, mot de passe, rôle).
3.  La soumission du formulaire avec des données valides crée un nouvel utilisateur en base de données.
4.  Le nouvel utilisateur apparaît dans la liste des utilisateurs après sa création.

## Dev Notes

- Suggestion de l'utilisateur : Réutiliser le formulaire/la modale de modification de profil pour la création.
- Cela nécessitera un nouveau endpoint backend `POST /api/v1/users`.
