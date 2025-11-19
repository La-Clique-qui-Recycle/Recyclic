---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:13.358422
original_path: docs/stories/archive/tech-debt-activate-reception-tests.md
---

# Story: TECH-DEBT - Activer les tests pour la réception

**User Story**
En tant que développeur,
Je veux que tous les tests de la suite de tests soient actifs et exécutés,
Afin de garantir la non-régression et la qualité du code à chaque modification.

**Contexte**

Lors de la revue de la story `story-db-reception-schema.md`, l'agent QA a découvert que le fichier de test `api/tests/test_reception_crud_relations.py` contient une marque `pytest.mark.skip` globale, ce qui désactive l'exécution de tous les tests de ce fichier.

**Critères d'Acceptation**

1.  Supprimer la ligne `pytestmark = pytest.mark.skip` du fichier `api/tests/test_reception_crud_relations.py`.
2.  Exécuter la suite de tests complète pour le backend.
3.  Confirmer que tous les tests, y compris ceux du fichier modifié, passent avec succès.

**Priorité :** Faible
