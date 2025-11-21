# Brief de présentation du système (intégration AI)

Ce brief résume le périmètre RecyClique v1.3.0 pour un agent tiers. Le flux caisse (frontend React/Vite + API FastAPI) est actif; la couche bot Telegram/IA de classification est désactivée.

## 1. Panorama fonctionnel
- **Caisse tactile + clavier** : workflow Catégorie → Quantité → Prix avec auto-follow, raccourcis A Z E R T Y U I O P visibles sur les boutons, et pavé numérique contextuel.
- **Boutons prix rapides** : Don 0 €, Don -18, Recyclage, Déchèterie pour valider une ligne sans saisie manuelle; notes et destination par item.
- **Sessions de caisse** : ouverture (opérateur + fond), ventes multi-lignes, finalisation avec paiement, fermeture avec rapprochement théorique/réel et commentaire obligatoire en cas d'écart.
- **Pilotage des catégories** : cases à cocher pour contrôler l'affichage des catégories/sous-catégories dans l'interface de saisie; héritage parent → enfants.

## 2. Architecture et composants
- **Frontend** : PWA React/Vite (tablette), colonne ticket scrollable, bloc central notes/destination + pavé numérique, indicateurs d'étape.
- **Backend** : API FastAPI versionnée `/api/v1` (auth JWT 30 min, sessions de caisse, ventes, catégories, rapports, administration). Routers principaux sous `api/src/recyclic_api/api/api_v1/endpoints/`.
- **Données** : PostgreSQL (données métier) + Redis (cache/session). Migrations Alembic, sauvegardes décrites dans `docs/runbooks/`.
- **Infra locale** : Docker Compose (`api`, `frontend`, `postgres`, `redis`, reverse proxy) exposée sur `localhost:4433` (API) et `localhost:4444` (frontend).
- **Services inactifs** : bot Telegram et pipeline IA non démarrés dans cet environnement.

## 3. Endpoints principaux utilisés (API `/api/v1`)
- **Santé & auth** : `GET /health`, `POST /auth/login`, `GET /users/me` (vérification de session), JWT Bearer 30 min.
- **Sessions de caisse** : `POST /cash_sessions` (ouvrir), `GET /cash_sessions/status/{register_id}` (status poste), `PATCH /cash_sessions/{id}` ou `/close` (mise à jour/fermeture), `GET /cash_sessions/{id}` (détails + ventes).
- **Ventes** : `POST /sales` (création vente liée à une session, items avec prix/notes/preset), `GET /sales` (listing) et `GET /sales/{id}` (détail).
- **Catégories & presets** : `GET /categories` (arbre catégories + flags d'affichage), `PUT /categories/{id}` (mise à jour d'affichage/prix si activé), `GET /presets` (boutons/valeurs préconfigurées).
- **Administration restreinte** : `GET /admin/users` et `PUT /admin/users/{id}/role` (rôles), `GET /reports/cash_sessions/{id}` (export PDF/CSV), `GET /stats` (tableau de bord agrégé).

## 4. Points d'attention pour intégration
- **Rôles** : respecter `super-admin`, `admin`, `cashier`, `user`; l'accès caisse nécessite cashier/admin/super-admin, l'admin est restreinte.
- **Contrat UX** : l'automatisation doit suivre la séquence Catégorie → Quantité → Prix et conserver les raccourcis/règles de navigation pour rester aligné avec les opérateurs.
- **Expiration tokens** : prévoir la reconnexion toutes les 30 minutes ou rafraîchir le token côté connecteur.
- **Traçabilité** : chaque vente est associée à un `cash_session_id` et à l'opérateur du JWT; ne pas créer de ventes sans session ouverte.
- **Services désactivés** : ne pas s'appuyer sur le bot Telegram ou la classification IA tant qu'ils ne sont pas réactivés.
