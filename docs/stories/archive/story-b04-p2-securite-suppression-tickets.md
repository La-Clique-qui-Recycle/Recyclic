# Story (Sécurité): Contrôle d'Accès aux Actions de Suppression

**ID:** STORY-B04-P2
**Titre:** Contrôle d'Accès aux Actions de Suppression dans le Module de Réception
**Epic:** Module de Réception
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** administrateur,  
**Je veux** que seules les personnes autorisées (admins et super-admins) puissent supprimer des lignes d'un ticket ou un ticket de réception entier,  
**Afin de** garantir l'intégrité des données et d'éviter les suppressions accidentelles ou non autorisées.

## Contexte

Actuellement, les actions de suppression dans le module de réception pourraient être accessibles à tous les utilisateurs. Cette story vise à restreindre ces actions critiques aux seuls administrateurs.

## Critères d'Acceptation

### Partie Frontend

1.  Dans l'interface de réception, les boutons permettant de supprimer une ligne d'un ticket ne sont visibles et accessibles que si l'utilisateur connecté a le rôle `ADMIN` ou `SUPER_ADMIN`.
2.  Si une fonctionnalité de suppression de ticket entier existe ou est ajoutée, le bouton correspondant n'est visible et accessible que pour les rôles `ADMIN` et `SUPER_ADMIN`.

### Partie Backend

3.  L'endpoint de l'API pour supprimer une ligne de ticket (ex: `DELETE /api/v1/reception/lignes/{id}`) est protégé et ne peut être appelé avec succès que par un utilisateur authentifié avec le rôle `ADMIN` ou `SUPER_ADMIN`.
4.  Si un endpoint de suppression de ticket entier existe ou est ajouté (ex: `DELETE /api/v1/reception/tickets/{id}`), il est également protégé par les mêmes rôles.
5.  Toute tentative de suppression par un utilisateur non autorisé doit résulter en une erreur `403 Forbidden`.

## Notes Techniques

-   Cette story nécessite une modification des dépendances de sécurité sur les endpoints de l'API concernés.
-   Côté frontend, il faudra utiliser le rôle de l'utilisateur stocké dans le contexte d'authentification pour conditionner l'affichage des boutons de suppression.

## Definition of Done

- [ ] Les boutons de suppression sont masqués pour les utilisateurs non-administrateurs.
- [ ] Les endpoints de l'API rejettent les tentatives de suppression par des utilisateurs non-administrateurs.
- [ ] La story a été validée par le Product Owner.
