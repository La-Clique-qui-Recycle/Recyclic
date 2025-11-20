# Instructions d'utilisation

## Démarrage rapide (dev)
1. Copier la configuration: `cp env.example .env` puis ajuster les secrets si besoin.
2. Lancer la stack: `docker-compose up` (services `api`, `frontend`, `postgres`, `redis`).
3. Créer le premier super administrateur après le démarrage: `docker-compose exec api sh /app/create_admin.sh <user> <mot_de_passe>`.
4. Accéder aux services :
   - API : http://localhost:4433
   - Frontend : http://localhost:4444

## Ouverture et fermeture de caisse
- **Ouverture** : choisir l'opérateur, saisir ou accepter le fond proposé, valider pour générer le ticket d'ouverture puis accéder à l'interface de vente.
- **Fermeture** : depuis l'écran dédié, saisir le décompte physique, comparer au solde théorique, commenter tout écart et valider pour produire le ticket de fermeture (inclut la suggestion du fond du lendemain).

## Saisie d'un ticket de vente
1. **Mode Catégorie** : sélectionner l'une des 8 catégories EEE (et sous-catégories éventuelles) en tactile ou via raccourcis clavier affichés (A Z E R T Y U I O P).
2. **Mode Quantité** : saisir la quantité via le pavé numérique ou le clavier.
3. **Mode Prix** : soit saisir un prix, soit utiliser les boutons rapides Don 0 €, Don -18, Recyclage, Déchèterie.
4. **Ticket** : chaque ligne ajoutée est éditable tant que la vente n'est pas finalisée; le ticket possède un ascenseur pour conserver en vue le total et le bouton Finaliser.
5. **Paiement** : choisir le mode de paiement, confirmer; un ticket est généré puis l'interface revient en mode Catégorie.

## Gestion des catégories et affichage
- Chaque catégorie possède une case à cocher pour contrôler son affichage dans les tickets d'entrée; les catégories parentes propagent automatiquement l'état aux sous-catégories.
- Les raccourcis clavier sont toujours visibles sur les boutons de catégories/sous-catégories pour rappeler la touche associée.

## Notes opérationnelles
- Les sessions JWT expirent après 30 minutes; la reconnexion est alors nécessaire.
- La couche bot Telegram et IA de classification est désactivée dans cet environnement; seul le parcours caisse/front + API est actif.
- Les sauvegardes automatiques de base de données sont couvertes par les runbooks de la plateforme (voir `docs/runbooks`).
