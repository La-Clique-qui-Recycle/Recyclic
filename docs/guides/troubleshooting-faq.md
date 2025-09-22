# Troubleshooting et FAQ - Recyclic

## Introduction

Ce document compile les problèmes les plus courants rencontrés avec le système Recyclic et leurs solutions. Il est organisé par composant pour faciliter la recherche.

## Bot Telegram

### Problèmes de Connexion

**Q : Le bot ne répond pas à mes commandes**
- ✅ Vérifiez que vous avez démarré la conversation avec le bot
- ✅ Assurez-vous d'utiliser la commande exacte `/depot` (sensible à la casse)
- ✅ Vérifiez votre connexion internet
- 🔧 **Solution avancée** : Redémarrez l'application Telegram et réessayez

**Q : "Bot non trouvé" lors de la recherche**
- ✅ Vérifiez le nom exact : `@RecyclicBot`
- ✅ Assurez-vous que le bot est publié et accessible
- 📞 Contactez l'administrateur si le problème persiste

### Problèmes d'Enregistrement Vocal

**Q : Le bot ne reconnaît pas mes messages vocaux**
- 🎤 Vérifiez que votre microphone est activé dans Telegram
- 📱 Approchez-vous du micro et parlez clairement
- 🔇 Vérifiez que le mode silencieux n'est pas activé
- **Test** : Envoyez un message vocal à un autre contact pour vérifier

**Q : "Aucun message vocal détecté"**
- ⏱️ Assurez-vous d'avoir appuyé suffisamment longtemps sur le micro
- 🎵 Vérifiez que le fichier audio n'est pas corrompu
- 🔄 Réessayez avec un nouvel enregistrement

### Problèmes de Classification

**Q : La classification automatique ne fonctionne pas**
- 🤖 Décrivez l'objet de manière plus détaillée
- 📝 Mentionnez la marque et le modèle si possible
- 🔄 Réessayez avec une description différente
- 📞 Si le problème persiste, contactez l'administrateur pour classification manuelle

**Q : L'IA propose une catégorie incorrecte**
- ✏️ Utilisez le bouton "Corriger" pour ajuster
- 📝 Fournissez plus de détails sur l'objet
- 🎯 Soyez précis dans votre description (marque, modèle, usage)

### Erreurs Courantes

**Q : "Commande non reconnue"**
- 📝 Vérifiez l'orthographe : `/depot`, `/mesdepots`, `/stats`, `/help`
- 🔤 Les commandes sont sensibles à la casse
- 🔄 Essayez de retaper la commande

**Q : "Erreur de serveur"**
- 🌐 Vérifiez votre connexion internet
- ⏳ Attendez quelques minutes et réessayez
- 📞 Contactez l'administrateur si le problème persiste

## Interface de Caisse (PWA)

### Problèmes de Connexion

**Q : Impossible d'accéder à l'interface de caisse**
- 🌐 Vérifiez l'URL : `https://caisse.recyclic.org`
- 🔐 Vérifiez vos identifiants de connexion
- 📱 Essayez avec un autre navigateur
- 🔄 Videz le cache de votre navigateur

**Q : L'interface se charge lentement**
- 🖥️ Fermez les autres onglets/applications
- 🔄 Actualisez la page (Ctrl+F5)
- 📱 Utilisez un appareil plus récent si possible

### Problèmes de Saisie

**Q : Les prix ne se mettent pas à jour**
- ⌨️ Vérifiez que vous êtes dans le bon mode (Prix/Quantité/Catégorie)
- 🔢 Saisissez des valeurs numériques uniquement
- 🔄 Changez d'onglet et revenez

**Q : L'article ne s'ajoute pas au ticket**
- ✅ Vérifiez que tous les champs obligatoires sont remplis
- 🔄 Cliquez sur "VALIDER VENTE" plutôt que Entrée
- 💾 Vérifiez que l'appareil n'est pas en mode hors-ligne

### Mode Hors-Ligne

**Q : L'interface indique "Hors ligne"**
- 🌐 Vérifiez la connexion WiFi/Ethernet
- 📶 Testez la connexion sur un autre site web
- 🔄 Les données sont stockées localement et se synchroniseront

**Q : Les ventes ne se synchronisent pas**
- ⏳ Attendez le retour de la connexion
- 🔄 Cliquez sur "Synchroniser" manuellement
- 📊 Vérifiez dans les paramètres de synchronisation

### Problèmes d'Impression

**Q : Le ticket ne s'imprime pas**
- 🖨️ Vérifiez que l'imprimante est allumée et connectée
- 📄 Vérifiez le niveau de papier et d'encre
- 🔧 Redémarrez l'imprimante
- 📱 Utilisez le mode sans impression si nécessaire

**Q : L'imprimante n'est pas détectée**
- 🔌 Vérifiez les branchements USB/Network
- ⚙️ Vérifiez la configuration dans les paramètres
- 🔄 Redémarrez l'appareil et l'imprimante

### Erreurs de Session

**Q : Impossible d'ouvrir une session**
- 💰 Vérifiez le montant du fond de caisse
- ⏰ Vérifiez les horaires d'ouverture
- 👤 Vérifiez vos permissions d'utilisateur

**Q : Écart de caisse détecté**
- 🔢 Recomptez manuellement le contenu de la caisse
- 📝 Notez les raisons possibles (remise oubliée, erreur de saisie)
- 📞 Contactez l'administrateur pour validation

## Tableau de Bord d'Administration

### Problèmes d'Accès

**Q : Accès refusé au tableau de bord**
- 🔐 Vérifiez vos identifiants et votre rôle
- 📞 Contactez un Super Admin pour vérifier vos permissions
- 🔄 Essayez de vous déconnecter et reconnecter

**Q : Fonctionnalités manquantes**
- 👤 Votre rôle limite certaines fonctionnalités
- 🔄 Actualisez la page pour charger toutes les options
- 📱 Vérifiez sur un autre navigateur

### Problèmes de Données

**Q : Les rapports ne se chargent pas**
- ⏳ Attendez quelques minutes pour la synchronisation
- 🔄 Actualisez la page (Ctrl+F5)
- 📊 Vérifiez que les données existent dans la période sélectionnée

**Q : Export CSV qui échoue**
- 💾 Vérifiez l'espace disponible sur votre appareil
- 🔢 Réduisez la période d'export
- 🔄 Essayez un format différent (PDF au lieu de CSV)

### Alertes et Notifications

**Q : Aucune alerte reçue**
- 📧 Vérifiez vos paramètres de notification
- 📱 Vérifiez que les seuils sont configurés
- 🔄 Testez avec un seuil très bas pour vérifier le système

**Q : Trop d'alertes**
- ⚙️ Ajustez les seuils dans la configuration
- 🚫 Désactivez temporairement les notifications non critiques
- 📞 Contactez l'administrateur pour optimisation

## Problèmes Techniques Généraux

### Connexion et Réseau

**Q : Connexion instable**
- 🌐 Testez votre connexion sur un autre site
- 🔄 Redémarrez votre routeur/modern
- 📱 Essayez avec une connexion différente (4G/5G)

**Q : Firewall bloque l'accès**
- 🛡️ Ajoutez les URLs Recyclic à la liste des sites autorisés
- 🔧 Configurez votre proxy si nécessaire
- 📞 Contactez votre service informatique

### Performance

**Q : Application lente**
- 🖥️ Fermez les autres applications
- 🔄 Redémarrez votre appareil
- 💾 Libérez de l'espace de stockage
- 📱 Utilisez un appareil plus récent

**Q : Mémoire insuffisante**
- 🔄 Fermez les onglets inutiles
- 🗑️ Videz le cache de votre navigateur
- 💾 Redémarrez l'appareil

### Compatibilité

**Q : Interface ne s'affiche pas correctement**
- 🔄 Mettez à jour votre navigateur
- 📱 Testez sur un autre appareil
- 🖥️ Vérifiez la résolution d'écran (minimum 1024x768)

**Q : Problèmes d'affichage mobile**
- 🔄 Activez le mode desktop dans votre navigateur
- 📱 Utilisez l'application mobile dédiée si disponible
- 🖥️ Utilisez un appareil avec un écran plus grand

## Maintenance et Prévention

### Sauvegarde des Données

**Q : Comment sauvegarder mes données ?**
- 💾 Les données sont automatiquement sauvegardées
- 📞 En cas de problème, contactez l'administrateur
- 🔄 Ne tentez pas de sauvegarde manuelle

### Prévention des Problèmes

**Bonnes pratiques quotidiennes :**
- 🔄 Redémarrez votre appareil en début de journée
- 💾 Vérifiez les niveaux (papier, encre, batterie)
- 🌐 Testez la connexion internet
- 📱 Fermez les applications inutiles

### Quand Contacter le Support

**Contactez immédiatement si :**
- 🚨 Perte de données importantes
- 💰 Écart de caisse important non expliqué
- 🔐 Problème de sécurité ou d'accès non autorisé
- 🛠️ Dysfonctionnement empêchant le travail

**Informations à fournir :**
- 📝 Description précise du problème
- ⏰ Moment où le problème est survenu
- 🔢 Numéros d'erreur affichés
- 📱 Appareil et navigateur utilisés

## Ressources Supplémentaires

### Documentation Complète
- 📚 [Guide Bot Telegram](./bot-telegram-guide.md)
- 📋 [Manuel Interface Caisse](./interface-caisse-manual.md)
- 👥 [Guide Admin Dashboard](./admin-dashboard-guide.md)

### Formation
- 🎥 Vidéos de formation disponibles sur demande
- 👥 Sessions de formation en groupe organisées régulièrement
- 📞 Support téléphonique 24/7 pour les urgences

### Mises à Jour
- 🔄 Les guides sont mis à jour régulièrement
- 📧 Notifications automatiques des nouvelles versions
- 📰 Consultez les notes de version pour les nouveautés

---

**Version :** 1.0 - Janvier 2025
**Support :** support@recyclic.org

*Ce document est mis à jour régulièrement avec les nouveaux problèmes rencontrés. Dernière modification : Janvier 2025*
