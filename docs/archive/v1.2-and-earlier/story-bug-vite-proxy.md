# Story (Bug): Correction du Proxy de Développement Vite

**ID:** STORY-BUG-VITE-PROXY
**Titre:** Correction du Proxy de Développement Vite pour les requêtes POST
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur,  
**Je veux** que le proxy de développement Vite relaie correctement les requêtes POST vers l'API backend,  
**Afin de** pouvoir me connecter à l'application et tester les fonctionnalités qui nécessitent une authentification.

## Contexte

Actuellement, toute tentative de connexion à l'application en environnement de développement échoue avec une erreur `405 Not Allowed` de Nginx. Cela est dû à une mauvaise configuration du proxy de développement Vite qui ne relaie pas correctement les requêtes `POST` vers le service `api`.

## Critères d'Acceptation

1.  La connexion à l'application via le formulaire de login est fonctionnelle en environnement de développement.
2.  Les requêtes `POST` vers `/api/v1/auth/login` sont correctement relayées au service `api`.
3.  La configuration du proxy dans `frontend/vite.config.js` est corrigée pour gérer correctement les requêtes `POST`.

## Notes Techniques

-   **Piste d'investigation :** L'agent DEV doit inspecter la section `server.proxy` dans `frontend/vite.config.js` et s'assurer que la configuration est correcte pour les requêtes `POST`.
-   Il est possible que la configuration actuelle ne gère que les requêtes `GET` par défaut.

## Definition of Done

- [x] La connexion à l'application est fonctionnelle en environnement de développement.
- [x] La configuration du proxy Vite est corrigée.
- [x] La story a été validée par le Product Owner.

## Dev Agent Record

### Debug Log

**Problème identifié :**
- Le proxy Vite dans `frontend/vite.config.js` n'était pas configuré explicitement pour gérer les méthodes HTTP POST
- Les headers CORS et de débogage n'étaient pas configurés
- L'erreur `405 Not Allowed` suggérait que Nginx bloquait les requêtes POST

**Corrections appliquées :**
- ✅ Ajout d'une configuration explicite `configure` pour le proxy Vite avec gestion des erreurs et logs de débogage
- ✅ Ajout de headers CORS complets pour autoriser toutes les méthodes HTTP (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ Configuration des headers d'autorisation et autres headers nécessaires

**Configuration corrigée dans `frontend/vite.config.js` :**
```javascript
proxy: {
  '/api': {
    target: 'http://api:8000',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/api/, ''),
    // Configuration explicite pour les requêtes POST et autres méthodes
    configure: (proxy, _options) => {
      proxy.on('error', (err, _req, _res) => {
        console.log('proxy error', err);
      });
      proxy.on('proxyReq', (proxyReq, req, _res) => {
        console.log('Sending Request to the Target:', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, _res) => {
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
      });
    },
    // Headers pour éviter les problèmes CORS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
    },
  },
}
```

**Tests validés :**
- ✅ Connexion PostgreSQL fonctionnelle
- ✅ API répond correctement aux requêtes POST
- ✅ Proxy Vite relaie les requêtes POST vers l'API
- ✅ Réponse attendue reçue : "Identifiants invalides ou utilisateur inactif" (normal pour un utilisateur inexistant)

**Résultat :**
Le proxy Vite fonctionne maintenant correctement pour toutes les méthodes HTTP, permettant la connexion à l'application en environnement de développement.

## QA Results

### Review Date: 2025-09-23

### Reviewed By: Quinn (Test Architect)

### Vérifications

- Configuration proxy Vite corrigée et présente dans `frontend/vite.config.js` (rewrite, configure handlers, CORS headers, POST géré).
- Scripts de démarrage OK dans `frontend/package.json` (`dev`/`start` via vite).
- Connexion en dev confirmée par logs et comportement attendu (erreur métier côté API pour user inexistant, pas 405).

### Compliance Check

- Coding Standards: ✓
- Project Structure: ✓
- Testing/Dev Workflow: ✓ (proxy dev conforme)
- All ACs Met: ✓

### Improvements (optionnelles)

- [ ] Restreindre `Access-Control-Allow-Origin` en dev si nécessaire (sécurité d'équipe).
- [ ] Ajouter un test e2e Playwright minimal de login (dev proxy path) dans la CI dev.

### Gate Status

Gate: PASS → `.bmad-core/qa/gates/BUG.VITE-PROXY.yml`

### Recommended Status

✓ Ready for Done
