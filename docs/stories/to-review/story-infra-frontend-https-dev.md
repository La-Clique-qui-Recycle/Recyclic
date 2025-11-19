---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:15.398312
original_path: docs/stories/story-infra-frontend-https-dev.md
---

# Story Infra: Exposer le Front-end en HTTPS pour le Développement

- **Statut**: Done
- **Type**: Infrastructure
- **Priorité**: Critique
- **Bloque**: Story 4.3

---

## Story

**En tant que** développeur travaillant sur le bot Telegram,
**Je veux** une URL publique et sécurisée (HTTPS) pour mon environnement de développement local,
**Afin de** pouvoir tester correctement les fonctionnalités de Telegram qui nécessitent un webhook (comme les boutons inline).

---

## Contexte et Problème à Résoudre

La Story 4.3 introduit des boutons `inline` dans le bot Telegram. Pour que ces boutons fonctionnent, les serveurs de Telegram doivent pouvoir envoyer une requête `callback` à notre bot. C'est impossible si le bot tourne sur une machine locale (`localhost`) sans être exposé à Internet. Cette story a pour but de mettre en place un tunnel HTTPS pour résoudre ce problème.

---

## Décision d'implémentation (DEV)

- Pour le développement local, nous avons décidé de ne pas utiliser de tunnel éphémère (Cloudflare/ngrok) afin d'éviter l'instabilité (erreur 1033) et la variabilité des URL.
- Les boutons inline Telegram sont désactivés en DEV (`ENABLE_INLINE_BUTTONS=false`) et remplacés par un fallback texte cliquable.
- `FRONTEND_URL` pointe sur `http://localhost:4444` en DEV.
- Le tunnel restera une option à activer ultérieurement si besoin (VPS/nom de domaine en PROD recommandé).

### Documentation
- Fallback cliquable et options de tunnel: voir `docs/architecture/tunnel-dev-prod.md`.

## Critères d'Acceptation

1.  [Optionnel en DEV] Un service de tunnel (cloudflared/ngrok) peut être intégré pour exposer le bot. Non activé dans cette itération.
2.  Une variable d'environnement `FRONTEND_URL` est utilisée et documentée pour l'environnement local.
3.  Le bot utilise `FRONTEND_URL` pour construire les URLs d'inscription/callback.
4.  En DEV, les boutons `inline` peuvent être désactivés au profit d'un fallback cliquable; en PROD/VPS, utiliser un domaine HTTPS.

---

## Tâches / Sous-tâches

- [ ] **Infrastructure (Docker)** (optionnel/différé):
    - [ ] Choisir un service de tunnel (cloudflared/ngrok) et conditions d'usage.
    - [ ] Ajouter un service dédié dans le `docker-compose.yml` (si nécessaire).
    - [ ] Configurer l'exposition du service ciblé.
- [ ] **Configuration**:
    - [x] Mettre à jour le fichier `env.example` pour inclure la variable `FRONTEND_URL`.
    - [x] Documenter la procédure (DEV/PROD) et l'option tunnel. Voir `docs/architecture/tunnel-dev-prod.md`.
- [ ] **Bot (Telegram)**:
    - [x] S'assurer que le code du bot utilise la variable d'environnement `FRONTEND_URL` pour construire les URLs.
    - [x] Ajouter `ENABLE_INLINE_BUTTONS=false` en DEV et un fallback texte cliquable.
- [ ] **Validation**:
    - [x] Démarrer l'environnement Docker complet.
    - [x] Tester `/start` et `/inscription` : le lien d'inscription apparaît en texte cliquable en DEV.

---

## QA Results

### Décision de Gate
- CONCERNS

### Constat et Vérifications
- Variable d'environnement `FRONTEND_URL` présente et documentée dans `env.example`.
  - Evidence: `env.example` définit `FRONTEND_URL` (placeholder HTTPS)
- Propagation dans l'orchestration confirmée.
  - Evidence: `docker-compose.yml` exporte `FRONTEND_URL` et `ENABLE_INLINE_BUTTONS` vers le service bot
- Usage côté bot confirmé.
  - Evidence: `bot/src/config.py` définit `FRONTEND_URL` par défaut à `http://localhost:4444` et `ENABLE_INLINE_BUTTONS=False`
  - Evidence: `bot/src/services/user_service.py` construit l'URL avec `settings.FRONTEND_URL`
- E2E Frontend utilisent l'URL locale `http://localhost:4444` (cohérent avec la stratégie DEV sans tunnel).
  - Evidence: `frontend/tests/e2e/admin.spec.ts` cible `FRONTEND_URL` local

### Écarts / Risques
- La sous-tâche "Documenter la procédure (DEV/PROD) et l'option tunnel" reste non cochée dans la story.
- `env.example` propose un placeholder HTTPS public par défaut, tandis que la décision d'implémentation privilégie DEV local sans tunnel; risque de confusion si non clarifié dans la doc d'exploitation.

### Recommandations
- Compléter la documentation opératoire: préciser clairement deux modes
  1) DEV local: `FRONTEND_URL=http://localhost:4444`, `ENABLE_INLINE_BUTTONS=false`
  2) Tunnel optionnel: `FRONTEND_URL=https://<public-dev-url>`, activer `ENABLE_INLINE_BUTTONS=true` après vérification HTTPS
- Ajouter un court paragraphe de dépannage (erreurs courantes tunnel 1033, renouvellement d'URL éphémère).

### Condition de Passage
- Une fois la documentation DEV/PROD/tunnel ajoutée et la case correspondante cochée, ce gate peut passer à PASS.
