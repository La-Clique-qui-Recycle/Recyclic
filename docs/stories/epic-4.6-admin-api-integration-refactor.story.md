# Story 4.6: Harmoniser les appels API Admin (Sites & Postes de caisse)
**Status:** Draft  
**Epic:** Epic 4 – Exports & Synchronisation Cloud

## Story Statement
As an admin user,  
I want the “Sites” and “Postes de caisse” back-office pages to consume the API through the unified client and handle network errors gracefully,  
so that these management screens work reliably in all environments (dev, staging, prod).

## Acceptance Criteria
1. Les deux pages utilisent l’instance xiosClient (ou les clients générés SitesApi / CashRegistersApi) configurée avec un aseURL relatif (/api), sans URL absolue http://api:8000.
2. Chaque page gère les erreurs réseau ou HTTP (=400) : affichage d’un message structuré, bouton “Réessayer”, absence de TypeError dans la console.
3. Implémenter un fallback : si la réponse n’est pas un tableau, ne pas appeler map et afficher l’état d’erreur (éviter plantage UI).
4. Ajouter / mettre à jour les tests unitaires (Vitest) couvrant succès et erreurs pour les hooks/services utilisés, et au moins un test d’intégration front simulant un 200 et un 500.
5. Documenter dans un README ou changelog Front la configuration VITE_API_URL=/api en dev et rappeler que les changements d’env nécessitent docker compose --profile dev up -d --build.

## Dev Notes

### Références Architecturales Clés
1. **COMMENCER PAR** : docs/architecture/architecture.md – navigation complète (sections 10. Standards... et 11.1 Configuration des Ports).
2. docs/architecture/architecture.md#10-standards-et-règles-dimplémentation-critiques – conventions front, proxy Vite /api -> http://api:8000.
3. docs/testing-strategy.md#1-principes-fondamentaux – pyramide des tests & couverture attendue.

### Contexte / stories précédentes
- Écrans hérités de Story 4.3 du même epic (dashboard admin multi-caisses) mais non alignés avec la stratégie API (section 7.2 de l’architecture). Pas de story existante dans docs/stories, donc aucune dépendance bloquante.

### Insights Techniques
- **Client API** : rontend/src/api/axiosClient.ts doit rester la source unique (aseURL = import.meta.env.VITE_API_URL || '/api').
- **Proxy Vite** : déjà configuré dans rontend/vite.config.js; la page doit appeler /api/... pour profiter de la réécriture.
- **Gestion erreurs** : prévoir un composant/error state réutilisable pour les listes admin.
- **Tests** : utiliser Vitest + msw pour simuler API (succès / erreur). Respecter la pyramide de tests (docs/testing-strategy.md).
- **Structure** : conserver rontend/src/pages/Admin/* pour les pages, rontend/src/generated/* pour les clients auto-générés.

### Technical Constraints
- Pas d’URL absolue en front (http://api:8000).
- Compatibilité proxy dev (Vite) et Traefik (ROOT_PATH=/api en staging/prod).
- Respecter la séparation des stores Zustand par domaine (docs/architecture/architecture.md#10.3).

## Tasks / Subtasks
1. **Audit & bascule client API** (AC1)
   - Remplacer rontend/src/services/api.js par les clients générés ou xiosClient mutualisé.
   - Vérifier/importer les types générés (rontend/src/generated/api.ts).
2. **Gestion d’erreurs UI** (AC2 & AC3)
   - Ajouter un composant d’erreur commun (message + retry).
   - Garantir que items reste un tableau (fallback []).
3. **Documentation env** (AC5)
   - Mettre à jour un README front ou la doc dev avec VITE_API_URL=/api + rebuild compose.
4. **Tests** (AC4)
   - Vitest sur le hook/service (succès + échec).
   - Test d’intégration front (ex. msw) pour vérifier rendu erreur.

## Project Structure Notes
- Les pages restent sous rontend/src/pages/Admin/.
- Les clients générés se trouvent dans rontend/src/generated/.
- Aucune logique réseau dupliquée : centraliser via xiosClient ou hooks dédiés.
