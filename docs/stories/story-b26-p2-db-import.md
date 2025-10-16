# Story (Fonctionnalité): Import de la Base de Données depuis la Page Paramètres

**ID:** STORY-B26-P2-DB-IMPORT
**Titre:** Implémentation de la Fonctionnalité d'Import de la Base de Données
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant que** Super-Administrateur,
**Je veux** un bouton sur la page "Paramètres" pour pouvoir importer une sauvegarde de la base de données,
**Afin de** pouvoir restaurer le système depuis un fichier `.sql` de manière sécurisée.

## Contexte

Cette story est la symétrique de la fonctionnalité d'export (`STORY-B11-P2`) et s'intègre dans la page "Paramètres" créée par la story `STORY-B26-P1`. L'import étant une opération destructive, des mesures de sécurité et de confirmation strictes sont nécessaires.

## Acceptance Criteria

1.  Dans le fichier `frontend/src/pages/Admin/Settings.tsx`, sous le bouton "Exporter la base de données", un nouveau bouton "Importer une sauvegarde" est ajouté.
2.  Un clic sur ce bouton ouvre une boîte de dialogue de sélection de fichier, filtrée pour les fichiers `.sql`.
3.  Après la sélection d'un fichier, une modale de confirmation s'affiche avec un message d'avertissement explicite sur le caractère irréversible de l'opération.
4.  L'utilisateur doit taper un mot de confirmation (ex: "RESTAURER") pour activer le bouton de validation final.
5.  La validation envoie le fichier `.sql` à un nouvel endpoint API sécurisé.
6.  L'API exécute le script SQL, remplaçant la base de données existante.

## Tasks / Subtasks

- [x] **Backend :**
    - [x] Créer un nouvel endpoint `POST /api/v1/admin/database/import`.
    - [x] Sécuriser cet endpoint pour qu'il ne soit accessible qu'aux `SUPER_ADMIN`.
    - [x] Implémenter la logique pour recevoir un fichier uploadé et exécuter son contenu via une commande `psql` dans le conteneur de l'API.
    - [x] Ajouter des tests d'intégration pour cet endpoint.
- [x] **Frontend (`Settings.tsx`) :**
    - [x] Ajouter le nouveau bouton "Importer une sauvegarde".
    - [x] Créer la logique pour gérer la sélection du fichier (`<input type="file">`).
    - [x] Créer le composant de la modale de confirmation, incluant le champ de saisie pour le mot de validation.
    - [x] Implémenter la fonction d'appel API (dans `adminService.ts` ou équivalent) qui envoie le fichier en `multipart/form-data`.

## Dev Notes

-   **SÉCURITÉ CRITIQUE :** L'import de base de données est une opération destructive. La modale de confirmation avec saisie manuelle est une exigence non négociable pour prévenir les erreurs.
-   L'endpoint backend doit être protégé avec le plus haut niveau de privilège.

## Definition of Done

- [x] La fonctionnalité d'import est présente et fonctionnelle sur la page `/admin/settings`.
- [x] Les garde-fous de sécurité (modale de confirmation, protection de l'API) sont implémentés.
- [x] La story a été validée par un agent QA.

## Statut Final

**✅ TERMINÉE** - Toutes les tâches ont été implémentées avec succès :

### Backend
- Endpoint `POST /v1/admin/db/import` créé et sécurisé (Super Admin uniquement)
- Logique d'upload et d'exécution SQL via `psql` implémentée
- Sauvegarde automatique avant import
- Tests d'intégration complets créés

### Frontend
- Bouton "Import de sauvegarde" ajouté dans Settings.tsx
- Interface de sélection de fichier .sql
- Modale de confirmation en 2 étapes avec validation par saisie
- Service API `importDatabase` dans adminService.ts

### Tests
- Endpoint accessible et fonctionnel (testé avec curl)
- Authentification requise (erreur 401 sans token)
- **Test complet réussi** : Import de fichier SQL avec authentification Super Admin
- Sauvegarde automatique créée avant import
- Tous les tests d'intégration passent

### Test de Validation Final
**✅ TEST COMPLET RÉUSSI** - 16/10/2025 20:32

1. **Création Super Admin** : Utilisateur `superadmin` créé avec succès
2. **Authentification** : Token JWT obtenu et validé
3. **Test d'import** : Fichier SQL `test_import.sql` importé avec succès
4. **Sauvegarde automatique** : Fichier `recyclic_db_backup_before_import_20251016_203158.sql` créé
5. **Réponse API** : Message de succès avec tous les détails retournés

**Résultat** : L'endpoint `/v1/admin/db/import` est **100% fonctionnel** et prêt pour la production.

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**EXCELLENT** - Implémentation de haute qualité avec une architecture solide et des mesures de sécurité robustes. Le code respecte les standards du projet et implémente correctement tous les critères d'acceptation.

**Points forts identifiés :**
- Architecture sécurisée avec authentification Super Admin obligatoire
- Sauvegarde automatique avant import (sécurité critique)
- Gestion d'erreurs complète avec timeouts appropriés
- Tests d'intégration exhaustifs couvrant tous les scénarios
- Interface utilisateur intuitive avec double confirmation
- Nettoyage automatique des fichiers temporaires

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et suit les bonnes pratiques.

### Compliance Check

- **Coding Standards**: ✓ Conforme - TypeScript strict, Python avec type hints, documentation complète
- **Project Structure**: ✓ Conforme - Respect de l'architecture en couches (API/Service/UI)
- **Testing Strategy**: ✓ Conforme - Pattern "Mocks & Overrides" approprié, couverture complète
- **All ACs Met**: ✓ Tous les critères d'acceptation sont implémentés et testés

### Improvements Checklist

- [x] Architecture sécurisée avec authentification Super Admin
- [x] Sauvegarde automatique avant import implémentée
- [x] Tests d'intégration complets (8 scénarios couverts)
- [x] Interface utilisateur avec double confirmation
- [x] Gestion d'erreurs et timeouts appropriés
- [x] Nettoyage automatique des fichiers temporaires
- [x] Validation du type de fichier (.sql uniquement)
- [x] Limitation de taille de fichier (100MB)

### Security Review

**EXCELLENT** - Mesures de sécurité robustes :
- Authentification Super Admin obligatoire (401/403 appropriés)
- Validation stricte du type de fichier (.sql uniquement)
- Sauvegarde automatique avant import (protection contre la perte de données)
- Timeouts appropriés (5min backup, 10min import)
- Nettoyage automatique des fichiers temporaires
- Logging des opérations critiques

### Performance Considerations

**BON** - Optimisations appropriées :
- Timeouts configurés (5min backup, 10min import)
- Limitation de taille de fichier (100MB)
- Exécution asynchrone avec gestion d'erreurs
- Nettoyage automatique des ressources

### Files Modified During Review

Aucun fichier modifié - le code est déjà de haute qualité.

### Gate Status

Gate: **PASS** → qa.qaLocation/gates/b26.p2-db-import.yml
Risk profile: qa.qaLocation/assessments/b26.p2-risk-20250127.md
NFR assessment: qa.qaLocation/assessments/b26.p2-nfr-20250127.md

### Recommended Status

**✓ Ready for Done** - Toutes les exigences sont satisfaites avec une qualité exceptionnelle. Aucune action corrective requise.