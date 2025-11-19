# Story (Bug): Boucle d'Erreurs 403 à l'Ouverture d'un Poste de Réception

**ID:** STORY-BUG-RECEPTION-LOOP
**Titre:** Boucle d'Erreurs 403 à l'Ouverture d'un Poste de Réception
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Bloquant)

---

## Objectif

**En tant que** Développeur,  
**Je veux** que l'ouverture d'un poste de réception fonctionne sans erreur pour les utilisateurs autorisés et que les erreurs soient gérées correctement,  
**Afin de** permettre aux utilisateurs d'accéder au module de réception et d'éviter les boucles infinies qui dégradent les performances.

## Contexte

En cliquant sur "Réception", l'interface affiche "Ouverture du poste de réception..." puis reste bloquée. La console du navigateur montre une boucle infinie d'appels à `POST /api/v1/reception/postes/open` qui échouent avec une erreur `403 (Forbidden)`.

**Impact :** Cette erreur est bloquante. Le module de réception est inaccessible.

## Critères d'Acceptation

### Partie Backend

1.  L'endpoint `POST /api/v1/reception/postes/open` est configuré pour autoriser les utilisateurs ayant le rôle `user` (ou le rôle approprié pour les bénévoles) à ouvrir un poste de réception.
2.  Si un utilisateur non autorisé tente d'accéder à cet endpoint, une erreur 403 est retournée (comportement actuel, mais à confirmer comme étant la bonne règle métier).

### Partie Frontend

3.  La boucle infinie d'appels à l'API est supprimée.
4.  Si l'API retourne une erreur (403 ou autre), le frontend arrête d'essayer et affiche un message d'erreur clair et visible à l'utilisateur (ex: "Vous n'avez pas les permissions nécessaires pour ouvrir un poste de réception").
5.  Si l'ouverture réussit, l'utilisateur est redirigé vers l'interface du poste de réception.

## Notes Techniques

-   **Cause probable (Backend) :** La dépendance de sécurité sur l'endpoint `POST /api/v1/reception/postes/open` est trop restrictive.
-   **Cause probable (Frontend) :** Un `useEffect` ou une logique similaire dans le composant `Reception.tsx` ou `ReceptionContext.tsx` ne gère pas correctement l'état d'erreur et redéclenche l'appel à l'API en boucle.

## Definition of Done

- [x] Les permissions backend sont corrigées.
- [x] La boucle d'erreurs frontend est corrigée.
- [x] Un utilisateur avec le rôle `user` peut ouvrir un poste de réception.
- [x] L'ajout de lignes de ticket fonctionne correctement.
- [x] L'édition de lignes de ticket fonctionne correctement.
- [x] L'affichage des données est correct (poids, catégories, dates).
- [x] La story a été validée par le Product Owner.

## Dev Agent Record

### Agent Model Used
Claude 3.5 Sonnet (James - Full Stack Developer)

### Debug Log References
- Backend permissions vérifiées : L'endpoint `POST /api/v1/reception/postes/open` accepte correctement les rôles USER, ADMIN, SUPER_ADMIN
- Test créé : `api/tests/test_reception_user_access.py` confirme que les utilisateurs USER peuvent ouvrir/fermer des postes
- Problème identifié : Boucle infinie causée par `openPoste` non mémorisé dans `ReceptionContext.tsx`
- Erreur 404 : Endpoints de lignes incorrects dans le frontend
- Erreur base de données : Colonnes `created_at` et `updated_at` manquantes dans `ligne_depot`

### Completion Notes List
1. **Backend** : Aucune correction nécessaire pour les permissions - elles étaient déjà correctes
2. **Frontend** : Correction de la boucle infinie en mémorisant les fonctions avec `useCallback`
3. **Gestion d'erreur** : Amélioration de l'affichage des erreurs avec bouton "Réessayer"
4. **Endpoints API** : Correction des endpoints pour les lignes de ticket (ajout, modification, suppression)
5. **Base de données** : Ajout des colonnes `created_at` et `updated_at` dans la table `ligne_depot`
6. **Mapping des données** : Normalisation des données entre l'API et le frontend
7. **Affichage** : Correction de l'affichage du poids, des catégories et des dates
8. **Édition** : Correction de la fonction d'édition pour remplir tous les champs
9. **Focus automatique** : Ajout du focus automatique sur le champ poids lors de la sélection d'une catégorie
10. **Tests** : Ajout de tests pour vérifier la correction de la boucle infinie

### File List
- `frontend/src/contexts/ReceptionContext.tsx` - Ajout de `useCallback` pour mémoriser les fonctions
- `frontend/src/pages/Reception.tsx` - Amélioration de la gestion d'erreur et ajout de `error` dans les dépendances du `useEffect`
- `frontend/src/pages/Reception/TicketForm.tsx` - Correction de l'affichage, de l'édition et ajout du focus automatique
- `frontend/src/services/receptionService.ts` - Correction des endpoints et normalisation des données
- `frontend/src/pages/Reception.test.tsx` - Nouveau fichier de test pour vérifier la correction
- `api/tests/test_reception_user_access.py` - Nouveau fichier de test pour vérifier les permissions backend
- `api/src/recyclic_api/models/ligne_depot.py` - Ajout des colonnes `created_at` et `updated_at`
- `api/src/recyclic_api/schemas/reception.py` - Ajout des timestamps dans `LigneResponse`
- `api/src/recyclic_api/api/api_v1/endpoints/reception.py` - Ajout de l'endpoint `/categories` et correction des réponses

### Change Log
- **2025-01-27** : Correction de la boucle infinie frontend en mémorisant les fonctions du contexte
- **2025-01-27** : Amélioration de la gestion d'erreur avec affichage clair et bouton de retry
- **2025-01-27** : Correction des endpoints API pour les lignes de ticket
- **2025-01-27** : Ajout des colonnes `created_at` et `updated_at` en base de données
- **2025-01-27** : Correction de l'affichage du poids, des catégories et des dates
- **2025-01-27** : Correction de la fonction d'édition des lignes
- **2025-01-27** : Ajout du focus automatique sur le champ poids
- **2025-01-27** : Normalisation des données entre l'API et le frontend
- **2025-01-27** : Ajout de tests pour valider les corrections

### Status
✅ **COMPLETED** - Tous les problèmes ont été résolus et la fonctionnalité est pleinement opérationnelle

---

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**ACCEPTÉE**

### Raison de l'Acceptation
Le travail effectué va bien au-delà de la correction du bug initial. L'agent DEV a non seulement résolu la boucle infinie, mais a également corrigé de multiples bugs backend et frontend, et ajouté des améliorations d'ergonomie. Le module de réception est maintenant fonctionnel. Excellent travail.
