# Instructions d'utilisation — RecyClique v1.3.0

Ces instructions couvrent l'usage quotidien de l'interface caisse (frontend React/Vite) et les commandes essentielles pour l'environnement Docker Compose.

## 1. Démarrage environnement
1. Copier la configuration : `cp env.example .env` puis adapter les secrets.
2. Lancer la stack : `docker-compose up` (services `api`, `frontend`, `postgres`, `redis`).
3. Créer un super administrateur une fois l'API prête : `docker-compose exec api sh /app/create_admin.sh <user> <mot_de_passe>`.
4. Points d'accès : API http://localhost:4433, Frontend http://localhost:4444.

## 2. Cycle quotidien caisse
1. **Ouverture de session**
   - Sélectionner l'opérateur (liste déroulante) et confirmer le poste (register).
   - Saisir ou accepter le fond proposé (pré-rempli depuis l'historique). Les grands pavés numériques facilitent la saisie.
   - Valider pour générer le ticket d'ouverture puis accéder à l'écran de vente.
2. **Saisie d'un ticket de vente**
   - Étape Catégorie : choisir EEE-1 à EEE-8 ou sous-catégorie via tactile ou raccourcis A Z E R T Y U I O P (affichés sur les boutons).
   - Étape Quantité : saisir au pavé numérique ou clavier. Auto-follow amène ensuite le curseur sur le Prix.
   - Étape Prix : saisir un montant ou utiliser un bouton rapide (Don 0 €, Don -18, Recyclage, Déchèterie). Ajouter éventuellement notes et destination.
   - Ajouter la ligne au ticket. Répéter pour plusieurs lignes : le ticket conserve le total visible grâce à l'ascenseur.
   - Corriger si besoin : modifier quantité/prix ou supprimer une ligne tant que la vente n'est pas finalisée.
3. **Finalisation et paiement**
   - Choisir le mode de paiement (Espèces, Chèque, Carte si activé) puis valider. Un ticket est généré et l'interface revient au mode Catégorie.
4. **Fermeture de session**
   - Depuis l'écran dédié, saisir le décompte physique (billets/pièces) avec le pavé large.
   - Le système calcule l'écart théorique/réel; renseigner un commentaire si un écart existe.
   - Valider pour produire le ticket de fermeture et la suggestion du fond du lendemain.

## 3. Gestion des catégories
- Chaque catégorie dispose d'une case à cocher contrôlant sa présence dans l'interface d'entrée; les états se propagent aux sous-catégories.
- Les raccourcis clavier restent affichés sur les boutons de catégories/sous-catégories pour rappeler la touche associée.
- Les prix sont libres par ligne; les presets/notes sont stockés sur chaque item pour traçabilité.

## 4. Règles et limites à connaître
- Les sessions JWT expirent après 30 minutes : se reconnecter si l'interface redirige vers la connexion.
- La couche bot Telegram et IA de classification n'est pas active dans cette version; seul le flux caisse/front + API est utilisé.
- Les sauvegardes Postgres/Redis sont gérées par les runbooks de plateforme (`docs/runbooks/`).
