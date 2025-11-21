# RecyClique v1.3.0 — README complet

Ce dossier fournit une vue d'ensemble opérationnelle et technique de RecyClique v1.3.0 telle que livrée dans le codebase actuel (parcours caisse actif, bot Telegram + IA désactivés). Il synthétise les workflows BMAD livrés, les choix UX, l'architecture et les points d'exploitation.

## 1. Fonctionnement général de la caisse
- **Séquence guidée** : Catégorie → Quantité → Prix, avec auto-follow (focus automatique sur l'étape suivante) et retour arrière possible. L'état actif est signalé visuellement (bordures/couleur) pour limiter les erreurs.
- **Raccourcis clavier** : touches AZERTY UI haut de ligne (A Z E R T Y U I O P) affichées sur chaque (sous-)catégorie pour une saisie rapide clavier + tactile.
- **Pavés numériques** : pavé compact en mode vente (quantité/prix) et pavé large dédié aux écrans d'ouverture/fermeture de caisse.
- **Prix rapides** : boutons Don 0 €, Don -18, Recyclage, Déchèterie à l'étape Prix pour clôturer une ligne sans saisie manuelle.
- **Ticket en temps réel** : colonne ticket avec ascenseur maintenant visibles le total, le mode actif et le bouton Finaliser, même sur des ventes longues.
- **Édition avant finalisation** : chaque ligne reste éditable (quantité, prix, suppression) jusqu'à la validation du paiement.
- **Champs optionnels** : destination/sortie (don, -18, recyclage, déchèterie) et notes libres par ligne, alignés avec la Story 1.1.2 (notes/preset par item).

## 2. Parcours métier détaillé
1. **Ouverture de session**
   - Sélection opérateur (liste) + enregistrement du poste (`register_id`).
   - Saisie ou acceptation du fond de caisse proposé (pré-remplissage basé sur historique/calendrier).
   - Validation génère un ticket d'ouverture et verrouille l'accès tant que l'ouverture n'est pas validée.
2. **Saisie d'une vente**
   - Choisir la catégorie EEE (EEE-1 à EEE-8) ou sous-catégorie via bouton ou raccourci.
   - Saisir quantité (pavé numérique/clavier) puis prix ou bouton rapide (Don 0 €, Don -18, Recyclage, Déchèterie).
   - Ajouter la ligne au ticket; répéter pour plusieurs lignes (multi-lignes).
3. **Finalisation & paiement**
   - Choix du mode de paiement (Espèces, Chèque, Carte si activé), calcul du total et génération du ticket de vente.
   - Le backend trace l'opérateur (token JWT) et associe la vente à la session de caisse courante.
4. **Fermeture de session**
   - Calcul du solde théorique, saisie du décompte physique (billets/pièces), comparaison et alerte en cas d'écart > seuil.
   - Commentaire obligatoire sur écart, génération du ticket de fermeture et suggestion du fond du lendemain.

## 3. Gestion des catégories et affichage
- **Pilotage par cases à cocher** : chaque catégorie possède un flag d'affichage; l'activation d'une catégorie parente propage l'état aux sous-catégories.
- **Affichage UX** : les boutons de catégories/sous-catégories affichent le raccourci clavier associé et l'état actif (surbrillance) pour guider l'opérateur.
- **Prix & presets** : prix libres au niveau de la ligne; presets et notes sont stockés sur chaque `sale_item` pour conserver le contexte d'origine.

## 4. Rôles, sessions et sécurité
- **Rôles** : `cashier`, `admin`, `super-admin` ont accès à la caisse; l'administration (utilisateurs/paramètres) est restreinte à `admin` et `super-admin`.
- **Sessions JWT** : validité de 30 minutes; reconnection requise après expiration. Les tokens sont portés en Authorization Bearer sur l'API.
- **Traçabilité** : chaque vente est liée à l'opérateur authentifié et à une `cash_session`; audit des ouvertures/fermetures en base et logs.

## 5. Architecture technique
- **Frontend** : PWA React/Vite optimisée tablette, navigation tactile + clavier, colonnes flex (ticket + zone centrale), pavés numériques contextuels.
- **Backend** : API FastAPI `api/v1` (auth JWT, sessions de caisse, ventes, catégories, rapports). Les endpoints clés sont sous `api/src/recyclic_api/api/api_v1/endpoints/` (sessions, sales, categories, users, reports).
- **Données** : PostgreSQL (données métier), Redis (cache/session), migrations Alembic. Sauvegardes automatisées décrites dans `docs/runbooks/`.
- **Infra** : Docker Compose avec services `api`, `frontend`, `postgres`, `redis`, reverse proxy. Accès local par défaut `http://localhost:4433` (API) et `http://localhost:4444` (frontend).
- **Composants désactivés** : bot Telegram et pipeline IA de classification non démarrés dans cette version.

## 6. Démarrage (rappel)
```bash
cp env.example .env
# Ajuster les secrets si besoin
docker-compose up
# Créer le premier super admin
docker-compose exec api sh /app/create_admin.sh <user> <mot_de_passe>
```

## 7. Références internes utiles
- PRD v1.3.0 (parcours caisse, raccourcis, boutons prix, refonte UX) : `docs/v1.3.0-active/prd/`
- Spécifications front détaillées : `docs/front-end-spec.md`
- Architecture consolidée et annexes OpenAPI : `docs/architecture/`
- Guides d'exploitation et sauvegardes : `docs/runbooks/`
