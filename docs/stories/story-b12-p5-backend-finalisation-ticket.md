# Story (Backend): Logique de Finalisation du Ticket de Vente

**ID:** STORY-B12-P5
**Titre:** Logique de Finalisation du Ticket de Vente
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Backend,  
**Je veux** un endpoint API robuste pour finaliser une vente,  
**Afin de** sauvegarder de manière atomique toutes les informations du ticket de caisse en base de données.

## Contexte

Cette story est la dernière étape du workflow de vente. Elle est déclenchée par le bouton "Valider le ticket" et doit garantir que la vente est enregistrée de manière fiable et complète.

## Critères d'Acceptation

1.  Un nouvel endpoint `POST /api/v1/sales/finalize` est créé.
2.  L'endpoint accepte un payload contenant un tableau de lignes de vente. Chaque ligne doit contenir au minimum : `subcategory_id`, `quantite`, `poids`, `prix`.
3.  La logique de l'endpoint effectue les actions suivantes dans une **transaction de base de données unique** :
    -   Crée un enregistrement principal `Sale`.
    -   Crée plusieurs enregistrements `SaleLine` (un pour chaque ligne du payload) et les lie à l'enregistrement `Sale`.
4.  L'endpoint est protégé et accessible aux utilisateurs authentifiés ayant le droit d'utiliser la caisse.
5.  Des tests d'intégration sont écrits pour valider le succès de la création, la gestion des erreurs (ex: payload invalide) et la nature transactionnelle de l'opération.

## Notes Techniques

-   **Transaction Atomique :** L'utilisation d'une transaction (`db.begin()` / `db.commit()` / `db.rollback()`) est le point le plus critique de cette story pour garantir l'intégrité des données.
-   **Modèles de Données :** Cette story interagira avec les modèles `Sale` et `SaleLine` (ou équivalents), qui devront peut-être être mis à jour pour inclure les nouveaux champs (`subcategory_id`, `quantite`, `poids`).

## Definition of Done

- [ ] L'endpoint de finalisation de vente est fonctionnel et transactionnel.
- [ ] Les données de la vente sont correctement enregistrées en base de données.
- [ ] Les tests d'intégration valident le comportement.
- [ ] La story a été validée par le Product Owner.
