# Story: DB - Création du Schéma de Réception

**User Story**
En tant qu'architecte système,
Je veux un schéma de base de données robuste, normalisé et évolutif pour le nouveau processus de réception,
Afin de construire des fonctionnalités fiables sur une fondation technique saine et de préparer le terrain pour les évolutions futures (L2/L3, mapping).

**Story Context**

*   **Raison d'être :** Cette story est la première étape de l'Epic de refonte de la réception. Elle remplace l'ancien système de catégories rigide (Enums, Strings) par un modèle relationnel et hiérarchique, comme défini dans la nouvelle spécification fonctionnelle.
*   **Technologie :** PostgreSQL, SQLAlchemy, Alembic pour les migrations.

**Critères d'Acceptation**

1.  Une nouvelle migration Alembic doit être créée.
2.  La migration doit créer les tables suivantes avec les colonnes spécifiées :
    *   **`dom_category`** : `id`, `parent_id` (FK sur elle-même, nullable), `level` (integer), `label`, `slug`, `active` (boolean), `l1_root_id` (FK sur elle-même).
    *   **`dom_category_closure`** : `ancestor_id` (FK vers `dom_category`), `descendant_id` (FK vers `dom_category`), `depth` (integer). Une clé primaire composite sur (`ancestor_id`, `descendant_id`) doit être définie.
    *   **`poste_reception`** : `id`, `opened_by_user_id` (FK vers `users`), `opened_at`, `closed_at` (nullable), `status`.
    *   **`ticket_depot`** : `id`, `poste_id` (FK vers `poste_reception`), `benevole_user_id` (FK vers `users`), `created_at`, `closed_at` (nullable), `status`.
    *   **`ligne_depot`** : `id`, `ticket_id` (FK vers `ticket_depot`), `dom_category_id` (FK vers `dom_category`), `poids_kg` (Decimal/Numeric), `notes` (nullable).
3.  Les modèles SQLAlchemy correspondants à ces tables doivent être créés dans le répertoire `api/src/recyclic_api/models/`.
4.  Une deuxième migration (ou un script de données séparé) doit être créée pour "seeder" la table `dom_category` avec les 14 catégories L1 et leur enregistrement de fermeture correspondant (depth=0).
5.  La migration doit être réversible (`alembic downgrade` doit fonctionner et supprimer les tables).

**Notes Techniques**

*   Utiliser Alembic pour générer et appliquer les migrations.
*   Le type de la colonne `poids_kg` doit être `Decimal` ou `Numeric` pour éviter les problèmes d'arrondi avec les `Float`.
*   Les relations (`relationship`) entre les modèles SQLAlchemy doivent être définies (ex: un ticket a plusieurs lignes, une ligne appartient à un ticket).

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** Faible. Ces tables sont nouvelles et n'interfèrent avec aucune table existante. Le principal risque est une erreur dans le modèle de données qui serait coûteuse à corriger plus tard.
*   **Atténuation :** Le modèle est basé sur une spécification détaillée et des pratiques standards (table de fermeture). Une relecture attentive des modèles et de la migration est nécessaire avant l'application.
*   **Rollback :** Utiliser `alembic downgrade` pour annuler la migration.
