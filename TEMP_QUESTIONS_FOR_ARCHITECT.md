# QUESTIONS TEMPORAIRES POUR L'ARCHITECTE

**À l'attention de l'Agent Architecte,**

Suite à votre rapport sur la stratégie de stabilisation des tests et l'alignement technique, et afin de pouvoir créer des stories précises et actionnables pour l'agent DEV, nous avons besoin de clarifications techniques.

Ces questions sont cruciales pour garantir que les solutions proposées sont implémentées correctement et sans introduire de nouvelles régressions.

---

## Questions pour la Story 1 (Priorité 1 - Critique) : Stabilisation Immédiate des Tests Backend

Cette story vise à implémenter la "Phase 1 : Stabilisation Immédiate (Tactique)" de votre rapport.

1.  **Reversion des Fixtures Invasives (conftest.py)** :
    Pour restaurer les fixtures `admin_client` et `client_with_jwt_auth` à leur état précédent ("TestClient simples et non modifiés"), pourriez-vous nous fournir le **code exact** de ces deux fixtures tel qu'il était avant les modifications invasives ?

2.  **Reversion de l'Authentification Stricte (api/v1/endpoints/admin.py)** :
    La recommandation est de remplacer `require_admin_role_strict()` par `require_admin_role()`. Est-ce que la fonction `require_admin_role()` existe déjà dans le code et implémente-t-elle correctement l'authentification non-stricte attendue ? Si elle n'existe pas ou doit être modifiée, quel devrait être son **code exact** ?

3.  **Correction Ciblée des Données de Test (test_dashboard_stats.py)** :
    Pour corriger la création de l'utilisateur, pourriez-vous nous fournir le **code exact du snippet** dans `api/tests/test_dashboard_stats.py` où l'utilisateur est créé, afin que nous puissions y ajouter `hashed_password` et `is_active=True` ?

4.  **Nettoyage des Edits Partiels (test_integration_pending_workflow.py)** :
    Pour annuler les modifications partielles et restaurer l'utilisation de `admin_client`, pourriez-vous nous fournir le **code exact du snippet** dans `api/tests/test_integration_pending_workflow.py` qui doit être nettoyé/reverti, notamment concernant la variable `client` et l'utilisation de `admin_client` ?

---

## Questions pour la Story 2 (Priorité 2 - Élevée) : Définition et Alignement de la Stratégie de Test

Cette story vise à implémenter la "Phase 2 : Alignement Futurs (Stratégique)" de votre rapport.

1.  **Création du document `docs/testing-strategy.md` (la charte)** :
    Au-delà des principes généraux (Mocks Purs, Fixtures-DB, E2E) déjà mentionnés dans le rapport de l'architecte, y a-t-il des sections spécifiques, des titres de sous-sections, ou des points de détail supplémentaires que vous souhaiteriez voir inclus dans cette charte dès sa première version ?

2.  **Mise à jour de `api/testing-guide.md` et `frontend/testing-guide.md`** :
    Pour chacun de ces deux fichiers, pourriez-vous nous spécifier l'**emplacement exact** (par exemple, après quelle section ou quel paragraphe) et la **formulation exacte** de la phrase qui devrait faire référence au nouveau document `docs/testing-strategy.md` ?

---

Merci pour votre collaboration. Nous attendons vos retours pour pouvoir avancer sur ces stories critiques.
