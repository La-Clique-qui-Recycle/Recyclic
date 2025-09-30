# Story: DB - Ajout de la Colonne Destination

**User Story**
En tant que système,
Je veux que les lignes de dépôt aient une destination,
Afin de pouvoir trier les objets entre le magasin, le recyclage et la déchèterie.

**Story Context**

*   **Dépendance :** `story-db-reception-schema.md`. La table `ligne_depot` doit exister.
*   **Raison d'être :** Ajoute le champ critique `destination` qui a été identifié comme manquant pour le MVP. C'est un prérequis pour la story de l'API des lignes.
*   **Technologie :** PostgreSQL, SQLAlchemy, Alembic.

**Critères d'Acceptation**

1.  Une nouvelle migration Alembic doit être créée.
2.  La migration doit ajouter une colonne `destination` à la table `ligne_depot`.
3.  Le type de la colonne doit être un `Enum` avec les valeurs possibles : `MAGASIN`, `RECYCLAGE`, `DECHETERIE`.
4.  La colonne ne doit pas autoriser de valeur nulle (`nullable=False`).
5.  La migration doit être réversible.

**Notes Techniques**

*   **Workflow Git :**
    *   1. Créez une nouvelle branche pour cette story à partir de `feature/mvp-reception-v1`.
    *   2. Nommez votre branche : `story/db-add-destination-column`.
    *   3. Une fois terminée, ouvrez une PR vers `feature/mvp-reception-v1`.
