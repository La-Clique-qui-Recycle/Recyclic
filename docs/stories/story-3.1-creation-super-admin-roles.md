# Story 3.1 : Création du Super-Admin et Modèle de Rôles

## Status
Done

## Story
**En tant qu**'administrateur de la plateforme,
**je veux** un système de rôles et une commande pour créer un super-admin,
**afin de** pouvoir gérer les utilisateurs et sécuriser l'accès aux fonctionnalités d'administration.

## Critères d'Acceptation
1.  Le modèle `User` dans la base de données est étendu avec un champ `role`.
2.  Le champ `role` est un `Enum` contenant au minimum : `user`, `admin`, `super-admin`.
3.  Le modèle `User` est étendu avec un champ `status` pour gérer le cycle de vie de l'inscription.
4.  Le champ `status` est un `Enum` contenant : `pending`, `approved`, `rejected`.
5.  Une migration Alembic est créée pour appliquer ces changements au schéma de la base de données sans perte de données.
6.  Une commande CLI (via `typer` ou `argparse`) `create-super-admin` est disponible dans le backend.
7.  La commande `create-super-admin` accepte un `telegram_id` et un `full_name` comme arguments.
8.  L'exécution de la commande crée un nouvel utilisateur avec le rôle `super-admin` et le statut `approved`.
9.  Des tests unitaires sont ajoutés pour valider la logique du modèle `User` (valeurs par défaut des nouveaux champs).
10. Des tests d'intégration sont ajoutés pour valider le fonctionnement de la commande `create-super-admin`.

## Notes de Développement

### Modèle de Données (`api/src/recyclic_api/models/user.py`)
Le modèle SQLAlchemy `User` doit être modifié. En me basant sur le schéma existant et les requis, voici les changements à prévoir :
-   **Champ `role`**: Le `Enum` `UserRole` existe déjà mais doit être mis à jour pour inclure `super-admin`. Les rôles finaux devraient être `user`, `admin`, `super-admin`.
-   **Champ `status`**: Un nouvel `Enum` `UserStatus` (`pending`, `approved`, `rejected`) doit être créé et ajouté au modèle `User`. Le statut par défaut pour un nouvel utilisateur devrait être `pending`.

### Commande CLI
La commande `create-super-admin` sera intégrée au `main.py` de l'API en utilisant `typer` pour une interface simple. Elle devra initialiser une session de base de données pour créer l'utilisateur.
-   **Localisation** : `api/src/cli.py` (nouveau fichier à créer).
-   **Logique** : La commande devra créer un utilisateur, lui assigner le rôle `super-admin` et le statut `approved`, puis l'enregistrer en base de données.
-   **Note pour les tests** : Pour les besoins des tests et pour éviter d'utiliser des comptes personnels, la commande doit permettre l'utilisation d'un **ID Telegram factice** (par exemple, un simple nombre comme `123456789`).

### Migration de Base de Données
Une nouvelle migration Alembic devra être générée après modification du modèle `User`.
-   **Commande** : `alembic revision --autogenerate -m "add_roles_and_status_to_user"`
-   **Vérification** : Le script de migration doit être inspecté pour s'assurer qu'il est correct et réversible.
-   **Référence Archon** : Avant de finaliser la migration, il est impératif de **consulter la documentation SQLAlchemy disponible sur Archon** pour s'assurer que les bonnes pratiques de migration, notamment pour les `Enum` avec Alembic, sont respectées.

### Fichiers à Modifier
-   `api/src/recyclic_api/models/user.py`: Mettre à jour le modèle `User`.
-   `api/src/cli.py`: (Nouveau) Créer la commande CLI.
-   `api/src/main.py`: Intégrer le module CLI.
-   `migrations/versions/`: Nouveau fichier de migration.
-   `api/tests/models/test_user.py`: (Nouveau ou à compléter) Tests pour le modèle.
-   `api/tests/cli/test_cli.py`: (Nouveau) Tests pour la commande `create-super-admin`.

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

L'implémentation de la story 3.1 est **complète et fonctionnelle**. Tous les critères d'acceptation ont été satisfaits avec une qualité de code élevée :

- ✅ **Modèle User étendu** : Les champs `role` et `status` ont été correctement ajoutés avec les enums appropriés
- ✅ **Enums bien définis** : `UserRole` inclut `super-admin` et `UserStatus` contient les valeurs requises
- ✅ **Migration créée** : Migration Alembic fonctionnelle pour les nouveaux champs
- ✅ **CLI opérationnel** : Commande `create-super-admin` fonctionne correctement
- ✅ **Tests complets** : Tests unitaires et d'intégration bien structurés

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et suit les bonnes pratiques.

### Compliance Check

- **Coding Standards**: ✓ Code propre et bien documenté
- **Project Structure**: ✓ Respect de l'architecture du projet
- **Testing Strategy**: ✓ Tests complets couvrant tous les cas
- **All ACs Met**: ✓ Tous les critères d'acceptation satisfaits

### Improvements Checklist

- [x] Modèle User avec champs role et status implémenté
- [x] Enums UserRole et UserStatus créés avec bonnes valeurs
- [x] Migration Alembic générée et fonctionnelle
- [x] Commande CLI create-super-admin opérationnelle
- [x] Tests unitaires pour le modèle User
- [x] Tests d'intégration pour la commande CLI
- [x] Gestion des erreurs et cas d'usage appropriés

### Security Review

**PASS** - Aucun problème de sécurité identifié :
- Les enums limitent les valeurs possibles pour role et status
- La commande CLI vérifie l'unicité du telegram_id
- Gestion appropriée des erreurs de base de données

### Performance Considerations

**PASS** - Performance satisfaisante :
- Index sur telegram_id pour les requêtes rapides
- Utilisation appropriée des sessions de base de données
- Pas de requêtes N+1 ou de problèmes de performance

### Files Modified During Review

Aucun fichier modifié - l'implémentation était déjà complète et correcte.

### Gate Status

Gate: **PASS** → docs/qa/gates/3.1-creation-super-admin-roles.yml

### Recommended Status

✓ **Ready for Done** - Tous les critères d'acceptation sont satisfaits et l'implémentation est de qualité production.