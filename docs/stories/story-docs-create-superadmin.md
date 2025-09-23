# Story (Documentation): Documenter la Création du Superadmin

**ID:** STORY-DOCS-CREATE-SUPERADMIN
**Titre:** Documenter la Procédure de Création du Superadmin
**Epic:** Maintenance & Documentation
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant que** nouveau Développeur,  
**Je veux** trouver facilement la commande pour créer le premier utilisateur superadmin,  
**Afin de** pouvoir initialiser l'application rapidement et sans avoir à chercher dans le code.

## Contexte

Actuellement, la commande pour créer le superadmin n'est pas documentée de manière évidente, ce qui peut ralentir la mise en place d'un nouvel environnement de développement.

## Critères d'Acceptation

1.  Le fichier `README.md` à la racine du projet est mis à jour.
2.  Une nouvelle section (par exemple, "Démarrage Rapide" ou "Initialisation") est ajoutée.
3.  Cette section contient les deux commandes essentielles à exécuter après un `docker-compose up` :
    -   La commande pour lancer les migrations : `docker-compose run --rm api-migrations alembic upgrade head`
    -   La commande pour créer le superadmin : `docker-compose run --rm api ./create_admin.sh <username> <password>` (avec un exemple).

## Definition of Done

- [ ] Le `README.md` est mis à jour avec les instructions claires.
- [ ] La story a été validée par le Product Owner.
