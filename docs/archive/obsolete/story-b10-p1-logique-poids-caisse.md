# Story (Logique Métier): Refonte de la Saisie du Poids en Caisse

**ID:** STORY-B10-P1
**Titre:** Refonte de l'Étape "Quantité" en "Poids" et Découplage du Prix
**Epic:** Refonte du Workflow de Caisse
**Priorité:** P1 (Critique)
**Statut:** Done
**Agent Model Used:** claude-sonnet-4-5-20250929

---

## User Story

**En tant que** Caissier,
**Je veux** que l'étape de saisie de la "quantité" soit en fait une saisie de "poids" en kg, avec des décimales, et qu'elle soit indépendante du prix,
**Afin de** pouvoir enregistrer les ventes conformément à la logique métier de la ressourcerie.

## Acceptance Criteria

1.  Dans le workflow de saisie de la caisse, l'étape et le libellé "Quantité" sont renommés en "Poids".
2.  Le pavé numérique pour la saisie du poids inclut un bouton pour le séparateur décimal.
3.  La saisie du poids se comporte comme un masque de saisie monétaire (ex: `1`, `2`, `3` -> `1.23`).
4.  Le calcul du total d'une ligne est simplement le prix entré ; il n'y a plus de multiplication `poids * prix`.
5.  Le poids et le prix sont enregistrés comme deux champs distincts pour chaque ligne de vente.

## Tasks / Subtasks

**Backend:**
- [x] **Migration :** Créer une migration Alembic pour ajouter une colonne `weight` (de type `Float` ou `Numeric`) à la table `sale_lines` (ou nom équivalent).
- [x] **Modèle & Schéma :** Mettre à jour le modèle SQLAlchemy et les schémas Pydantic pour inclure le nouveau champ `weight`.
- [x] **Logique API :** Modifier l'endpoint de création de vente pour qu'il accepte et enregistre le `weight` pour chaque ligne, et s'assurer que le calcul du total n'implique plus de multiplication.
- [x] **Tests :** Mettre à jour les tests d'intégration existants pour refléter la nouvelle logique de sauvegarde (poids + prix).

**Frontend:**
- [x] **Libellés :** Renommer tous les libellés "Quantité" en "Poids" dans l'interface de caisse.
- [x] **Composant Pavé Numérique :** Réutiliser ou adapter le composant de saisie avec masque décimal (similaire à celui du module de réception).
- [x] **Logique d'état :** Mettre à jour l'état de l'application (store Zustand/Redux) pour gérer le `poids` au lieu de la `quantité`.
- [x] **Calcul Affichage :** Supprimer la logique de multiplication `poids * prix` de l'affichage du ticket de caisse.

## Dev Notes

-   **Réutilisation :** La logique du masque de saisie décimale a déjà été implémentée pour le module de réception (`STORY-B08-P2`). Il est fortement recommandé de réutiliser ce composant ou cette logique pour assurer la cohérence.
-   **Impact Backend :** Les modifications du backend sont critiques pour assurer la persistance correcte des données de vente.

## Definition of Done

- [x] L'étape "Quantité" est devenue "Poids".
- [x] La saisie du poids avec décimales est fonctionnelle.
- [x] Le calcul du prix est découplé du poids.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### Completion Notes
- Migration Alembic créée et appliquée pour ajouter la colonne `weight` à `sale_items`
- Modèle SQLAlchemy et schémas Pydantic mis à jour avec le champ `weight`
- Endpoint API modifié pour accepter et enregistrer le poids (logique de multiplication supprimée)
- Tests d'intégration backend mis à jour et tous les tests passent (4/4)
- Interface frontend modifiée : "Quantité" → "Poids"
- Réutilisation du masque de saisie décimale du module de réception (weightMask.ts)
- Store Zustand mis à jour pour gérer le poids au lieu de la quantité
- Logique de multiplication supprimée de l'affichage du ticket
- Build frontend réussi sans erreurs TypeScript

### File List
**Backend:**
- `api/migrations/versions/d2e3f4g5h6i7_add_weight_to_sale_items.py` (créé)
- `api/src/recyclic_api/models/sale_item.py` (modifié)
- `api/src/recyclic_api/schemas/sale.py` (modifié)
- `api/src/recyclic_api/api/api_v1/endpoints/sales.py` (modifié)
- `api/tests/test_sales_integration.py` (modifié)

**Frontend:**
- `frontend/src/pages/CashRegister/Sale.tsx` (modifié)
- `frontend/src/stores/cashSessionStore.ts` (modifié)
- `frontend/src/components/business/Ticket.tsx` (modifié)

### Change Log
- Ajout de la colonne `weight` (Float) à la table `sale_items`
- Refonte de l'interface de saisie : mode "Quantité" → mode "Poids" avec décimales
- Suppression du calcul `total = quantity * price` → `total = price`
- Réutilisation de l'utilitaire `weightMask.ts` pour la saisie décimale