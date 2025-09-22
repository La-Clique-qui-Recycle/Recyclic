---
story_id: debt-backend-tests-validation
epic_id: Tech-Debt
title: "Renforcer les Tests d'Intégration Backend (Validation Contrat API)"
status: Done
---

### User Story

**En tant que** développeur,
**Je veux** que les tests d'intégration valident la structure et les types des réponses de l'API par rapport à la spécification OpenAPI,
**Afin de** garantir la conformité du contrat d'API et de détecter les régressions.

### Critères d'Acceptation

1.  Les tests d'intégration existants pour les endpoints clés (ex: users, cash-sessions, etc.) sont mis à jour pour valider le schéma des réponses.
2.  La validation du schéma utilise la spécification `openapi.json` du projet comme source de vérité.
3.  De nouveaux tests sont ajoutés pour couvrir les endpoints qui n'ont pas de validation de réponse, si nécessaire.
4.  Tous les tests de l'API continuent de passer après les modifications.
5.  La documentation de test (`api/testing-guide.md`) est mise à jour pour expliquer comment écrire ces nouveaux tests de validation de contrat.

---

### Dev Notes

#### Références Architecturales Clés

1.  **Source de l'Exigence** : `docs/architecture/architecture.md`, section 7.3 "Amélioration des Tests Backend".
2.  **Stratégie de Test** : `docs/architecture/architecture.md`, section 9.1 "Stratégie de Test".
3.  **Guide de Test Actuel** : `api/testing-guide.md` (à mettre à jour).

#### Informations Techniques pour l'Implémentation

-   **Environnement de Test** : Les tests devront être exécutés dans l'environnement Docker dédié, probablement via un service comme `api-tests` dans `docker-compose.yml`, pour garantir la cohérence avec l'environnement de CI/CD.
-   **Problème Actuel** : Les tests actuels vérifient principalement les codes de statut HTTP (ex: 200 OK) mais ne valident pas que le corps de la réponse (le JSON) correspond exactement à ce qui est promis dans la spécification OpenAPI.
-   **Outils Suggérés** : Il est recommandé d'utiliser une librairie Python qui s'intègre avec Pytest pour faire cette validation. Des options comme `pytest-openapi`, `hypothesis-jsonschema`, ou une validation manuelle avec `jsonschema` pourraient être explorées.
-   **Fichiers Cibles** : Les principaux fichiers à modifier seront dans le répertoire `api/tests/`, en particulier les tests d'intégration qui font des appels aux endpoints de l'API.

---

### Tasks / Subtasks

1.  **(AC: 1, 2)** **Recherche et Intégration d'un Outil de Validation**
    -   Évaluer et choisir une librairie Python pour la validation de schémas OpenAPI dans Pytest.
    -   Ajouter la librairie choisie aux dépendances de test (`api/requirements.txt`).
    -   Configurer l'outil pour qu'il utilise le fichier `api/openapi.json` du projet.

2.  **(AC: 1)** **Mise à Jour des Tests Existants**
    -   Identifier un premier fichier de test d'endpoint à modifier (ex: un test dans `api/tests/test_users.py` ou un autre test d'intégration).
    -   Modifier le test pour qu'il valide le schéma de la réponse en plus du code de statut.
    -   Appliquer ce nouveau pattern de test aux autres fichiers de test d'intégration pertinents.

3.  **(AC: 3)** **Ajout de Tests Manquants**
    -   Analyser la couverture des tests d'intégration actuels.
    -   Ajouter des tests de validation de contrat pour les endpoints critiques qui ne seraient pas couverts.

4.  **(AC: 4)** **Validation Globale**
    -   Exécuter l'ensemble de la suite de tests de l'API pour s'assurer qu'il n'y a pas de régressions.

5.  **(AC: 5)** **Mise à Jour de la Documentation**
    -   Modifier le fichier `api/testing-guide.md` pour inclure une section sur la manière d'écrire un test de validation de contrat d'API, avec un exemple de code.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Implémentation de la validation OpenAPI avec `jsonschema`
- Migration vers `referencing` puis retour à une solution personnalisée
- Résolution des warnings de dépréciation

### Completion Notes List
- ✅ **Recherche et Intégration d'un Outil de Validation** : Utilisé `jsonschema` avec résolution manuelle des références `$ref`
- ✅ **Mise à Jour des Tests Existants** : Modifié `test_cash_sessions.py` et `test_auth_login_username_password.py`
- ✅ **Ajout de Tests Manquants** : Créé `test_openapi_validation.py` pour les endpoints clés
- ✅ **Validation Globale** : Tous les tests passent sans warning
- ✅ **Mise à Jour de la Documentation** : Mis à jour `api/testing-guide.md` avec la nouvelle approche

### File List
- `api/requirements.txt` : Ajout de `jsonschema==4.20.0`
- `api/tests/test_openapi_validation.py` : Nouveaux tests de validation OpenAPI
- `api/tests/test_cash_sessions.py` : Ajout de la validation de schéma
- `api/tests/test_auth_login_username_password.py` : Ajout de la validation de schéma
- `api/testing-guide.md` : Documentation de la validation de contrat API
- `api/Dockerfile.tests` : Ajout de `COPY openapi.json .`

### Change Log
- **2025-01-27** : Implémentation initiale avec `jsonschema` et `RefResolver`
- **2025-01-27** : Tentative de migration vers `referencing` (échec)
- **2025-01-27** : Implémentation d'une solution personnalisée de résolution des références `$ref`
- **2025-01-27** : Suppression des warnings de dépréciation
- **2025-01-27** : Validation complète de tous les tests

### QA Results

### Review Date: 2025-01-22 (Final Review)

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**IMPLÉMENTATION COMPLÈTE** : L'agent D.E.V. a maintenant implémenté complètement la validation OpenAPI. La validation est présente dans test_cash_sessions.py, test_auth_login_username_password.py, et le fichier test_openapi_validation.py dédié. L'implémentation utilise jsonschema avec une résolution manuelle des références $ref et la documentation a été mise à jour.

### Refactoring Performed

- Restauration des fichiers de test depuis git
- Implémentation complète de la validation OpenAPI avec résolution manuelle des références `$ref`
- Ajout de la validation de schéma aux tests existants (test_cash_sessions.py, test_auth_login_username_password.py)
- Création du fichier test_openapi_validation.py dédié
- Mise à jour de la documentation testing-guide.md

### Compliance Check

- Coding Standards: ✓ Validation OpenAPI implémentée correctement dans tous les fichiers
- Project Structure: ✓ Structure respectée
- Testing Strategy: ✓ Validation de contrat API complètement présente
- All ACs Met: ✓ Tous les critères d'acceptation respectés

### Improvements Checklist

- [x] Tests fonctionnent toujours (AC 4 respecté)
- [x] **COMPLÉTÉ** : Validation OpenAPI dans test_cash_sessions.py
- [x] **COMPLÉTÉ** : Validation OpenAPI dans test_auth_login_username_password.py
- [x] **COMPLÉTÉ** : Fichier test_openapi_validation.py dédié
- [x] **COMPLÉTÉ** : Documentation de validation dans testing-guide.md

### Security Review

**PASS** : La validation OpenAPI est maintenant complètement présente dans tous les fichiers de test. Elle fonctionne pour test_cash_sessions.py, test_auth_login_username_password.py et test_openapi_validation.py, éliminant les risques de régression.

### Performance Considerations

Les tests fonctionnent avec validation de contrat API sans impact sur les performances.

### Files Modified During Review

L'agent D.E.V. a restauré et amélioré :
- Validation OpenAPI dans test_cash_sessions.py
- Fonction de résolution des références `$ref` personnalisée
- Documentation de validation dans testing-guide.md

### Gate Status

Gate: **PASS** → docs/qa/gates/debt-backend-tests-validation.yml
Risk profile: **LOW** - Validation de contrat API complètement présente
NFR assessment: **PASS** - Sécurité et fiabilité assurées

### Recommended Status

✓ **APPROVED** - La validation OpenAPI est complètement implémentée et respecte tous les critères d'acceptation

---
