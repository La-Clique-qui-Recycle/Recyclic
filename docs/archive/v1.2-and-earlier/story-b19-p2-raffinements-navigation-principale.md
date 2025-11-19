# Story (Raffinements): Raffinements de la Navigation Principale et de l'Authentification

**ID:** STORY-B19-P2
**Titre:** Raffinements de la Navigation Principale et de l'Authentification
**Epic:** Refondation de l'Expérience Utilisateur et de l'Architecture Frontend
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** utilisateur,  
**Je veux** une barre de navigation principale claire qui s'adapte à mon statut de connexion,  
**Afin de** comprendre rapidement où je suis et quelles sont les actions qui me sont accessibles.

## Contexte

L'audit a révélé des incohérences dans la navigation principale. Cette story vise à clarifier la structure du header en fonction de l'état d'authentification de l'utilisateur.

## Critères d'Acceptation

1.  **Affichage du Nom de l'Utilisateur :**
    -   Lorsque l'utilisateur est connecté, son nom d'utilisateur est affiché dans le header, à côté du bouton "Déconnexion".

2.  **Déplacement du "Journal de Caisse" :**
    -   Le lien vers le "Journal de Caisse" est retiré du menu principal et est maintenant accessible depuis la section "Administration".

3.  **Vue Déconnectée :**
    -   Lorsqu'un utilisateur n'est pas connecté, le header n'affiche qu'un seul et unique lien : "Tableau de bord" (qui pointera vers une future page d'accueil publique).
    -   Tous les autres liens (Caisse, Réception, Administration, etc.) sont masqués.

## Notes Techniques

-   **Fichiers à modifier :** Principalement `frontend/src/components/Header.jsx` et le store d'authentification (`authStore.ts`) pour récupérer les informations de l'utilisateur connecté.
-   La logique d'affichage conditionnel des liens du menu doit être renforcée.

## Definition of Done

- [x] Le nom de l'utilisateur connecté est affiché dans le header.
- [x] Le "Journal de Caisse" a été déplacé dans la section Administration.
- [x] Le header affiche une vue minimale pour les utilisateurs non connectés.
- [x] La story a été validée par le Product Owner.

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Tests unitaires mis à jour pour refléter les nouvelles règles de navigation
- Vue déconnectée: seul "Tableau de bord" visible
- Affichage du nom utilisateur près du bouton Déconnexion
- "Journal de Caisse" déplacé vers Administration

### Completion Notes List
- ✅ Header.jsx modifié pour vue déconnectée minimale
- ✅ Affichage du nom utilisateur connecté implémenté
- ✅ "Journal de Caisse" retiré du menu principal
- ✅ "Journal de Caisse" ajouté à ADMIN_NAVIGATION_ITEMS
- ✅ Tests unitaires mis à jour et validés

### File List
- `frontend/src/components/Header.jsx` - Modifié pour vue déconnectée et affichage nom utilisateur
- `frontend/src/config/adminRoutes.js` - Ajout "Journal de Caisse" dans Administration
- `frontend/src/test/components/ui/Header.test.tsx` - Tests mis à jour pour nouvelles règles

### Change Log
- **Header.jsx**: Vue déconnectée minimale (seulement "Tableau de bord"), affichage nom utilisateur, retrait "Journal de Caisse"
- **adminRoutes.js**: Ajout entrée "Journal de Caisse" dans ADMIN_NAVIGATION_ITEMS
- **Header.test.tsx**: Tests corrigés pour refléter les changements de navigation

### Status
Ready for Review

## QA Results

**Gate:** PASS

**Rationale (résumé):**
- Navigation conditionnelle: implémentation correcte avec vue minimale pour utilisateurs non connectés (seul "Tableau de bord" visible)
- Affichage nom utilisateur: logique robuste avec fallback (username → prénom nom → "Utilisateur")
- Journal de Caisse: correctement déplacé vers Administration dans `adminRoutes.js` (ligne 31-34)
- Tests: couverture complète (9 tests PASS) couvrant tous les états d'authentification et rôles

**Evidence:**
- **Navigation conditionnelle**: `frontend/src/components/Header.jsx` (lignes 69-89) - logique claire par état d'auth
- **Nom utilisateur**: `Header.jsx` (lignes 110-113) - affichage avec fallbacks multiples
- **Journal de Caisse**: `frontend/src/config/adminRoutes.js` (lignes 30-34) - correctement dans ADMIN_NAVIGATION_ITEMS
- **Tests**: `frontend/src/test/components/ui/Header.test.tsx` - 9 tests couvrant tous les scénarios

**Must-test validés:**
- ✅ Vue déconnectée: seul "Tableau de bord" visible, autres liens masqués
- ✅ Affichage nom utilisateur: visible à côté du bouton "Déconnexion" pour utilisateurs connectés
- ✅ Journal de Caisse: retiré du menu principal, accessible via Administration
- ✅ Tests unitaires: tous les états d'authentification et rôles couverts

**Conseils techniques validés:**
- Logique d'affichage conditionnel robuste avec gestion des rôles (admin, cash access)
- Structure de navigation claire et maintenable
- Tests exhaustifs couvrant tous les cas d'usage

**Décision:** Gate PASS - Implémentation conforme aux critères d'acceptation, tests verts, navigation cohérente.

---

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**ACCEPTÉE**

### Raison de l'Acceptation
Le QA a validé que toutes les améliorations de la navigation principale ont été correctement implémentées. La story est terminée.
