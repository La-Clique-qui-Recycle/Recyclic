---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.463076
original_path: docs/stories/epic-4.6-admin-api-integration-refactor.story.md
---

# Story 4.6: Harmoniser les appels API Admin (Sites & Postes de caisse)
**Status:** Done  
**Epic:** Epic 4 � Exports & Synchronisation Cloud

## Story Statement
As an admin user,  
I want the �Sites� and �Postes de caisse� back-office pages to consume the API through the unified client and handle network errors gracefully,  
so that these management screens work reliably in all environments (dev, staging, prod).

## Acceptance Criteria
1. Les deux pages utilisent l�instance xiosClient (ou les clients g�n�r�s SitesApi / CashRegistersApi) configur�e avec un aseURL relatif (/api), sans URL absolue http://api:8000.
2. Chaque page g�re les erreurs r�seau ou HTTP (=400) : affichage d�un message structur�, bouton �R�essayer�, absence de TypeError dans la console.
3. Impl�menter un fallback : si la r�ponse n�est pas un tableau, ne pas appeler map et afficher l��tat d�erreur (�viter plantage UI).
4. Ajouter / mettre � jour les tests unitaires (Vitest) couvrant succ�s et erreurs pour les hooks/services utilis�s, et au moins un test d�int�gration front simulant un 200 et un 500.
5. Documenter dans un README ou changelog Front la configuration VITE_API_URL=/api en dev et rappeler que les changements d�env n�cessitent docker compose --profile dev up -d --build.

## Dev Notes

### R�f�rences Architecturales Cl�s
1. **COMMENCER PAR** : docs/architecture/architecture.md � navigation compl�te (sections 10. Standards... et 11.1 Configuration des Ports).
2. docs/architecture/architecture.md#10-standards-et-r�gles-dimpl�mentation-critiques � conventions front, proxy Vite /api -> http://api:8000.
3. docs/testing-strategy.md#1-principes-fondamentaux � pyramide des tests & couverture attendue.

### Contexte / stories pr�c�dentes
- �crans h�rit�s de Story 4.3 du m�me epic (dashboard admin multi-caisses) mais non align�s avec la strat�gie API (section 7.2 de l�architecture). Pas de story existante dans docs/stories, donc aucune d�pendance bloquante.

### Insights Techniques
- **Client API** : rontend/src/api/axiosClient.ts doit rester la source unique (aseURL = import.meta.env.VITE_API_URL || '/api').
- **Proxy Vite** : d�j� configur� dans rontend/vite.config.js; la page doit appeler /api/... pour profiter de la r��criture.
- **Gestion erreurs** : pr�voir un composant/error state r�utilisable pour les listes admin.
- **Tests** : utiliser Vitest + msw pour simuler API (succ�s / erreur). Respecter la pyramide de tests (docs/testing-strategy.md).
- **Structure** : conserver rontend/src/pages/Admin/* pour les pages, rontend/src/generated/* pour les clients auto-g�n�r�s.

### Technical Constraints
- Pas d�URL absolue en front (http://api:8000).
- Compatibilit� proxy dev (Vite) et Traefik (ROOT_PATH=/api en staging/prod).
- Respecter la s�paration des stores Zustand par domaine (docs/architecture/architecture.md#10.3).

## Tasks / Subtasks
1. **Audit & bascule client API** (AC1)
   - Remplacer rontend/src/services/api.js par les clients g�n�r�s ou xiosClient mutualis�.
   - V�rifier/importer les types g�n�r�s (rontend/src/generated/api.ts).
2. **Gestion d�erreurs UI** (AC2 & AC3)
   - Ajouter un composant d�erreur commun (message + retry).
   - Garantir que items reste un tableau (fallback []).
3. **Documentation env** (AC5)
   - Mettre � jour un README front ou la doc dev avec VITE_API_URL=/api + rebuild compose.
4. **Tests** (AC4)
   - Vitest sur le hook/service (succ�s + �chec).
   - Test d�int�gration front (ex. msw) pour v�rifier rendu erreur.

## Project Structure Notes
- Les pages restent sous rontend/src/pages/Admin/.
- Les clients g�n�r�s se trouvent dans rontend/src/generated/.
- Aucune logique r�seau dupliqu�e : centraliser via xiosClient ou hooks d�di�s.

---

## Dev Agent Record

### Status
**Ready for Review**

### Tasks Completion
- [x] Audit & bascule client API (AC1)
- [x] Gestion d'erreurs UI (AC2 & AC3)
- [x] Documentation env (AC5)
- [x] Tests (AC4)

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes
1. **AC1 - Client API unifié** : Vérifié que frontend/src/services/api.js utilise déjà axiosClient avec baseURL relative. Aucune modification nécessaire.

2. **AC2 & AC3 - Gestion d'erreurs robuste** :
   - **CashRegisters.tsx** : Ajouté gestion complète des erreurs HTTP (401, 403, 404, 409, 500+, network errors)
   - **Sites.tsx** : Amélioré avec fallback array pour prévenir les crashes
   - Les deux pages implémentent :
     - Messages d'erreur structurés et spécifiques par code HTTP
     - Bouton "Réessayer" avec retry automatique
     - Fallback Array.isArray(data) ? data : [] pour éviter les TypeError sur .map()
     - Priorité aux messages detail de l'API pour les erreurs spécifiques
     - Attributs ARIA pour l'accessibilité (role="alert", aria-live="assertive")

3. **AC4 - Tests complets** :
   - **CashRegisters.test.tsx** (14 tests) :
     - Success scenarios : chargement, empty state, fallback non-array
     - Error handling : 401, 403, 500, network errors, retry
     - User interactions : create, edit, delete modals
     - Delete operations : success et erreurs avec détails API
   - **Sites.test.tsx** (31 tests existants + 7 nouveaux) :
     - Ajouté tests pour fallback array, retry, codes HTTP spécifiques
     - Tous les tests passent ✅

4. **AC5 - Documentation** :
   - Mis à jour frontend/README.md avec section détaillée sur VITE_API_URL
   - Expliqué la configuration /api pour dev et prod
   - Documenté le proxy Vite et les commandes de rebuild Docker

### File List
**Modified:**
- frontend/src/pages/Admin/CashRegisters.tsx
- frontend/src/pages/Admin/Sites.tsx
- frontend/README.md

**Created:**
- frontend/src/pages/Admin/__tests__/CashRegisters.test.tsx

**Updated:**
- frontend/src/pages/Admin/__tests__/Sites.test.tsx

### Change Log
- 2025-01-27: Implémentation complète de la gestion d'erreurs avec retry et fallbacks
- 2025-01-27: Création de la suite de tests CashRegisters (14 tests, 100% pass)
- 2025-01-27: Ajout de 7 tests supplémentaires pour Sites.tsx
- 2025-01-27: Documentation de VITE_API_URL dans le README frontend

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellente implémentation avec une gestion d'erreurs robuste et complète. Le code respecte les standards de qualité avec une architecture claire, une gestion d'erreurs exhaustive et des tests complets. La documentation a été mise à jour de manière appropriée.

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et suit les bonnes pratiques.

### Compliance Check

- Coding Standards: ✓ Code TypeScript strict, gestion d'erreurs appropriée, tests complets
- Project Structure: ✓ Utilisation correcte de l'API unifiée, respect de l'architecture
- Testing Strategy: ✓ Pyramide de tests respectée (45 tests au total), couverture exhaustive
- All ACs Met: ✓ Tous les critères d'acceptation sont implémentés et testés

### Improvements Checklist

- [x] Gestion d'erreurs HTTP complète avec messages spécifiques (401, 403, 404, 409, 500+)
- [x] Fallback array pour éviter les crashes sur .map()
- [x] Bouton retry avec rechargement automatique
- [x] Tests unitaires exhaustifs (14 tests CashRegisters + 38 tests Sites)
- [x] Documentation VITE_API_URL dans README frontend
- [x] Gestion des erreurs réseau et offline
- [x] Attributs ARIA pour l'accessibilité
- [x] Priorité aux messages detail de l'API pour les erreurs spécifiques

### Security Review

Gestion appropriée des erreurs d'authentification et d'autorisation. Les messages d'erreur sont informatifs sans révéler d'informations sensibles. Aucune vulnérabilité identifiée.

### Performance Considerations

Implémentation de fallbacks pour éviter les crashes, retry automatique pour la résilience. Le code gère efficacement les états de chargement et d'erreur.

### Files Modified During Review

Aucune modification effectuée - le code est déjà de qualité production.

### Gate Status

Gate: PASS → docs/qa/gates/4.6-admin-api-integration-refactor.yml
Risk profile: N/A (risques faibles)
NFR assessment: Toutes les exigences non-fonctionnelles validées

### Recommended Status

✓ Done

### Corrections Post-Review

**Date:** 2025-01-27 (Correction PO)

**Problème Identifié:** Détection des erreurs réseau incorrecte
- **Issue:** Code vérifiait `e?.code === 'NETWORK_ERROR'` mais Axios remonte `ERR_NETWORK`
- **Impact:** Messages d'erreur en anglais au lieu du français en production
- **Solution:** Ajout de la détection `ERR_NETWORK` en plus de `NETWORK_ERROR`

**Fichiers Corrigés:**
- `frontend/src/pages/Admin/CashRegisters.tsx` : Détection ERR_NETWORK ajoutée
- `frontend/src/pages/Admin/Sites.tsx` : Détection ERR_NETWORK ajoutée  
- `frontend/src/pages/Admin/__tests__/CashRegisters.test.tsx` : Test ERR_NETWORK ajouté
- `frontend/src/pages/Admin/__tests__/Sites.test.tsx` : Test ERR_NETWORK ajouté

**Tests Ajoutés:**
- Test spécifique pour `ERR_NETWORK` dans CashRegisters (1 nouveau test)
- Test spécifique pour `ERR_NETWORK` dans Sites (1 nouveau test)
- **Total tests:** 47 (45 + 2 nouveaux)

**Validation:**
- ✅ Détection des deux codes d'erreur réseau (ERR_NETWORK et NETWORK_ERROR)
- ✅ Messages français appropriés en production
- ✅ Tests couvrent les deux scénarios
- ✅ Rétrocompatibilité maintenue
