# Brief de présentation du système (pour intégration AI)

## Objectif
Offrir à un agent tiers une vue consolidée des capacités RecyClique v1.3.0 pour étudier une connexion avec un autre système, sans activer la couche bot Telegram/IA.

## Panorama fonctionnel
- **Caisse tactile + clavier** : workflow Catégorie → Quantité → Prix avec boutons rapides Don 0 €, Don -18, Recyclage, Déchèterie et raccourcis A/Z/E/R/T/Y/U/I/O/P visibles.
- **Gestion des catégories** : cases à cocher pour contrôler l'affichage dans les tickets d'entrée; héritage automatique pour les catégories parentes; visuels indiquant l'étape active.
- **Sessions de caisse** : ouverture (sélection opérateur + fond de caisse), ventes multi-lignes, sauvegarde locale automatique, finalisation avec choix de paiement, fermeture avec rapprochement théorique/réel et commentaire obligatoire en cas d'écart.

## Architecture et composants
- **Frontend (PWA React/Vite)** : interface caisse responsive, colonne ticket avec ascenseur, pavé numérique et indicateurs d'étape.
- **Backend (FastAPI)** : expose l'authentification JWT (sessions 30 minutes), la gestion des utilisateurs/permissions et les workflows de vente; compatible avec l'annexe OpenAPI.
- **Données** : PostgreSQL pour la persistance métier; Redis pour cache/session; sauvegardes automatiques prévues.
- **Infra Docker Compose** : services `api`, `frontend`, `postgres`, `redis`, reverse proxy; accès local par défaut `http://localhost:4433` (API) et `http://localhost:4444` (frontend).
- **Services inactifs** : bot Telegram et pipeline IA de classification ne sont pas activés dans l'environnement courant.

## Endpoints principaux utilisés
Référencés sur `/api/v1` via le reverse proxy :
- `GET /health` : vérification de disponibilité.
- `GET /admin/users` : liste paginée des utilisateurs (admin/super-admin requis).
- `PUT /admin/users/{user_id}/role` : mise à jour du rôle (admin/super-admin requis).

## Points d'attention pour intégration
- Respecter les rôles `super-admin`, `admin`, `cashier`, `user` ; l'interface caisse est limitée aux rôles caisse/administration selon la matrice de permissions.
- Prévoir la gestion d'expiration des tokens (30 minutes) côté client ou connecteur.
- La navigation et les raccourcis clavier font partie du contrat UX; toute automatisation doit respecter le séquencement Catégorie → Quantité → Prix pour rester alignée avec les opérateurs.
