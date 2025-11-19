---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.930497
original_path: docs/stories/story-chore-seed-categories.md
---

# Story (Tâche): Peuplement Initial des Catégories et des Prix

**ID:** STORY-CHORE-SEED-CATEGORIES
**Titre:** Peuplement Initial de la Base de Données avec les Catégories et les Prix
**Epic:** Maintenance & Configuration
**Priorité:** P0 (Critique)
**Statut:** Ready for Review

---

## User Story

**En tant que** Développeur,
**Je veux** un script qui peuple la base de données avec la liste prédéfinie de catégories, sous-catégories et prix,
**Afin que** le module de caisse soit immédiatement utilisable avec les données métier réelles.

## Acceptance Criteria

1.  Un script (de préférence une migration de données Alembic) est créé.
2.  Après exécution du script, la table `categories` contient toutes les catégories et sous-catégories listées dans les Dev Notes.
3.  Les relations parent-enfant sont correctement établies.
4.  Les champs `price` (prix minimum) et `max_price` sont correctement remplis pour chaque sous-catégorie, en suivant la règle :
    -   Si `Prix max` est vide, `price` est défini et `max_price` est `NULL`.
    -   Si `Prix max` a une valeur, `price` et `max_price` sont définis.
5.  Le script est idempotent (on peut le lancer plusieurs fois sans créer de doublons).

## Tasks / Subtasks

- [x] **Écriture du Script :**
    - [x] Créer un nouveau fichier de migration Alembic (`alembic revision --message="Seed initial categories and prices"`).
    - [x] Dans la fonction `upgrade`, écrire la logique pour :
        -   Vérifier si les catégories existent déjà pour garantir l'idempotence.
        -   Parcourir les données fournies dans les Dev Notes.
        -   Créer les catégories principales.
        -   Créer les sous-catégories en les liant à leur parent et en définissant les champs `price` et `max_price` selon la règle spécifiée.
- [x] **Tests :**
    - [x] Exécuter le script sur une base de données de développement vide.
    - [x] Vérifier manuellement ou via une requête SQL que les données ont été créées conformément à la table dans les Dev Notes.

## Dev Notes

-   C'est une migration de données critique pour le démarrage de l'application.
-   **Source de Données :** Le script doit implémenter la structure suivante :

| **Catégorie racine**                | **Sous-catégorie**                         | **Prix min (€)** | **Prix max (€)** |
| ----------------------------------- | ------------------------------------------ | ---------------- | ---------------- |
| **Vaisselle & Cuisine / Maison**    | Verre                                      | 0,50             |                  |
|                                     | Plat                                       | 3,00             |                  |
|                                     | Casserole                                  | 3,00             |                  |
|                                     | Cocotte                                    | 8,00             |                  |
|                                     | Couvert                                    | 0,20             |                  |
| **Électroménager**                  | Frigidaire                                 | 30,00            |                  |
|                                     | Plaque cuisson                             | 15,00            |                  |
|                                     | Raclette                                   | 10,00            |                  |
|                                     | Mixer main                                 | 5,00             |                  |
| **Sports & Loisirs**                | Instrument de musique                      | 5,00             | 30,00            |
|                                     | Ballon plastique                           | 0,50             |                  |
|                                     | Ballon en cuir                             | 2,00             |                  |
|                                     | Vélo elliptique, rameur, etc.              | 20,00            |                  |
|                                     | Vélo adulte (hors asso)                    | 20,00            |                  |
|                                     | Vélo enfant                                | 10,00            |                  |
| **Ameublement & Literie**           | Gros meuble en bois massif                 | 30,00            |                  |
|                                     | Gros meuble en plastique/stratifié         | 20,00            |                  |
|                                     | Meuble moyen en bois massif                | 30,00            |                  |
|                                     | Meuble moyen en plastique/stratifié        | 20,00            |                  |
|                                     | Petit meuble/chaise en bois massif         | 12,00            |                  |
|                                     | Petit meuble/chaise en plastique/stratifié | 8,00             |                  |
| **Luminaires & Décoration**         | Cadre / Tableau                            | 0,50             |                  |
|                                     | Lampe                                      | 3,00             |                  |
| **Textiles – Linge – Chaussures**   | Manteaux adultes                           | 5,00             |                  |
|                                     | Manteaux enfants                           | 3,00             |                  |
|                                     | Jupe longue, robe, pantalon, pull          | 3,00             |                  |
|                                     | Chemise, top                               | 3,00             |                  |
|                                     | T-shirt                                    | 2,00             |                  |
|                                     | Sac                                        | 3,00             |                  |
|                                     | Chaussures                                 | 3,00             |                  |
|                                     | Chaussures enfants                         | 2,00             |                  |
|                                     | Drap                                       | 3,00             |                  |
|                                     | Taie                                       | 1,00             |                  |
|                                     | Drap ancien                                | 12,00            |                  |
| **Livres & Médias**                 | Livre                                      | 1,00             |                  |
| **Mobilité douce**                  | —                                          |                  |                  |
| **Bricolage & Outils**              | —                                          |                  |                  |
| **Électronique / IT / Audio-vidéo** | —                                          |                  |                  |
| **Jardin & Extérieur**              | —                                          |                  |                  |
| **Jouets**                          | —                                          |                  |                  |
| **Puériculture & Bébé**             | —                                          |                  |                  |
| **Matériaux & Bâtiment**            | —                                          |                  |                  |

## Dev Agent Record

### Agent Model Used
- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes
- Migration créée: `n1o2p3q4r5s6_seed_initial_categories.py`
- 14 catégories racines créées
- 35 sous-catégories créées avec leurs prix respectifs
- Logique idempotente implémentée (vérifie si des catégories existent avant de peupler)
- Fonction downgrade implémentée pour permettre le rollback
- Testé et vérifié via requêtes SQL

### File List
- `api/migrations/versions/n1o2p3q4r5s6_seed_initial_categories.py` (créé)

### Change Log
- 2025-10-07: Création de la migration de seed des catégories avec prix min et max

## Definition of Done

- [x] Le script de peuplement est créé et fonctionnel.
- [x] La base de données de développement est peuplée avec les données correctes.
- [ ] La story a été validée par un agent QA.