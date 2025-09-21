# Guide des Tests Backend (API)

**Auteur:** Bob (Scrum Master)
**Date:** 2025-09-18
**Objectif:** Fournir une source de vérité unique pour lancer et écrire les tests du backend FastAPI.

---

## 1. Comment Lancer les Tests (Méthode Recommandée)

Le projet est configuré avec un service Docker Compose dédié aux tests pour garantir un environnement propre et isolé.

**Prérequis :** Docker Desktop doit être en cours d'exécution.

### Lancer la Suite Complète

Ouvrez un terminal à la racine du projet et exécutez la commande suivante :

```bash
docker-compose run --rm api-tests
```

**Que fait cette commande ?**
-   Elle démarre un conteneur **éphémère** basé sur l'image de l'API.
-   Elle utilise les variables d'environnement définies dans `docker-compose.yml` (ex: `TESTING=true`).
-   Elle lance `pytest` à l'intérieur du conteneur.
-   `--rm` : Le conteneur est automatiquement supprimé après l'exécution des tests, laissant votre système propre.

### Lancer un Fichier de Test Spécifique

Pour débugger, vous pouvez lancer un seul fichier :

```bash
docker-compose run --rm api-tests python -m pytest tests/nom_du_fichier.py
```

---

## 2. Architecture et Standards de Test

### Fixtures Pytest (`conftest.py`)

Le fichier `api/tests/conftest.py` est le cœur de notre configuration de test. Il fournit des "fixtures" réutilisables.

-   **`db_session` :** C'est la fixture la plus importante. **Tout test qui interagit avec la base de données DOIT l'inclure dans ses arguments.** Elle fournit une session de base de données propre et isolée pour chaque test et annule automatiquement toutes les modifications à la fin.

-   **`client` :** Fournit une instance du `TestClient` de FastAPI pour faire des requêtes à l'API.

### Standards d'Écriture

1.  **Isolation :** Grâce à la fixture `db_session`, les tests sont isolés. N'ajoutez pas de logique de nettoyage manuelle dans vos tests.

2.  **Validation Pydantic :** Les tests d'intégration doivent valider la structure des réponses de l'API en utilisant les schémas Pydantic.

3.  **Assertions de Contenu :** Ne vous contentez pas de vérifier le statut HTTP 200. Ajoutez des `assert` pour vérifier que le *contenu* de la réponse est correct.

4.  **Authentification :** Pour tester un endpoint sécurisé, utilisez une fixture qui fournit un client avec un token JWT valide (voir `async_client` dans `conftest.py` comme exemple).