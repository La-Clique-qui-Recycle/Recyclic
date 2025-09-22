# Guide Utilisateur - Bot Telegram Recyclic

## Introduction

Ce guide explique comment utiliser le Bot Telegram de Recyclic pour enregistrer des dépôts d'objets de manière simple et efficace. Le bot utilise l'intelligence artificielle pour classifier automatiquement les objets à partir de votre description vocale.

## Prérequis

- ✅ Avoir un compte Telegram
- ✅ Être enregistré dans le système Recyclic
- ✅ Avoir accès à un microphone pour l'enregistrement vocal

## Démarrage Rapide

1. **Ouvrez Telegram** et recherchez le bot `@RecyclicBot`
2. **Tapez `/depot`** pour commencer l'enregistrement d'un dépôt
3. **Décrivez l'objet** en envoyant un message vocal
4. **Validez ou corrigez** la classification proposée

## Workflow Détaillé

### Étape 1 : Lancer l'Enregistrement

```
Vous: /depot
Bot: 📦 Prêt à enregistrer un dépôt !
      🎤 Décrivez l'objet en envoyant un message vocal
```

**Conseil :** Le bot enregistre automatiquement votre message comme un "draft" (brouillon) dès que vous tapez `/depot`. Vous pouvez reprendre plus tard si nécessaire.

### Étape 2 : Description Vocale

**Parlez clairement dans votre message vocal :**
- 📱 "Un téléphone portable Samsung Galaxy S21"
- 💻 "Un ordinateur portable HP de 15 pouces"
- 📺 "Un téléviseur écran plat 32 pouces"
- 🖨️ "Une imprimante laser couleur"

**Le bot répondra :**
```
Bot: 🔄 Analyse en cours...
      📦 **Objet identifié :** Téléphone portable
      📱 **Catégorie EEE :** EEE-3 (Équipements informatiques)
      ✅ **Confiance :** 92%

      📦 **Valider** ✏️ **Corriger**
```

### Étape 3 : Validation ou Correction

#### ✅ Validation (Tout est correct)
```
Vous: 📦 Valider
Bot: ✅ Dépôt enregistré avec succès !
      📋 ID dépôt : #12345
      📦 Catégorie : EEE-3 (Équipements informatiques)
      🎤 Description : "Téléphone portable Samsung Galaxy S21"

      Merci pour votre contribution à Recyclic ! 🌱
```

#### ✏️ Correction (Il y a une erreur)
```
Vous: ✏️ Corriger
Bot: 📝 Quel est le problème ?
      1️⃣ La description est incorrecte
      2️⃣ La catégorie EEE est fausse
      3️⃣ Autre chose

Vous: 2 (La catégorie est fausse)
Bot: 📝 Quelle est la bonne catégorie EEE ?
      1️⃣ EEE-1 (Gros électroménager)
      2️⃣ EEE-2 (Petit électroménager)
      3️⃣ EEE-3 (Équipements informatiques)
      4️⃣ EEE-4 (Écrans et moniteurs)
      5️⃣ EEE-5 (Lampes et sources lumineuses)
      6️⃣ EEE-6 (Outils électriques)

Vous: 3
Bot: ✅ Correction appliquée !
      📦 Dépôt mis à jour avec la catégorie EEE-3
```

## Messages d'Erreur Courants

### ❌ "Commande non reconnue"
```
Bot: ❓ Je n'ai pas compris votre commande.
     Utilisez /depot pour enregistrer un dépôt
     ou /help pour voir toutes les commandes disponibles.
```

**Solution :** Vérifiez l'orthographe de votre commande. Les commandes sont sensibles à la casse.

### ❌ "Aucun message vocal détecté"
```
Bot: 🎤 Je n'ai pas pu traiter votre message vocal.
     Assurez-vous que votre message contient bien un enregistrement audio.
```

**Solutions :**
- Vérifiez que votre micro est activé
- Parlez plus fort et plus clairement
- Réessayez l'enregistrement

### ❌ "Classification impossible"
```
Bot: 🤖 Impossible de classifier cet objet automatiquement.
     Veuillez contacter un administrateur pour une classification manuelle.
```

**Solution :** Décrivez l'objet de manière plus détaillée ou contactez l'équipe Recyclic.

## Conseils pour une Meilleure Reconnaissance

### 📝 Descriptions Efficaces
- **Soyez précis :** "Ordinateur portable Dell 14 pouces" plutôt que "un ordi"
- **Mentionnez la marque :** "Imprimante HP LaserJet" plutôt que "une imprimante"
- **Indiquez l'usage :** "Téléviseur 42 pouces" plutôt que "un écran"

### 🎤 Qualité Audio
- Trouvez un endroit calme
- Parlez à 20-30 cm du micro
- Évitez les bruits de fond
- Articulez clairement

### 🔄 Répétition
- Si la classification est incertaine (< 80% de confiance), réessayez avec une description différente
- Les descriptions plus longues donnent généralement de meilleurs résultats

## Gestion des Dépôts

### Consulter ses Dépôts
```
Vous: /mesdepots
Bot: 📋 Voici vos 5 derniers dépôts :
      1. #12345 - Téléphone portable (Validé)
      2. #12344 - Ordinateur portable (En attente)
      3. #12343 - Imprimante (Corrigé)
      ...
```

### Statistiques Personnelles
```
Vous: /stats
Bot: 📊 Vos statistiques :
      📦 Total dépôts : 23
      ✅ Validés : 20 (87%)
      ✏️ Corrigés : 3 (13%)
      🎤 Description moyenne : 12 mots
```

## Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `/depot` | Commencer l'enregistrement d'un dépôt |
| `/mesdepots` | Voir ses dépôts récents |
| `/stats` | Voir ses statistiques |
| `/help` | Afficher l'aide |
| `/annuler` | Annuler le dépôt en cours |

## Support et Aide

### Problèmes Techniques
- 📧 Contactez l'équipe Recyclic : support@recyclic.org
- 🔧 Décrivez précisément le problème rencontré
- 📱 Mentionnez votre ID Telegram pour un suivi rapide

### Formation
- 📚 Consultez les autres guides disponibles
- 🎥 Des vidéos de formation courtes sont disponibles
- 👥 Contactez votre administrateur local pour une formation pratique

---

**Version :** 1.0 - Janvier 2025
**Support :** support@recyclic.org

*Ce guide sera mis à jour régulièrement. Dernière modification : Janvier 2025*
