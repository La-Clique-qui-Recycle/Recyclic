# Story (Bug): Échec de la Création d'Utilisateur en CLI à cause d'une Incompatibilité de Dépendances

**ID:** STORY-BUG-BCRYPT-CLI
**Titre:** Échec de la Création d'Utilisateur en CLI à cause d'une Incompatibilité de Dépendances
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Bloquant)

---

## Objectif

**En tant que** Développeur,  
**Je veux** que le script de création d'utilisateur en ligne de commande (`create_admin.sh`) fonctionne sans erreur,  
**Afin de** pouvoir recréer un utilisateur administrateur lorsque la base de données est vide et de débloquer l'accès à l'application.

## Contexte

En tentant de créer un super-admin via le script `api/create_admin.sh` (qui appelle `recyclic_api.cli create-super-admin`), une erreur se produit : `AttributeError: module 'bcrypt' has no attribute '__about__'`. Cette erreur est levée par la bibliothèque `passlib` et indique une incompatibilité de version avec la bibliothèque `bcrypt`.

**Impact :** Cette erreur est bloquante. Il est actuellement impossible de créer un nouvel utilisateur si la base de données est vide, ce qui rend l'application inutilisable.

## Critères d'Acceptation

1.  L'exécution de la commande `docker-compose exec api sh -c "./create_admin.sh <username> <password>"` se termine avec succès.
2.  Un nouvel utilisateur avec le rôle `SUPER_ADMIN` est créé dans la base de données.
3.  L'erreur `AttributeError: module 'bcrypt' has no attribute '__about__'` n'apparaît plus.

## Notes Techniques

-   **Cause probable :** Une version de `bcrypt` est installée qui n'est pas entièrement compatible avec la version de `passlib` utilisée. `passlib` s'attend à trouver une variable `__version__` dans un sous-module `__about__` de `bcrypt`, qui n'existe pas.
-   **Pistes de correction :**
    1.  **Mettre à jour les dépendances :** Mettre à jour `passlib` et `bcrypt` à leurs dernières versions stables pourrait résoudre le problème.
    2.  **Figer les versions :** Identifier une combinaison de versions de `passlib` et `bcrypt` qui sont compatibles et les figer dans le fichier `requirements.txt`.
    3.  **Contournement :** Si une mise à jour n'est pas possible, il pourrait être nécessaire de modifier le code de `passlib` (ce qui est déconseillé) ou de trouver une autre bibliothèque de hachage de mot de passe.

## Definition of Done

- [ ] Le script `create_admin.sh` est fonctionnel.
- [ ] Un nouvel utilisateur super-admin peut être créé avec succès.
- [ ] La story a été validée par le Product Owner.
