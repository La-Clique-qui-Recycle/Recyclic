## Tunnel Optionnel (DEV / PROD)

Objectif: Exposer temporairement un service local via une URL publique HTTPS pour tests (ex: webhooks Telegram).

### Quand l’utiliser
- DEV local sans accès public et besoin d’URL HTTPS (webhooks, callbacks).
- Dépannage ponctuel (démonstrations, tests à distance).

### Quand ne pas l’utiliser
- PROD sur VPS: préférer domaine + reverse proxy (Nginx/Caddy) + HTTPS (Let’s Encrypt).
- Environnement local sans besoin d’accès externe.

### Options supportées
- Cloudflare Tunnel (nommé) – URL stable (nécessite compte CF). Quick tunnel non recommandé (instabilité 1033).
- ngrok – pratique; sous-domaine réservé avec compte.
- Alternatives: SSH reverse tunnel, FRP, VPN (WireGuard) + proxy.

### Paramètres projet
- `FRONTEND_URL`: base pour construire les liens vers le front.
- `ENABLE_INLINE_BUTTONS`: si `false`, le bot envoie un lien texte cliquable (pas de contrainte HTTPS).

### Recommandations
- DEV: `ENABLE_INLINE_BUTTONS=false`, `FRONTEND_URL=http://localhost:4444` ou IP LAN.
- Si tunnel requis: utiliser tunnel "nommé" (Cloudflare/ngrok) et pointer `FRONTEND_URL` dessus.
- PROD: pas de tunnel; domaine + HTTPS.


