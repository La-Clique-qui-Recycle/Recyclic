# Guide de Déploiement VPS - Recyclic

**Version:** 1.0  
**Date:** 2025-01-27  
**Auteur:** Équipe de Développement Recyclic

---

## 📋 Table des Matières

1. [Pré-requis](#pré-requis)
2. [Installation](#installation)
3. [Déploiement Alternatif : Utilisation de Traefik](#déploiement-alternatif--utilisation-de-traefik)
4. [Lancement](#lancement)
5. [Post-Installation - Étape 1 : Création du Super-Administrateur](#post-installation---étape-1--création-du-super-administrateur)
6. [Post-Installation - Étape 2 : Import des Données Initiales](#post-installation---étape-2--import-des-données-initiales)
7. [Phase de Test](#phase-de-test)
8. [Post-Installation - Étape 3 : Purge des Données de Test](#post-installation---étape-3--purge-des-données-de-test)
9. [Go-Live](#go-live)
10. [Dépannage](#dépannage)

---

## Pré-requis

### Logiciels Requis sur le Serveur

Avant de commencer, assurez-vous que votre serveur VPS dispose des logiciels suivants :

#### 1. Docker et Docker Compose
```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification de l'installation
docker --version
docker-compose --version
```

#### 2. Git
```bash
# Installation de Git
sudo apt update
sudo apt install git -y

# Vérification
git --version
```

#### 3. Outils Système
```bash
# Installation des outils nécessaires
sudo apt install curl wget unzip -y
```

### Spécifications Recommandées

- **RAM** : Minimum 4GB (8GB recommandé)
- **CPU** : 2 cœurs minimum
- **Stockage** : 20GB minimum (50GB recommandé)
- **OS** : Ubuntu 20.04+ ou Debian 10+

---

## Installation

### 1. Cloner le Projet

```bash
# Se placer dans le répertoire souhaité
cd /opt

# Cloner le projet Recyclic
sudo git clone https://github.com/votre-org/recyclic.git
sudo chown -R $USER:$USER /opt/recyclic
cd /opt/recyclic
```

### 2. Configuration des Variables d'Environnement

#### Créer le fichier `.env` de production
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier avec vos valeurs de production
nano .env
```

#### Variables Obligatoires à Configurer

```bash
# Base de données
POSTGRES_PASSWORD=votre_mot_de_passe_postgres_securise

# Sécurité
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire

# Telegram Bot
TELEGRAM_BOT_TOKEN=votre_token_bot_telegram
ADMIN_TELEGRAM_IDS=123456789,987654321

# URLs de production
FRONTEND_URL=https://votre-domaine.com
TELEGRAM_BOT_URL=https://votre-domaine.com/bot

# Configuration email (Brevo)
BREVO_API_KEY=votre_cle_api_brevo
BREVO_WEBHOOK_SECRET=votre_secret_webhook_brevo
EMAIL_FROM_NAME=Recyclic
EMAIL_FROM_ADDRESS=noreply@votre-domaine.com

# Rapports de caisse
CASH_SESSION_REPORT_RECIPIENT=admin@votre-domaine.com

# Environnement
ENVIRONMENT=production
```

#### Variables Optionnelles

```bash
# kDrive Sync (si utilisé)
KDRIVE_WEBDAV_URL=https://votre-kdrive.com/remote.php/webdav
KDRIVE_WEBDAV_USERNAME=votre_username
KDRIVE_WEBDAV_PASSWORD=votre_password
KDRIVE_SYNC_ENABLED=true

# Boutons inline Telegram (nécessite HTTPS)
ENABLE_INLINE_BUTTONS=true
```

### 3. Configuration du Reverse Proxy (Nginx)

#### Installation de Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### Configuration Nginx
```bash
# Créer la configuration pour Recyclic
sudo nano /etc/nginx/sites-available/recyclic
```

Contenu du fichier de configuration :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    # Configuration SSL (à adapter selon votre certificat)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend React
    location / {
        proxy_pass http://localhost:4444;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Bot Telegram Webhook
    location /bot/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Activer la configuration
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/recyclic /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## Déploiement Alternatif : Utilisation de Traefik

**⚙️ Cette section concerne uniquement les serveurs VPS utilisant déjà Traefik comme reverse proxy.**

Si votre infrastructure utilise déjà Traefik pour gérer d'autres services, vous pouvez utiliser le fichier `docker-compose.vps.yml` à la place de la configuration Nginx décrite ci-dessus.

### Quand utiliser cette méthode ?

✅ **Utilisez Traefik (`docker-compose.vps.yml`)** si :
- Votre serveur utilise déjà Traefik comme reverse proxy
- Vous gérez plusieurs applications sur le même serveur avec Traefik
- Vous préférez une gestion centralisée des certificats SSL avec Traefik

❌ **Utilisez Nginx (configuration standard)** si :
- Vous déployez Recyclic sur un serveur dédié
- Vous n'utilisez pas encore de reverse proxy
- Vous préférez une solution simple et autonome

### Configuration avec Traefik

#### 1. Prérequis Traefik

Assurez-vous que Traefik est déjà installé et configuré sur votre serveur avec :
- Un réseau Docker nommé `proxy`
- Des entrypoints `web` (80) et `websecure` (443)
- La gestion automatique des certificats SSL (Let's Encrypt)

#### 2. Créer le Réseau Proxy

```bash
# Créer le réseau proxy si nécessaire
docker network create proxy || true
```

#### 3. Modifier le fichier docker-compose.vps.yml

Éditez le fichier `docker-compose.vps.yml` et remplacez `recyclic.ton-domaine.tld` par votre domaine réel :

```bash
nano docker-compose.vps.yml
```

Exemple de modification :
```yaml
# Avant
- "traefik.http.routers.recyclic-api.rule=Host(`recyclic.ton-domaine.tld`) && PathPrefix(`/api`)"

# Après
- "traefik.http.routers.recyclic-api.rule=Host(`recyclic.votre-domaine.com`) && PathPrefix(`/api`)"
```

#### 4. Démarrer les Services avec Traefik

```bash
# Se placer dans le répertoire du projet
cd /opt/recyclic

# Démarrer avec les deux fichiers de configuration
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build

# Vérifier le statut des services
docker compose ps
```

#### 5. Vérification

```bash
# Vérifier que Traefik détecte les services
docker logs traefik 2>&1 | grep recyclic

# Tester l'accès via Traefik
curl https://recyclic.votre-domaine.com/api/v1/health/
curl https://recyclic.votre-domaine.com/
```

### Différences avec la Configuration Standard

| Aspect | Configuration Standard (Nginx) | Configuration Traefik |
|--------|-------------------------------|----------------------|
| **Fichier Docker Compose** | `docker-compose.yml` uniquement | `docker-compose.yml` + `docker-compose.vps.yml` |
| **Reverse Proxy** | Nginx installé séparément | Traefik existant sur le serveur |
| **Certificats SSL** | Gérés manuellement dans Nginx | Gérés automatiquement par Traefik |
| **Réseau** | `recyclic-network` uniquement | `recyclic-network` + `proxy` |
| **Configuration** | Fichier Nginx séparé | Labels Docker dans `docker-compose.vps.yml` |

### Commandes Spécifiques Traefik

```bash
# Démarrer les services
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build

# Arrêter les services
docker compose -f docker-compose.yml -f docker-compose.vps.yml down

# Voir les logs
docker compose -f docker-compose.yml -f docker-compose.vps.yml logs -f

# Redémarrer un service
docker compose -f docker-compose.yml -f docker-compose.vps.yml restart api
```

### Points d'Attention

⚠️ **Important** :
- Ne démarrez **PAS** de service Nginx séparé si vous utilisez Traefik
- Assurez-vous que le réseau `proxy` existe avant de démarrer les services
- Vérifiez que votre configuration Traefik autorise bien les domaines utilisés
- Les ports 80 et 443 doivent être gérés par Traefik, pas par les services Recyclic

---

## Lancement

### 1. Démarrer les Services

```bash
# Se placer dans le répertoire du projet
cd /opt/recyclic

# Construire et démarrer tous les services
docker-compose up -d --build

# Vérifier le statut des services
docker-compose ps
```

### 2. Vérification du Démarrage

```bash
# Vérifier les logs des services
docker-compose logs -f

# Vérifier la santé des services
curl http://localhost:8000/api/v1/health/
curl http://localhost:4444/
```

### 3. Attendre la Stabilisation

Les services peuvent prendre quelques minutes à démarrer complètement. Vérifiez que tous les services sont "healthy" :

```bash
# Statut détaillé
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

---

## Post-Installation - Étape 1 : Création du Super-Administrateur

### 1. Exécuter les Migrations

```bash
# Appliquer les migrations de base de données
docker-compose run --rm api-migrations alembic upgrade head
```

### 2. Créer le Premier Super-Administrateur

```bash
# Créer le compte super-admin
docker-compose exec api sh /app/create_admin.sh admin_username mot_de_passe_securise
```

**Exemple :**
```bash
docker-compose exec api sh /app/create_admin.sh admin recyclic2024!
```

### 3. Vérification de la Création

```bash
# Vérifier que l'utilisateur a été créé
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT username, role FROM users WHERE role = 'super-admin';"
```

---

## Post-Installation - Étape 2 : Import des Données Initiales

### 1. Vérification des Catégories Initiales

Les catégories et sous-catégories sont automatiquement créées lors des migrations grâce au script de seed. Vérifiez leur présence :

```bash
# Vérifier les catégories créées
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"
```

### 2. Import de Données Supplémentaires (Optionnel)

Si vous avez des données CSV à importer :

#### Via l'Interface Web
1. Connectez-vous à l'interface d'administration : `https://votre-domaine.com`
2. Naviguez vers la section "Catégories"
3. Utilisez le bouton "Importer des Catégories" pour les données CSV

#### Via l'API (pour les développeurs)
```bash
# Télécharger le modèle CSV
curl -X GET "https://votre-domaine.com/api/v1/categories/import/template" \
  -H "Authorization: Bearer votre_token_admin"

# Analyser un fichier CSV
curl -X POST "https://votre-domaine.com/api/v1/categories/import/analyze" \
  -H "Authorization: Bearer votre_token_admin" \
  -F "file=@categories.csv"

# Exécuter l'import
curl -X POST "https://votre-domaine.com/api/v1/categories/import/execute" \
  -H "Authorization: Bearer votre_token_admin" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "votre_session_id"}'
```

---

## Phase de Test

### 1. Tests de Connectivité

```bash
# Test de l'API
curl https://votre-domaine.com/api/v1/health/

# Test du frontend
curl https://votre-domaine.com/

# Test du bot (si configuré en webhook)
curl -X POST https://votre-domaine.com/bot/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### 2. Tests Fonctionnels

#### Test de l'Interface d'Administration
1. Accédez à `https://votre-domaine.com`
2. Connectez-vous avec le compte super-admin créé
3. Vérifiez l'accès aux sections :
   - Gestion des utilisateurs
   - Gestion des catégories
   - Rapports et exports

#### Test du Bot Telegram
1. Ajoutez le bot à un groupe de test
2. Envoyez la commande `/start`
3. Testez l'enregistrement d'un dépôt avec `/depot`

#### Test de l'Interface de Caisse
1. Créez un utilisateur bénévole via l'interface admin
2. Connectez-vous avec ce compte
3. Testez l'ouverture d'une session de caisse
4. Testez l'enregistrement de ventes

### 3. Tests de Performance

```bash
# Vérifier l'utilisation des ressources
docker stats

# Vérifier les logs d'erreur
docker-compose logs --tail=100 api
docker-compose logs --tail=100 frontend
```

---

## Post-Installation - Étape 3 : Purge des Données de Test

⚠️ **ATTENTION : Cette étape supprime définitivement toutes les données de transaction !**

### 1. Sauvegarde Préventive

```bash
# Créer une sauvegarde complète de la base de données
docker-compose exec postgres pg_dump -U recyclic -d recyclic -Fc -f /tmp/recyclic_backup_$(date +%Y%m%d_%H%M%S).dump

# Copier la sauvegarde sur l'hôte
docker cp $(docker-compose ps -q postgres):/tmp/recyclic_backup_*.dump ./backups/
```

### 2. Exécution du Script de Reset

Le projet inclut un script sécurisé pour purger les données de test : `scripts/reset-production-data.py`

#### Exécution du Script

```bash
# Copier le script dans le conteneur API
docker cp scripts/reset-production-data.py $(docker-compose ps -q api):/app/reset-production-data.py

# Exécuter le script de purge des données de test
docker-compose exec api python /app/reset-production-data.py
```

#### Fonctionnalités du Script

Le script `reset-production-data.py` offre les fonctionnalités suivantes :

- **🔒 Sécurité renforcée** : Double confirmation obligatoire
- **📊 Affichage détaillé** : Montre l'état avant/après la purge
- **🎯 Ciblage précis** : Supprime uniquement les données de transaction
- **🛡️ Protection des données** : Préserve les utilisateurs, catégories, sites
- **📝 Logging complet** : Enregistre toutes les opérations dans `logs/reset-production-data.log`

#### Données Supprimées

Le script supprime **uniquement** les données de transaction :
- `sale_items` - Lignes de vente
- `sales` - Ventes
- `ligne_depot` - Lignes de dépôt
- `ticket_depot` - Tickets de dépôt
- `deposits` - Dépôts d'objets
- `poste_reception` - Postes de réception
- `cash_sessions` - Sessions de caisse

#### Données Préservées

Le script **préserve** toutes les données de configuration :
- `users` - Utilisateurs et comptes
- `categories` - Catégories et prix
- `sites` - Sites de la ressourcerie
- `cash_registers` - Caisses enregistreuses
- `settings` - Paramètres système
- `admin_settings` - Paramètres d'administration
- `user_status_history` - Historique des utilisateurs
- `login_history` - Historique de connexion
- `sync_logs` - Logs de synchronisation

#### Processus de Confirmation

Le script demande **deux confirmations** explicites :

1. **Première confirmation** : Tapez `OUI` (en majuscules)
2. **Deuxième confirmation** : Tapez `CONFIRMER` (en majuscules)

```
⚠️  ATTENTION : Cette opération va supprimer TOUTES les données de transaction !
   - Toutes les ventes et leurs lignes
   - Toutes les sessions de caisse
   - Tous les dépôts d'objets
   - Tous les tickets et postes de réception
   
   Les données suivantes seront PRÉSERVÉES :
   - Utilisateurs et leurs comptes
   - Catégories et prix
   - Sites et caisses
   - Paramètres système
   
   Cette opération est IRRÉVERSIBLE !
   
   Tapez 'OUI' (en majuscules) pour confirmer la suppression : 
```

### 3. Vérification Post-Reset

```bash
# Vérifier que les données de transaction ont été supprimées
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM sales;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM sale_items;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM cash_sessions;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM deposits;"

# Vérifier que les données de configuration sont préservées
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM users;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM sites;"
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM cash_registers;"
```

### 4. Logs et Traçabilité

Le script génère des logs détaillés dans `logs/reset-production-data.log` :

```bash
# Consulter les logs de la purge
docker-compose exec api cat /app/logs/reset-production-data.log

# Vérifier les logs récents
docker-compose exec api tail -f /app/logs/reset-production-data.log
```

### 5. En Cas de Problème

Si vous devez restaurer les données après la purge :

```bash
# Restaurer depuis la sauvegarde
docker-compose exec postgres pg_restore -U recyclic -d recyclic --clean --if-exists /tmp/recyclic_backup_YYYYMMDD_HHMMSS.dump
```

---

## Go-Live

### 1. Vérifications Finales

#### Vérification de la Sécurité
```bash
# Vérifier que les variables sensibles sont configurées
docker-compose exec api env | grep -E "(SECRET_KEY|TELEGRAM_BOT_TOKEN)"

# Vérifier que HTTPS est actif
curl -I https://votre-domaine.com
```

#### Vérification des Services
```bash
# Vérifier que tous les services sont opérationnels
docker-compose ps

# Vérifier les logs d'erreur récents
docker-compose logs --tail=50 --since=1h
```

#### Vérification des Sauvegardes
```bash
# Vérifier que les sauvegardes automatiques sont configurées
ls -la /opt/recyclic/backups/

# Tester une sauvegarde manuelle
docker-compose exec postgres pg_dump -U recyclic -d recyclic > /opt/recyclic/backups/test_backup.sql
```

### 2. Configuration de la Surveillance

#### Monitoring des Services
```bash
# Créer un script de monitoring
sudo nano /opt/recyclic/monitor.sh
```

Contenu du script :
```bash
#!/bin/bash
# Script de monitoring pour Recyclic

echo "=== Recyclic Health Check ==="
echo "Date: $(date)"
echo ""

# Vérifier les services Docker
echo "Services Docker:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""

# Vérifier l'API
echo "API Health:"
curl -s https://votre-domaine.com/api/v1/health/ | jq . || echo "API non accessible"
echo ""

# Vérifier l'espace disque
echo "Espace disque:"
df -h /opt/recyclic
echo ""

# Vérifier la mémoire
echo "Mémoire:"
free -h
echo ""
```

```bash
# Rendre le script exécutable
chmod +x /opt/recyclic/monitor.sh

# Tester le script
./monitor.sh
```

#### Configuration de Cron pour les Sauvegardes
```bash
# Éditer le crontab
crontab -e

# Ajouter une sauvegarde quotidienne à 2h du matin
0 2 * * * cd /opt/recyclic && docker-compose exec -T postgres pg_dump -U recyclic -d recyclic > /opt/recyclic/backups/daily_$(date +\%Y\%m\%d).sql
```

### 3. Communication aux Utilisateurs

#### Informations à Communiquer
- **URL de l'application** : `https://votre-domaine.com`
- **Instructions de connexion** pour les bénévoles
- **Support technique** : contact et procédures
- **Formation** : sessions de formation si nécessaire

#### Documentation Utilisateur
- Guide d'utilisation pour les bénévoles
- Guide d'administration pour les gestionnaires
- Procédures de dépannage courantes

---

## Dépannage

### Problèmes Courants

#### 1. Services qui ne démarrent pas
```bash
# Vérifier les logs détaillés
docker-compose logs api
docker-compose logs frontend
docker-compose logs postgres

# Redémarrer un service spécifique
docker-compose restart api
```

#### 2. Problèmes de Base de Données
```bash
# Vérifier la connexion à la base
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT version();"

# Vérifier l'état des migrations
docker-compose exec api alembic current
docker-compose exec api alembic history
```

#### 3. Problèmes de Certificat SSL
```bash
# Vérifier la configuration SSL
sudo nginx -t

# Vérifier les certificats
sudo openssl x509 -in /path/to/certificate.crt -text -noout
```

#### 4. Problèmes de Performance
```bash
# Vérifier l'utilisation des ressources
docker stats

# Vérifier les logs d'erreur
docker-compose logs --tail=100 | grep -i error
```

### Commandes de Diagnostic

```bash
# Vérification complète du système
./monitor.sh

# Vérification de la connectivité réseau
curl -I https://votre-domaine.com
curl -I https://votre-domaine.com/api/v1/health/

# Vérification des volumes Docker
docker volume ls
docker volume inspect recyclic_postgres_data
```

### Contacts de Support

- **Documentation technique** : `/opt/recyclic/docs/`
- **Logs système** : `docker-compose logs`
- **Sauvegardes** : `/opt/recyclic/backups/`
- **Configuration** : `/opt/recyclic/.env`

---

## Maintenance

### Mises à Jour

```bash
# Sauvegarder avant mise à jour
./backup.sh

# Mettre à jour le code
git pull origin main

# Reconstruire et redémarrer
docker-compose down
docker-compose up -d --build

# Vérifier que tout fonctionne
./monitor.sh
```

### Sauvegardes Régulières

```bash
# Script de sauvegarde automatique
#!/bin/bash
BACKUP_DIR="/opt/recyclic/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Sauvegarde de la base de données
docker-compose exec -T postgres pg_dump -U recyclic -d recyclic -Fc > "$BACKUP_DIR/recyclic_$DATE.dump"

# Nettoyer les anciennes sauvegardes (garder 30 jours)
find $BACKUP_DIR -name "recyclic_*.dump" -mtime +30 -delete

echo "Sauvegarde terminée : recyclic_$DATE.dump"
```

---

**🎉 Félicitations ! Votre application Recyclic est maintenant déployée et prête à l'emploi !**

Pour toute question ou problème, consultez la documentation technique dans `/opt/recyclic/docs/` ou contactez l'équipe de développement.
