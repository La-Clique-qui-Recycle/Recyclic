# Guide de Configuration du Compte Brevo

**Auteur:** Équipe Technique Recyclic
**Date:** 2025-01-27
**Version:** 1.0
**Objectif:** Guide complet pour configurer un compte Brevo et intégrer le service d'envoi d'emails dans Recyclic

---

## Vue d'ensemble

Brevo (anciennement Sendinblue) est le service d'envoi d'emails transactionnels utilisé par Recyclic pour :
- Les rapports de fermeture de caisse (envoi automatique par email)
- Les notifications de réinitialisation de mot de passe
- Les emails de test depuis l'interface d'administration

Ce guide vous accompagne dans la configuration complète de Brevo, de la création du compte à l'intégration dans Recyclic.

---

## Prérequis

- Un compte email valide (gmail, outlook, professionnel, etc.)
- Accès à l'interface d'administration de Recyclic en tant que Super-Administrateur
- Un nom de domaine (optionnel mais fortement recommandé pour la production)

---

## Étape 1 : Création du compte Brevo

### 1.1 Inscription

1. Rendez-vous sur [https://www.brevo.com](https://www.brevo.com)
2. Cliquez sur **"S'inscrire gratuitement"** ou **"Essai gratuit"**
3. Remplissez le formulaire d'inscription avec :
   - Votre adresse email professionnelle
   - Votre mot de passe (sécurisé, au moins 12 caractères)
   - Le nom de votre organisation (ex: "Ressourcerie La Clique Qui Recycle")
4. Validez votre email en cliquant sur le lien de confirmation reçu

### 1.2 Compléter le profil

1. Connectez-vous à votre compte Brevo
2. Complétez votre profil avec les informations de votre ressourcerie
3. Choisissez l'offre **"Gratuite"** pour commencer (300 emails/jour, suffisant pour débuter)

**💡 Note importante sur les offres :**
- **Gratuit** : 300 emails/jour, adapté pour les tests et petits volumes
- **Starter** (~9€/mois) : 20 000 emails/mois, pas de limite quotidienne, recommandé pour la production

---

## Étape 2 : Créer et récupérer une clé API v3

La clé API permet à Recyclic de communiquer avec Brevo pour envoyer des emails.

### 2.1 Accéder aux paramètres API

1. Connectez-vous à votre compte Brevo
2. Cliquez sur votre **nom de profil** en haut à droite
3. Sélectionnez **"Paramètres"** ou **"Settings"**
4. Dans le menu de gauche, cliquez sur **"SMTP & API"**
5. Cliquez sur l'onglet **"Clés API"** ou **"API Keys"**

### 2.2 Créer une nouvelle clé API

1. Cliquez sur **"Créer une nouvelle clé API"** ou **"Generate a new API key"**
2. Donnez un nom explicite à votre clé : `Recyclic Production` ou `Recyclic Staging`
3. **Important** : Sélectionnez les permissions suivantes (au minimum) :
   - ✅ **Emails transactionnels** (`transactional_emails`)
   - ✅ **Emails** (`emails`) - pour consultation
   - ❌ **Ne pas** donner accès aux contacts, SMS ou autres fonctionnalités non nécessaires

4. Cliquez sur **"Générer"** ou **"Generate"**

### 2.3 Sauvegarder la clé API

🔴 **ATTENTION CRITIQUE** : La clé API n'est affichée qu'**une seule fois** !

1. **Copiez immédiatement** la clé API affichée
2. Stockez-la dans un gestionnaire de mots de passe sécurisé (ex: Bitwarden, 1Password, KeePass)
3. Si vous perdez la clé, vous devrez en créer une nouvelle et mettre à jour la configuration de Recyclic

**Exemple de clé API :**
```
xkeysib-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6-AbCdEfGhIjKl
```

---

## Étape 3 : Vérifier une adresse email expéditrice

Pour que Brevo accepte d'envoyer des emails depuis votre adresse, vous devez la vérifier.

### 3.1 Accéder aux expéditeurs

1. Dans Brevo, allez dans **"Paramètres"** > **"Expéditeurs et IP"** ou **"Senders & IP"**
2. Cliquez sur l'onglet **"Expéditeurs"** ou **"Senders"**

### 3.2 Ajouter un expéditeur

1. Cliquez sur **"Ajouter un expéditeur"** ou **"Add a sender"**
2. Remplissez les informations :
   - **Nom de l'expéditeur** : `Recyclic` ou `Votre Ressourcerie`
   - **Email de l'expéditeur** : `noreply@votredomaine.fr`

   **💡 Recommandations pour l'adresse email :**
   - ✅ Utilisez un sous-domaine ou alias : `noreply@`, `notifications@`
   - ✅ Utilisez votre propre domaine si vous en avez un
   - ⚠️ Évitez les adresses gmail/outlook en production (mauvaise délivrabilité)

3. Cliquez sur **"Envoyer un email de confirmation"**

### 3.3 Valider l'adresse

1. Consultez la boîte de réception de l'adresse email que vous avez ajoutée
2. Ouvrez l'email de Brevo
3. Cliquez sur le lien de validation
4. L'adresse est maintenant **vérifiée** ✅ et peut être utilisée comme expéditeur

**Note :** Si vous n'avez pas de domaine personnalisé, vous pouvez utiliser temporairement l'adresse fournie par Brevo en mode gratuit.

---

## Étape 4 : (Optionnel) Vérifier votre domaine avec SPF/DKIM

⚠️ **Cette étape est optionnelle en développement mais FORTEMENT recommandée pour la production.**

La vérification du domaine améliore la délivrabilité de vos emails (moins de chances de finir en spam).

### 4.1 Pourquoi vérifier votre domaine ?

- ✅ Meilleure délivrabilité (taux d'ouverture plus élevé)
- ✅ Réduit les risques de spam
- ✅ Renforce la confiance des destinataires

### 4.2 Accéder aux paramètres de domaine

1. Dans Brevo, allez dans **"Paramètres"** > **"Expéditeurs et IP"**
2. Cliquez sur l'onglet **"Domaines"** ou **"Domains"**
3. Cliquez sur **"Ajouter un domaine"** ou **"Add a domain"**
4. Entrez votre nom de domaine (ex: `votreressourcerie.fr`)

### 4.3 Configurer les enregistrements DNS

Brevo vous fournira des enregistrements DNS à ajouter chez votre registrar (OVH, Gandi, Cloudflare, etc.).

**Exemple d'enregistrements à ajouter :**

| Type | Nom | Valeur |
|------|-----|--------|
| TXT (SPF) | @ | `v=spf1 include:spf.brevo.com ~all` |
| TXT (DKIM) | mail._domainkey | `k=rsa; p=MIGfMA0GCSqGSIb3DQEBA...` (fourni par Brevo) |

**📝 Instructions générales :**

1. Connectez-vous à votre hébergeur de nom de domaine (ex: OVH, Gandi)
2. Accédez à la **zone DNS** de votre domaine
3. Ajoutez les enregistrements TXT fournis par Brevo
4. **Attention** : La propagation DNS peut prendre jusqu'à 48h (souvent 1-2h en pratique)

### 4.4 Vérifier la configuration

1. Retournez dans Brevo > Domaines
2. Cliquez sur **"Vérifier"** à côté de votre domaine
3. Si tout est correct, le statut passe à **"Vérifié" ✅**

**💡 En cas de problème :**
- Vérifiez que vous n'avez pas de faute de frappe dans les enregistrements DNS
- Attendez quelques heures pour la propagation DNS
- Utilisez un outil comme [MXToolbox](https://mxtoolbox.com/) pour vérifier vos enregistrements SPF/DKIM

---

## Étape 5 : (Optionnel) Configurer les webhooks

Les webhooks permettent à Brevo d'envoyer des notifications à Recyclic sur l'état des emails (ouvert, cliqué, erreur, etc.).

### 5.1 Accéder aux webhooks

1. Dans Brevo, allez dans **"Paramètres"** > **"Webhooks"**
2. Cliquez sur **"Ajouter un webhook"** ou **"Add a webhook"**

### 5.2 Configurer le webhook

1. **URL du webhook** : `https://votredomaine.com/api/v1/webhooks/brevo`
   (Remplacez par votre URL de production Recyclic)

2. **Événements à surveiller** (cochez) :
   - ✅ `delivered` (email délivré)
   - ✅ `soft_bounce` (échec temporaire)
   - ✅ `hard_bounce` (échec permanent)
   - ✅ `spam` (marqué comme spam)
   - ✅ `invalid_email` (email invalide)
   - ⚠️ Ne cochez PAS `opened` ni `clicked` (génère trop de trafic pour des emails transactionnels)

3. **Secret du webhook** : Générez un secret aléatoire long (ex: 32 caractères)
   - Vous pouvez utiliser un générateur comme [https://randomkeygen.com/](https://randomkeygen.com/)
   - Exemple : `wh_secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

4. Cliquez sur **"Enregistrer"**

### 5.3 Configurer le secret dans Recyclic

Ajoutez le secret du webhook dans votre fichier `.env` de production :

```bash
BREVO_WEBHOOK_SECRET=wh_secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**💡 Note :** Le secret webhook est optionnel en développement mais **obligatoire en production** pour sécuriser les callbacks Brevo.

---

## Étape 6 : Intégrer Brevo dans Recyclic

Maintenant que votre compte Brevo est configuré, intégrons-le dans Recyclic.

### 6.1 Configuration via fichier .env (Recommandé pour l'infrastructure)

1. Connectez-vous à votre serveur (VPS ou local)
2. Ouvrez le fichier `.env` (ou `.env.production` pour la production)
3. Ajoutez les variables suivantes :

```bash
# Email Service (Brevo)
BREVO_API_KEY=xkeysib-VOTRE_CLE_API_ICI
BREVO_WEBHOOK_SECRET=wh_secret_VOTRE_SECRET_ICI
EMAIL_FROM_NAME=Recyclic
EMAIL_FROM_ADDRESS=noreply@votredomaine.fr
DEFAULT_EMAIL_RECIPIENT=admin@votredomaine.fr
```

4. **Redémarrez les services Docker** :

```bash
docker-compose down
docker-compose up -d
```

### 6.2 Configuration via l'interface Admin (Recommandé pour les paramètres d'envoi)

1. Connectez-vous à Recyclic en tant que **Super-Administrateur**
2. Accédez à **"Paramètres"** (⚙️) dans le menu admin
3. Descendez jusqu'à la section **"📧 Configuration Email (Brevo)"**
4. Vérifiez que le badge affiche **"✅ API configurée"**
   - Si vous voyez **"⚠️ API manquante"**, retournez à l'étape 6.1 pour configurer `BREVO_API_KEY`

5. Configurez les paramètres d'expédition :
   - **Nom de l'expéditeur** : `Recyclic` ou le nom de votre ressourcerie
   - **Adresse email de l'expéditeur** : `noreply@votredomaine.fr` (doit être vérifiée dans Brevo)
   - **Email de test par défaut** : Votre adresse email pour recevoir les tests

6. Cliquez sur **"💾 Enregistrer"**

### 6.3 Tester l'envoi d'email

1. Dans la section **"Test d'envoi d'email"**, saisissez votre adresse email
2. Cliquez sur **"📧 Envoyer un email de test"**
3. Vérifiez votre boîte de réception
4. Vous devriez recevoir un email avec le sujet **"🧪 Test Email - Service Recyclic"**

**✅ Si vous recevez l'email de test :** La configuration est réussie !
**❌ Si vous ne recevez rien :** Consultez la section Dépannage ci-dessous.

---

## Étape 7 : Vérifier les quotas et limites

### 7.1 Consultez votre tableau de bord Brevo

1. Connectez-vous à Brevo
2. Accédez au **Tableau de bord** ou **Dashboard**
3. Vérifiez vos limites :
   - **Offre gratuite** : 300 emails/jour
   - **Offre Starter** : 20 000 emails/mois (pas de limite quotidienne)

### 7.2 Surveillance des quotas

- Brevo vous envoie des alertes par email lorsque vous approchez de votre limite
- Vous pouvez consulter votre consommation en temps réel dans le tableau de bord
- En cas de dépassement, Brevo suspend l'envoi jusqu'au lendemain (gratuit) ou jusqu'à upgrade (payant)

**💡 Recommandations :**
- Pour une ressourcerie avec 10-20 sessions de caisse par jour : l'offre gratuite suffit largement
- Si vous dépassez régulièrement 300 emails/jour, passez à l'offre Starter

---

## Dépannage

### Problème : "La clé API Brevo n'est pas configurée"

**Solutions :**

1. Vérifiez que vous avez bien défini `BREVO_API_KEY` dans le fichier `.env`
2. Vérifiez qu'il n'y a pas d'espaces avant ou après la clé
3. Redémarrez les services Docker : `docker-compose down && docker-compose up -d`
4. Vérifiez les logs : `docker logs recyclic-api-1`

### Problème : "Échec de l'envoi de l'email de test"

**Solutions :**

1. **Vérifiez la clé API** :
   - Connectez-vous à Brevo
   - Allez dans Paramètres > SMTP & API > Clés API
   - Vérifiez que la clé n'est pas révoquée ou expirée
   - Si nécessaire, générez une nouvelle clé et mettez à jour `.env`

2. **Vérifiez l'adresse expéditrice** :
   - Allez dans Brevo > Paramètres > Expéditeurs
   - Vérifiez que l'adresse email est bien **vérifiée** ✅
   - Si non, renvoyez l'email de confirmation et validez-la

3. **Vérifiez les quotas** :
   - Tableau de bord Brevo > vérifiez que vous n'avez pas dépassé votre limite quotidienne
   - Si oui, attendez le lendemain ou passez à une offre supérieure

4. **Consultez les logs Brevo** :
   - Brevo > Journaux d'emails > Emails transactionnels
   - Recherchez des erreurs ou rejets récents

### Problème : Les emails arrivent en spam

**Solutions :**

1. **Vérifiez SPF/DKIM** :
   - Assurez-vous d'avoir configuré les enregistrements DNS (Étape 4)
   - Utilisez [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) pour vérifier votre configuration

2. **Améliorez le contenu de vos emails** :
   - Évitez les mots "spam" (gratuit, gagnant, urgent, cliquez ici)
   - Incluez toujours un lien de désinscription (Brevo l'ajoute automatiquement)
   - Utilisez un ratio texte/images équilibré

3. **Réchauffez votre domaine** :
   - Si vous venez de configurer Brevo, envoyez d'abord un petit volume d'emails
   - Augmentez progressivement (10/jour → 50/jour → 100/jour, etc.)

---

## Ressources supplémentaires

### Documentation officielle Brevo

- [Centre d'aide Brevo](https://help.brevo.com/hc/fr)
- [Documentation API v3](https://developers.brevo.com/docs)
- [Guide de délivrabilité](https://www.brevo.com/fr/blog/ameliorer-delivrabilite-emailing/)

### Outils utiles

- [MXToolbox](https://mxtoolbox.com/) - Vérification DNS, SPF, DKIM
- [Mail-Tester](https://www.mail-tester.com/) - Test de score de spam
- [RandomKeygen](https://randomkeygen.com/) - Générateur de secrets sécurisés

### Support

- **Support Brevo** : [support@brevo.com](mailto:support@brevo.com) (réponse sous 24-48h)
- **Documentation Recyclic** : Consultez les autres guides dans `docs/guides/`
- **Problèmes techniques** : Créez une issue sur le dépôt GitHub du projet

---

## Checklist de configuration complète

Utilisez cette checklist pour vous assurer que tout est correctement configuré :

- [ ] Compte Brevo créé et email validé
- [ ] Clé API v3 générée et stockée en sécurité
- [ ] Clé API configurée dans `.env` (`BREVO_API_KEY`)
- [ ] Adresse email expéditrice vérifiée dans Brevo
- [ ] (Production) Domaine vérifié avec SPF/DKIM
- [ ] (Production) Webhook configuré avec secret
- [ ] (Production) Secret webhook configuré dans `.env` (`BREVO_WEBHOOK_SECRET`)
- [ ] Paramètres d'envoi configurés dans l'interface Admin Recyclic
- [ ] Email de test envoyé et reçu avec succès
- [ ] Quotas Brevo vérifiés et adaptés au volume d'emails prévu

---

**✅ Félicitations !** Si vous avez coché tous les éléments de la checklist, votre configuration Brevo est complète et Recyclic peut maintenant envoyer des emails de manière fiable.

**🎯 Prochaine étape :** Consultez le guide de déploiement pour finaliser la mise en production de Recyclic.
