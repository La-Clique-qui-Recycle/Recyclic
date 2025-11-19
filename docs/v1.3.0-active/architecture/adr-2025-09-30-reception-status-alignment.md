# ADR: Alignement du champ `status` pour le schéma Réception

Date: 2025-09-30
Status: Proposed
Context: Les migrations actuelles utilisent `VARCHAR + CHECK` pour les colonnes `status` tandis que le modèle `PosteReception` est en `Enum` SQLAlchemy. Cette divergence peut créer un type ENUM Postgres implicite et des incohérences de validation.

## Options

### Option A (préconisée)
- `status` en `VARCHAR` avec contrainte `CHECK` définie dans les migrations.
- Modèles SQLAlchemy: `String` + validation applicative (Enum Python non mappé à SQL, utilisé pour validation côté code).
- Pro: Flexibilité d’évolution des valeurs; migrations explicites; pas d’ENUM Postgres lock-in.
- Cons: Validation répartie (DB + app), mais contrôlée par tests.

### Option B
- Vrai `ENUM` Postgres déclaré explicitement dans les migrations, et `Enum` SQLAlchemy aligné partout.
- Pro: Cohérence stricte DB↔ORM.
- Cons: Évolutions nécessitent ALTER TYPE; plus rigide.

## Décision
Choisir Option A. Aligner `poste_reception.status` et `ticket_depot.status` sur `VARCHAR` + `CHECK`. Côté ORM, utiliser `String` et valider via Enum Python au niveau service/schéma.

## Conséquences
- Mise à jour des modèles SQLAlchemy concernés.
- Vérifier les générateurs d’OpenAPI si exposés par schémas Pydantic.
- Ajouter/activer les tests Alembic et CRUD pour garantir la cohérence.


