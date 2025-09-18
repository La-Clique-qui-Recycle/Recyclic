# Configuration des Notifications de Rollback

**Version :** 1.0  
**Date :** 2025-01-27  
**Objectif :** Guide de configuration des notifications automatiques pour la procédure de rollback

---

## 1. Variables d'Environnement Requises

### 1.1 Notifications Telegram (Recommandé)

```bash
# Token du bot Telegram (obligatoire)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# IDs des administrateurs (obligatoire)
# Format: ID1,ID2,ID3 (séparés par des virgules)
ADMIN_TELEGRAM_IDS=123456789,987654321
```

### 1.2 Notifications Email (Optionnel)

```bash
# Email de notification (optionnel)
NOTIFICATION_EMAIL=admin@recyclic.com
```

---

## 2. Configuration dans .env

Ajouter ces variables dans votre fichier `.env` :

```bash
# === NOTIFICATIONS ROLLBACK ===
# Telegram (recommandé)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_TELEGRAM_IDS=123456789,987654321

# Email (optionnel)
NOTIFICATION_EMAIL=admin@recyclic.com
```

---

## 3. Obtenir les IDs Telegram

### 3.1 Pour les Administrateurs

1. **Démarrer le bot** : Envoyer `/start` au bot Recyclic
2. **Obtenir l'ID** : Utiliser la commande `/id` ou consulter les logs du bot
3. **Ajouter l'ID** : Ajouter l'ID à la variable `ADMIN_TELEGRAM_IDS`

### 3.2 Vérification des IDs

```bash
# Tester les notifications
bash scripts/rollback.sh --test-notifications
```

---

## 4. Types de Notifications

### 4.1 Notifications de Succès ✅

**Déclenchement :** Rollback réussi  
**Contenu :**
- Version de destination
- Timestamp
- Hostname
- Utilisateur
- Métriques de performance

### 4.2 Notifications d'Échec ❌

**Déclenchement :** Rollback échoué  
**Contenu :**
- Version cible
- Message d'erreur
- Timestamp
- Actions requises

### 4.3 Notifications d'Annulation ⚠️

**Déclenchement :** Rollback annulé par l'utilisateur  
**Contenu :**
- Version cible
- Utilisateur qui a annulé
- Timestamp

### 4.4 Alertes d'Urgence 🚨

**Déclenchement :** Échec critique du rollback  
**Contenu :**
- Message d'urgence
- Erreur détaillée
- Actions immédiates requises
- Lien vers les logs

---

## 5. Métriques Collectées

### 5.1 Métriques Système

```json
{
  "system_metrics": {
    "cpu_usage_percent": "45.2",
    "memory_usage_percent": "67.8",
    "disk_usage_percent": "23.1",
    "docker_containers_running": "6",
    "docker_images_count": "12"
  }
}
```

### 5.2 Métriques de Performance

```json
{
  "performance": {
    "rollback_speed": "fast",
    "efficiency_score": "100"
  }
}
```

---

## 6. Exemple de Message Telegram

```
✅ ROLLBACK NOTIFICATION

Rollback réussi vers la version abc1234 sur production-server

📋 Détails:
• Version: abc1234
• Timestamp: 2025-01-27 15:30:00
• Hostname: production-server
• User: deploy-user

🔗 Logs: logs/rollback-metrics.json
```

---

## 7. Dépannage

### 7.1 Notifications Telegram ne fonctionnent pas

**Vérifications :**
1. Token bot valide : `curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"`
2. IDs administrateurs corrects
3. Bot autorisé à envoyer des messages aux admins

### 7.2 Notifications Email ne fonctionnent pas

**Vérifications :**
1. Serveur mail configuré (`mail` command disponible)
2. Variable `NOTIFICATION_EMAIL` définie
3. Permissions d'envoi d'email

### 7.3 Test des Notifications

```bash
# Test complet des notifications
bash scripts/rollback.sh --test-notifications

# Test spécifique Telegram
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$ADMIN_TELEGRAM_IDS" \
  -d "text=Test de notification rollback"
```

---

## 8. Sécurité

### 8.1 Protection des Tokens

- **Ne jamais** commiter les tokens dans le code
- Utiliser des variables d'environnement
- Restreindre l'accès au fichier `.env`

### 8.2 Validation des IDs

- Vérifier que les IDs Telegram sont valides
- Limiter les notifications aux administrateurs autorisés
- Loguer toutes les tentatives de notification

---

## 9. Monitoring et Maintenance

### 9.1 Surveillance des Notifications

- Vérifier régulièrement que les notifications arrivent
- Monitorer les échecs d'envoi dans les logs
- Tester les notifications après chaque déploiement

### 9.2 Maintenance

- Mettre à jour les IDs administrateurs si nécessaire
- Renouveler les tokens si expirés
- Nettoyer les anciens logs de métriques

---

**Dernière mise à jour :** 2025-01-27  
**Responsable :** Équipe DevOps Recyclic
