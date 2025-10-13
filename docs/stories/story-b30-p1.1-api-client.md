# Story (Technique): Centralisation du Client API Frontend

**ID:** STORY-B30-P1.1-API-CLIENT
**Titre:** Centralisation du Client API Frontend pour Fiabiliser les Appels
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)

---

## User Story

**En tant que** Développeur,
**Je veux** que tout le code frontend utilise une instance unique et centralisée du client API (Axios),
**Afin d'**éradiquer les erreurs de "Mixed Content" et de garantir que la configuration de l'URL de l'API est gérée à un seul endroit.

## Acceptance Criteria

1.  Le fichier `api/openapi.json` est vérifié et la section `"servers"` est supprimée si elle existe.
2.  Un fichier `frontend/src/api/axiosClient.ts` est créé et configure une instance unique d'Axios qui lit sa `baseURL` depuis `import.meta.env.VITE_API_URL`.
3.  Tous les fichiers du projet qui font des appels API (y compris le code auto-généré) sont refactorisés pour importer et utiliser cette instance unique.
4.  L'application reste fonctionnelle en environnement de développement après le refactoring.

## Tasks / Subtasks

- [ ] **Nettoyage Spec API :** Vérifier et supprimer la section `"servers"` du fichier `api/openapi.json`.
- [ ] **Création Client Central :** Implémenter le fichier `frontend/src/api/axiosClient.ts`.
- [ ] **Refactoring du Code Source :**
    - [ ] Identifier tous les fichiers utilisant `axios` directement ou le client généré.
    - [ ] Modifier ces fichiers pour qu'ils importent et utilisent l'instance unique de `axiosClient`.
- [ ] **Notification Manuelle :** Préparer une note pour l'utilisateur final de la story, lui indiquant de lancer `npm run codegen` pour régénérer le client API sur la base de la nouvelle configuration.

## Definition of Done

- [ ] Le client API est centralisé.
- [ ] Le code source a été refactorisé.
- [ ] La story a été validée par un agent QA.