# Story 4.6: Harmoniser les appels API Admin (Sites & Postes de caisse)
**Status:** Draft  
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
