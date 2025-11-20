# RecyClique v1.3.0 — README synthétique

## Vision du produit
RecyClique digitalise les ressourceries en couvrant l'ouverture de caisse, la saisie des ventes multi-modes et l'export réglementaire, tout en gardant un usage tablette/clavier rapide. La marque et l'interface ont été renommées "RecyClique" pour cette version 1.3.0 et la couche bot Telegram + IA reste désactivée dans l'état actuel du déploiement.

## Fonctionnalités principales de la caisse
- **Workflow séquentiel Catégorie → Quantité → Prix** avec navigation tactile ou clavier, auto-follow activé par défaut et retour arrière possible à chaque étape.
- **Boutons prix prédéfinis** à l'étape de prix : Don 0 €, Don -18, Recyclage et Déchèterie pour valider sans saisie manuelle.
- **Raccourcis clavier visibles** (A Z E R T Y U I O P) affichés sur chaque catégorie et sous-catégorie pour accélérer la saisie.
- **Affichage des catégories piloté par cases à cocher**, avec héritage automatique pour les catégories principales afin de contrôler leur présence dans les tickets d'entrée.
- **Ticket de vente avec ascenseur** maintenant le bloc total/prix/bouton Finaliser toujours visible sur les listes longues.
- **Signaux visuels d'étape** (encadrements colorés) pour indiquer le mode actif et limiter les erreurs de saisie.
- **Bloc central remanié** : destination, notes et bouton Ajouter sont regroupés à droite d'un pavé numérique compact, avec pavé numérique large pour les ouvertures/fermetures de caisse.

## Flux métier couverts
- **Ouverture de session** : sélection opérateur, saisie ou pré-remplissage du fond de caisse, génération du ticket d'ouverture et verrouillage de l'interface tant que l'ouverture n'est pas validée.
- **Vente multi-lignes** : sélection catégorie (EEE-1 à EEE-8 + sous-catégories), saisie quantité et prix (ou bouton prix rapide), ajout de lignes éditables avant finalisation, sauvegarde locale automatique.
- **Finalisation et paiement** : sélection du mode de paiement, validation du ticket et impression, puis retour au mode catégorie pour la vente suivante.
- **Fermeture de session** : calcul du solde théorique, saisie du décompte physique, détection des écarts avec commentaire obligatoire et ticket de fermeture incluant la préparation du fond du jour suivant.

## Composants techniques
- **Frontend** : PWA React/Vite orientée tablette avec navigation tactile + clavier, colonne ticket en temps réel et pavé numérique.
- **Backend** : API FastAPI exposant la logique métier, l'authentification JWT (sessions 30 minutes, reconnection requise après expiration) et les endpoints d'administration.
- **Stockage** : PostgreSQL pour les données métiers, Redis pour le cache/session, sauvegardes automatiques documentées dans les runbooks.
- **Infra** : Docker Compose (services `api`, `frontend`, `postgres`, `redis`, reverse proxy). Services dev accessibles sur `http://localhost:4433` (API) et `http://localhost:4444` (frontend).

## Rôles et accès
- Interface caisse accessible aux rôles `cashier`, `admin` et `super-admin` ; administration restreinte à `admin` et `super-admin` ; autres sections accessibles à tout utilisateur authentifié.
- Création du premier super administrateur via le script `create_admin.sh` une fois les conteneurs démarrés.

## Ressources de référence
- PRD v1.3.0 actif (caisse, raccourcis, boutons prix, refonte UX) et spécification UX détaillée disponibles dans `docs/v1.3.0-active/prd/` et `docs/front-end-spec.md`.
- Architecture consolidée (services, patterns, annexe OpenAPI) disponible dans `docs/architecture/`.
