# Story (Dette Technique): Amélioration de la Couverture de Tests Frontend

**ID:** STORY-TECH-DEBT-FRONTEND-TESTS-COVERAGE
**Titre:** Amélioration de la Couverture de Tests Frontend pour les Dashboards et Rapports
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant que** Développeur,  
**Je veux** augmenter la couverture de tests pour les nouvelles fonctionnalités de dashboard et de rapports,  
**Afin de** garantir leur non-régression et de faciliter leur maintenance future.

## Contexte

Lors de la validation des stories du lot B05, le QA a recommandé d'ajouter une couverture de test plus complète (unitaire et E2E) pour les nouvelles pages de statistiques et de rapports. Cette story regroupe ces recommandations.

## Critères d'Acceptation

1.  **Tests pour le Tableau de Bord Visuel (`b05-p2`) :**
    -   Des tests unitaires sont ajoutés pour les nouveaux composants du tableau de bord (ex: StatCards, graphiques).
    -   Des tests E2E sont ajoutés pour valider les interactions clés (ex: le changement de période de filtre met bien à jour les graphiques).

2.  **Tests pour la Page de Rapports (`b05-p3`) :**
    -   Des tests unitaires supplémentaires sont ajoutés pour le formatage des données, la logique de pagination et la gestion des erreurs.
    -   Des tests E2E sont ajoutés pour valider le workflow complet : application d'un filtre, vérification des résultats, puis clic sur "Exporter en CSV".

## Notes Techniques

-   **Frameworks à utiliser :** `React Testing Library` et `Vitest` pour les tests unitaires, `Playwright` pour les tests E2E, conformément à la `testing-strategy.md`.
-   Les tests doivent être robustes et éviter les sélecteurs fragiles.

## Definition of Done

- [ ] La couverture de test pour le tableau de bord visuel est améliorée.
- [ ] La couverture de test pour la page de rapports est améliorée.
- [ ] Tous les nouveaux tests passent.
- [ ] La story a été validée par le Product Owner.
