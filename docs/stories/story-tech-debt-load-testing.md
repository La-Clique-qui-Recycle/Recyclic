# Story Technique: Tests de Charge pour la Validation en Masse

- **Statut**: Draft
- **Type**: Dette Technique
- **Priorité**: Basse
- **Epic**: 4 - Bot IA & Classification

---

## Story

**En tant que** Responsable Technique,
**Je veux** des tests de charge pour le workflow de validation des dépôts,
**Afin de** m'assurer que le système reste performant et fiable avec un grand nombre d'utilisateurs simultanés.

---

## Contexte

Cette story est une suite de la story 4.3. Le rapport de QA a recommandé d'ajouter des tests de charge pour valider la robustesse du système.

---

## Critères d'Acceptation

1.  Un nouveau script de test de charge est créé (ex: avec `locust` ou `k6`).
2.  Le script simule plusieurs utilisateurs validant ou corrigeant des classifications simultanément.
3.  Le test mesure le temps de réponse moyen de l'API et le taux d'erreur sous charge.
4.  Les résultats sont documentés et analysés pour identifier les éventuels goulots d'étranglement.

---

## Dev Notes

- **Source**: Recommandation du rapport de QA de la story 4.3.
- **Outils suggérés**: `locust` est une bonne option car il est en Python, ce qui est cohérent avec le backend.
