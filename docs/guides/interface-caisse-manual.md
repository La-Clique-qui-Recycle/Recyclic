# Manuel Utilisateur - Interface de Caisse Recyclic

## Introduction

Ce manuel détaille l'utilisation de l'interface de caisse PWA (Progressive Web App) de Recyclic. L'interface est conçue pour être simple, tactile et fonctionner même sans connexion internet.

## Prérequis Techniques

- ✅ Un appareil avec écran tactile (tablette ou smartphone recommandé)
- ✅ Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- ✅ Connexion internet (pour la synchronisation, fonctionne en mode dégradé)
- ✅ Compte caissier Recyclic actif

## Accès à l'Interface

### URL d'Accès
- **Production :** `https://caisse.recyclic.org`
- **Développement :** `http://localhost:4444`

### Connexion
1. Ouvrez l'URL dans votre navigateur
2. Saisissez vos identifiants Recyclic
3. Cliquez sur "Se connecter"

**Note :** L'interface fonctionne en mode dégradé sans connexion internet après la première visite.

## Interface Principale

L'interface est organisée en zones distinctes :

```
┌─────────────────────────────────────┐
│ RECYCLIC - Session #1234 - 25/01   │ ← En-tête avec infos session
├─────────────────────────────────────┤
│                                     │
│  [CATÉGORIE] [QUANTITÉ] [PRIX]      │ ← Onglets de saisie
│                                     │
│  📱 EEE-3 Informatique             │ ← Article en cours
│  Quantité: 1    Prix: 15.00€       │
│                                     │
│  [ANNULER]    [VALIDER VENTE]      │ ← Actions principales
│                                     │
└─────────────────────────────────────┘
```

## Workflow de Vente Complet

### 1. Ouverture de Session de Caisse

**Avant de commencer :**
- Vérifiez que votre caisse est équipée du matériel nécessaire
- Assurez-vous d'avoir votre fond de caisse initial
- Préparez les sacs et emballages si nécessaire

**Procédure d'ouverture :**
1. Cliquez sur **"Ouvrir Session"**
2. Saisissez le **montant du fond de caisse** (pièces et billets)
3. Confirmez l'ouverture

```
Session ouverte avec succès !
📅 Date : 25/01/2025
💰 Fond de caisse : 150.00€
👤 Caissier : Marie Dubois
🔢 Session # : 1234
```

**Conseil :** Le numéro de session est important pour la réconciliation comptable.

### 2. Saisie d'un Article - Mode Catégorie

**Mode recommandé pour la rapidité**

1. Cliquez sur l'onglet **"CATÉGORIE"**
2. Sélectionnez la catégorie EEE appropriée :
   - 📱 **EEE-3** : Équipements informatiques
   - 📺 **EEE-4** : Écrans et moniteurs
   - 🖨️ **EEE-6** : Outils électriques
   - Etc.

3. L'IA suggère automatiquement le prix moyen pour cette catégorie
4. Ajustez si nécessaire avec les boutons +/- ou en saisissant directement

### 3. Saisie d'un Article - Mode Quantité

**Mode pour articles multiples identiques**

1. Cliquez sur l'onglet **"QUANTITÉ"**
2. Saisissez la quantité (1, 2, 3...)
3. Le prix total se met à jour automatiquement
4. Idéal pour : câbles, piles, cartouches...

### 4. Saisie d'un Article - Mode Prix

**Mode pour prix libre ou articles spéciaux**

1. Cliquez sur l'onglet **"PRIX"**
2. Saisissez directement le prix de vente
3. Utile pour : articles d'occasion de valeur, promotions...

### 5. Validation de la Vente

**Avant de valider :**
- ✅ Vérifiez que l'article affiché est correct
- ✅ Contrôlez le prix et la quantité
- ✅ Préparez la monnaie si paiement en espèces

**Procédure :**
1. Cliquez sur **"VALIDER VENTE"**
2. L'article s'ajoute au ticket
3. Le total se met à jour automatiquement

```
Vente ajoutée au ticket !
📦 Téléphone portable - 15.00€
💰 Total : 15.00€
```

### 6. Gestion du Ticket

**Actions disponibles :**
- **Continuer** : Ajouter d'autres articles
- **Modifier** : Corriger le dernier article
- **Annuler** : Supprimer le dernier article
- **Nouveau client** : Réinitialiser pour le prochain client

### 7. Finalisation et Paiement

**Pour un client :**
1. Présentez le total au client
2. Encaissez le paiement
3. Confirmez la transaction
4. Remettez le ticket de caisse

**Actions de fin de vente :**
- 🧾 **Imprimer ticket** (si imprimante connectée)
- 💰 **Encaisser** (ouvre la caisse si connectée)
- 🔄 **Continuer** (pour le prochain client)

### 8. Fermeture de Session

**Procédure obligatoire en fin de journée :**

1. Cliquez sur **"Fermer Session"**
2. Le système calcule automatiquement :
   - Total des ventes
   - Nombre d'articles vendus
   - Écart de caisse (théorique vs compté)

3. Saisissez le **montant compté** dans la caisse
4. Confirmez la fermeture

```
Fermeture de session
📅 Session #1234 - 25/01/2025
💰 Ventes : 1,250.00€
📦 Articles : 45
💵 Fond initial : 150.00€
🧮 Compté : 1,400.00€
✅ Écart : 0.00€ (Parfait !)
```

**Si écart détecté :**
- Le système demande une explication
- Notez la raison (erreur de saisie, remise oubliée, etc.)
- Un rapport est généré pour l'administrateur

## Mode Hors-Ligne (Offline)

L'interface continue de fonctionner même sans connexion internet :

### Fonctionnement Offline
- ✅ Saisie des articles
- ✅ Calcul des totaux
- ✅ Stockage local des ventes
- ✅ Impression des tickets (si imprimante locale)

### Synchronisation
- 🔄 Les données se synchronisent automatiquement dès le retour de la connexion
- 📊 Un indicateur montre le statut de synchronisation
- ⚠️ Les ventes critiques sont marquées comme prioritaires

### Gestion des Erreurs
Si la synchronisation échoue :
1. Vérifiez la connexion internet
2. Réessayez manuellement via le bouton "Synchroniser"
3. Contactez l'administrateur si le problème persiste

## Gestion des Erreurs Courantes

### Erreur de Connexion
```
❌ Impossible de synchroniser
🔄 Tentatives : 3/5
📊 Ventes en attente : 12
```

**Solutions :**
- Vérifiez la connexion WiFi/Ethernet
- Redémarrez l'appareil si nécessaire
- Les données sont stockées localement

### Erreur de Saisie
```
⚠️ Prix inhabituel détecté
💰 Prix saisi : 1,500.00€
📊 Prix moyen catégorie : 45.00€
```

**Action :**
- Vérifiez le prix avec le client
- Confirmez la saisie ou corrigez

### Problème d'Impression
```
❌ Imprimante non détectée
🖨️ Vérifiez la connexion USB/WiFi
```

**Solutions :**
- Vérifiez les branchements
- Redémarrez l'imprimante
- Utilisez le mode sans impression

## Raccourcis Clavier et Gestes

### Raccourcis Tactiles
- **Glissement gauche** : Annuler l'article en cours
- **Double-tap** : Confirmer et passer au suivant
- **Pincement** : Zoomer sur les prix

### Raccourcis Clavier (si clavier connecté)
- **Entrée** : Valider la vente
- **Échap** : Annuler l'article en cours
- **F1** : Ouvrir l'aide
- **F2** : Fermer la session

## Maintenance et Support

### Nettoyage Quotidien
- Nettoyez l'écran tactile avec un chiffon microfibre
- Vérifiez le niveau de papier dans l'imprimante
- Testez la connexion internet

### Sauvegarde des Données
- Les données sont automatiquement sauvegardées
- En cas de panne, contactez immédiatement l'administrateur
- Ne tentez pas de réparer vous-même l'appareil

### Support Technique
- **Urgence** : Appelez le numéro d'assistance Recyclic
- **Problème mineur** : Notez le problème et continuez à travailler
- **Formation** : Demandez une session de formation complémentaire

## Bonnes Pratiques

### Efficacité
- 🔄 Utilisez le mode catégorie pour aller plus vite
- 📱 Gardez l'appareil proche du client
- 🎯 Vérifiez toujours le prix avant de valider

### Précision
- 📝 Demandez confirmation pour les prix élevés
- 🔍 Vérifiez la catégorie EEE avant validation
- 💰 Comptez la monnaie avec le client

### Sécurité
- 🔐 Ne laissez pas l'appareil sans surveillance
- 📊 Fermez toujours votre session en fin de journée
- 🔒 Ne communiquez pas vos identifiants

---

**Version :** 1.0 - Janvier 2025
**Support :** support@recyclic.org

*Ce manuel sera mis à jour régulièrement. Dernière modification : Janvier 2025*
