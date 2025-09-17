# Epic 5: Interface Caisse & Workflow Vente

**Objectif :** Créer l'interface caisse responsive complète avec gestion des sessions, vente multi-modes, caisse physique et fonctionnement offline. Délivre le workflow complet de vente avec conformité gestion de caisse.

## Story 5.1: Ouverture Session & Fond de Caisse
As a cashier,  
I want to open a cash register session with initial funds,  
so that I can start selling items with proper cash management.

**Acceptance Criteria:**
1. [x] Interface ouverture session avec sélection opérateur (liste déroulante)
2. [x] Saisie fond de caisse initial avec validation numérique
3. [x] Génération ticket d'ouverture avec horodatage et montant
4. [x] Interface principale caisse accessible seulement après ouverture valide
5. [x] Persistence session locale (PWA) pour reconnexion automatique
6. [x] Pré-remplissage intelligent basé sur historique/calendrier

## Story 5.2: Interface Vente Multi-Modes
As a cashier,  
I want to easily enter item sales with different input modes,  
so that I can quickly process customers while maintaining accuracy.

**Acceptance Criteria:**
1. Interface responsive gros boutons (tablette + souris/clavier)
2. 3 modes séquentiels auto-follow : Catégorie → Quantité → Prix
3. Boutons modes visuellement distincts (allumé/éteint)
4. Pavé numérique grandes touches pour saisie
5. Catégories EEE-1 à EEE-8 avec sous-catégories déroulantes si besoin
6. Raccourcis clavier configurables (Tab, flèches) pour navigation rapide

## Story 5.3: Ticket Temps Réel & Gestion Erreurs
As a cashier,  
I want to see a live ticket with running total and edit capabilities,  
so that I can correct mistakes and track the current sale accurately.

**Acceptance Criteria:**
1. Colonne ticket affichage temps réel (lignes + total cumulé)
2. Édition lignes : modifier quantité, prix, supprimer
3. Validation admin requise pour certaines corrections (config)
4. Sauvegarde automatique locale toutes les 30 secondes
5. Mode de paiement sélectionnable (Espèces, Chèques)
6. Finalisation vente → enregistrement BDD + impression ticket

## Story 5.4: Fermeture Caisse & Contrôles
As a cashier,  
I want to close my register session with cash reconciliation,  
so that daily cash management is properly controlled and audited.

**Acceptance Criteria:**
1. Interface fermeture avec calcul solde théorique automatique
2. Saisie décompte physique avec détail billets/pièces
3. Calcul et affichage écart théorique/réel avec alertes si >seuil
4. Commentaire obligatoire si écart détecté
5. Génération ticket fermeture avec récapitulatif journée
6. Préparation fond de caisse jour suivant (suggestion automatique)

---
