---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:14.259281
original_path: docs/stories/story-b32-p1-env-superadmin.md
---

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

- Le fichier `env.example` contient les variables : `FIRST_SUPER_ADMIN_USERNAME` et `FIRST_SUPER_ADMIN_PASSWORD` (pas d’email requis).
- Au démarrage, l'API vérifie si ces variables sont définies.
- Si elles sont définies ET que l'utilisateur `username` n'existe pas, création d’un `super-admin` avec hachage du mot de passe.
- Idempotent: si l’utilisateur existe déjà ou si variables absentes, ne rien faire sans erreur.

## Tasks / Subtasks

- [x] **Configuration :**
-    - [x] Ajouter `FIRST_SUPER_ADMIN_USERNAME=admin` et `FIRST_SUPER_ADMIN_PASSWORD=changeme` au fichier `env.example`.
- [x] **Backend (Logique d'Initialisation) :**
-    - [x] Créer `api/src/initial_data.py` avec création par `username` uniquement (sans fallback email).
-    - [x] Vérifier présence des variables, existence par `username`, hacher le mot de passe, créer si absent.
- [x] **Backend (Démarrage API) :**
-    - [x] Appeler l’initialisation dans `lifespan` de `api/src/recyclic_api/main.py`.
- [x] **Tests :**
-    - [x] Tests d’intégration: création via `FIRST_SUPER_ADMIN_USERNAME`, idempotence.

### File List
- `env.example` (modifié): `FIRST_SUPER_ADMIN_USERNAME`, `FIRST_SUPER_ADMIN_PASSWORD`
- `api/src/recyclic_api/initial_data.py` (modifié): username-only
- `api/src/recyclic_api/main.py` (modifié): appel init
- `api/tests/test_super_admin_bootstrap.py` (modifié): tests username-only

### Change Log
- Migration du bootstrap super-admin vers username-only (suppression fallback email)

## QA Results

- Décision: PASS
- Justification:
  - Variables `FIRST_SUPER_ADMIN_USERNAME` et `FIRST_SUPER_ADMIN_PASSWORD` présentes dans `env.example`.
  - Initialisation au démarrage via `lifespan` appelle la création par `username`.
  - Idempotence vérifiée par tests.
  - Mot de passe haché via `hash_password`.
- Vérifications complémentaires:
  - Aucun effet si variables absentes/vides.
  - Rôle `SUPER_ADMIN` et statut `ACTIVE` corrects.