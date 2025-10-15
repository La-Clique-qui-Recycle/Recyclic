# Story (Fonctionnalité): Création du Super-Admin via le Fichier .env

**ID:** STORY-B32-P1-ENV-SUPERADMIN
**Titre:** Création du Premier Super-Admin via les Variables d'Environnement
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** pouvoir définir les identifiants du premier super-admin dans le fichier `.env`,
**Afin de** pouvoir initialiser l'application automatiquement avec un utilisateur administrateur, sans aucune action manuelle.

## Acceptance Criteria

1.  Le fichier `env.example` contient les nouvelles variables : `FIRST_SUPER_ADMIN_EMAIL` et `FIRST_SUPER_ADMIN_PASSWORD`.
2.  Au démarrage, l'API vérifie si ces variables sont définies.
3.  Si elles sont définies ET que l'utilisateur correspondant n'existe pas encore, un nouvel utilisateur est créé avec le rôle `super-admin`.
4.  Le mot de passe fourni dans la variable d'environnement est haché avant d'être stocké en base de données.
5.  Si l'utilisateur existe déjà ou si les variables ne sont pas définies, le script ne fait rien et ne génère pas d'erreur.

## Tasks / Subtasks

- [ ] **Configuration :**
    - [x] Ajouter `FIRST_SUPER_ADMIN_EMAIL=admin@example.com` et `FIRST_SUPER_ADMIN_PASSWORD=changeme` au fichier `env.example`.
- [ ] **Backend (Logique d'Initialisation) :**
    - [x] Créer un nouveau script ou service (ex: `api/src/initial_data.py`) qui contiendra la logique de création.
    - [x] Cette logique doit :
        - a. Lire les variables d'environnement.
        - b. Vérifier si les variables sont présentes.
        - c. Vérifier si un utilisateur avec cet email existe déjà en base de données.
        - d. Si non, créer l'utilisateur, en utilisant la fonction `hash_password` existante pour sécuriser le mot de passe.
- [ ] **Backend (Démarrage API) :**
    - [x] Dans le fichier principal de l'API (`api/src/recyclic_api/main.py`), utiliser un événement de démarrage de FastAPI (`lifespan`) pour exécuter ce script d'initialisation.
- [ ] **Tests :**
    - [x] Ajouter un test d'intégration qui simule le démarrage de l'application avec les variables d'environnement définies et vérifie que l'utilisateur est bien créé.

## Dev Notes

-   **Sécurité :** Le mot de passe lu depuis le fichier `.env` ne doit **jamais** être stocké en clair. Il doit impérativement passer par la fonction de hachage `hash_password`.
-   **Idempotence :** Le script doit être "idempotent", c'est-à-dire qu'on doit pouvoir démarrer l'application plusieurs fois sans que cela ne crée d'erreur ou de doublon.

## Definition of Done

- [x] Les nouvelles variables d'environnement sont documentées dans `env.example`.
- [x] Au premier démarrage avec les variables définies, le super-admin est créé.
- [x] Aux démarrages suivants, le script ne fait rien.
- [ ] La story a été validée par un agent QA.

---
## Dev Agent Record

### File List
- `env.example` (modifié): ajout `FIRST_SUPER_ADMIN_EMAIL`, `FIRST_SUPER_ADMIN_PASSWORD`
- `api/src/recyclic_api/initial_data.py` (nouveau): création super-admin idempotente
- `api/src/recyclic_api/main.py` (modifié): appel `init_super_admin_if_configured` dans `lifespan`
- `api/tests/test_super_admin_bootstrap.py` (nouveau): tests d’intégration

### Change Log
- Implémentation bootstrap super-admin via variables d’environnement
- Hook d’initialisation branché au démarrage de l’app
- Tests d’intégration couvrant création et idempotence

### Status
- Prêt pour Review

## QA Results

- Décision: PASS
- Justification:
  - Variables `FIRST_SUPER_ADMIN_EMAIL` et `FIRST_SUPER_ADMIN_PASSWORD` ajoutées dans `env.example`.
  - Initialisation au démarrage via `lifespan` dans `api/src/recyclic_api/main.py` exécutant `init_super_admin_if_configured`.
  - Logique idempotente: création seulement si l’utilisateur n’existe pas.
  - Mot de passe haché via `hash_password` avant insertion.
  - Tests d’intégration présents: création au premier démarrage et idempotence vérifiée.
- Vérifications complémentaires:
  - Aucun effet si variables absentes/vides (early return).
  - Rôle `SUPER_ADMIN` et statut `ACTIVE` correctement appliqués.
  - Fermeture propre de la session DB au démarrage.