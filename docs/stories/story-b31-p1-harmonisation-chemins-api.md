# User Story (Tâche Technique): Standardiser les Chemins d'API pour la Cohérence Dev/Prod

**ID:** STORY-B31-P1
**Titre:** Harmoniser les chemins d'appel API entre le client et le proxy de développement
**Epic:** EPIC-B30 - Refactorisation Complète de l'Architecture de Déploiement Frontend
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** que les chemins d'API dans le code source soient relatifs à la `baseURL` (`/api`) pour correspondre à la configuration du proxy Vite,
**Afin de** résoudre l'erreur `404` en développement local causée par une duplication du préfixe `/api`.

## Contexte

Le problème actuel est une "Concaténation Fatale". Le client `axios` a une `baseURL` de `/api` (via `.env.development`), mais le code auto-généré appelle des chemins qui contiennent déjà `/api` (ex: `/api/v1/auth/login`). Le résultat est une URL incorrecte (`/api/api/v1/...`).

La solution propre n'est pas d'utiliser une règle `rewrite` dans le proxy (qui est un pansement), mais de corriger les chemins à la source pour qu'ils soient relatifs à la `baseURL`.

## Critères d'Acceptation / Plan d'Action

1.  **Modifier le Schéma OpenAPI (La Source de Vérité) :**
    - [ ] Ouvrir le fichier `api/openapi.json`.
    - [ ] Effectuer une recherche et un remplacement global pour changer **toutes** les occurrences de `"/api/v1/` en `"/v1/` dans la section `"paths"`.
    - [ ] **Exemple de modification :**
      - **Avant :** `"/api/v1/sites/": { ... }`
      - **Après :** `"/v1/sites/": { ... }`

2.  **Re-générer le Client API :**
    - [ ] Se placer dans le répertoire `frontend/`.
    - [ ] Exécuter la commande `npm run codegen` pour re-générer le client API à partir du schéma corrigé.

3.  **Vérification du Code Généré :**
    - [ ] Ouvrir le fichier `frontend/src/generated/api.ts` après la génération.
    - [ ] Vérifier que les appels de méthode utilisent maintenant des chemins relatifs qui commencent par `/v1/...` (et non plus `/api/v1/...`).
    - [ ] **Exemple de code attendu :** `await apiClient.post("/v1/auth/login", data);`

4.  **Valider la Configuration de Développement :**
    - [ ] S'assurer que le fichier `frontend/.env.development` contient bien `VITE_API_URL=/api`.
    - [ ] S'assurer que le fichier `frontend/vite.config.js` a bien une configuration de proxy **sans** la règle `rewrite`.
      ```javascript
      proxy: {
        '/api': {
          target: 'http://api:8000',
          changeOrigin: true,
          secure: false,
        },
      },
      ```

## Definition of Done

- [ ] Toutes les actions ci-dessus sont complétées et vérifiées.
- [ ] La commande `docker compose --profile dev up --build -d` lance avec succès l'environnement de développement local.
- [ ] La connexion à l'application sur `http://localhost:4444` fonctionne sans erreur `400` ou `404`.
- [ ] Les appels API dans l'onglet "Réseau" du navigateur montrent des requêtes vers `http://localhost:4444/api/v1/...` qui retournent un code `200 OK`.
- [ ] La story a été validée par le Product Owner.
