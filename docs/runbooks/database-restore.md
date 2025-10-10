# Procédure de Restauration de Base de Données

**Auteur:** James (Dev Agent)  
**Date:** 2025-01-27  
**Version:** 1.0  
**Objectif:** Guide complet pour restaurer la base de données Recyclic à partir d'une sauvegarde

---

## 🚨 Situations d'Urgence

Cette procédure doit être utilisée dans les cas suivants :
- Corruption de la base de données
- Perte de données accidentelle
- Panne de disque du serveur principal
- Migration vers un nouveau serveur
- Test de procédure de récupération

---

## 📋 Prérequis

### Matériel et Logiciels
- [ ] Serveur PostgreSQL 15+ opérationnel
- [ ] Accès root/administrateur au serveur
- [ ] Fichier de sauvegarde `.dump` disponible
- [ ] Espace disque suffisant (2x la taille de la base)
- [ ] Accès aux logs de l'application

### Informations Requises
- [ ] Chemin vers le fichier de sauvegarde
- [ ] Mot de passe PostgreSQL
- [ ] Nom de la base de données cible
- [ ] Utilisateur PostgreSQL

---

## 🔧 Procédure de Restauration

### Étape 1: Préparation de l'Environnement

```bash
# 1. Arrêter l'application Recyclic
docker-compose down

# 2. Vérifier l'espace disque disponible
df -h

# 3. Créer un répertoire de travail
mkdir -p /tmp/recyclic_restore
cd /tmp/recyclic_restore
```

### Étape 2: Récupération de la Sauvegarde

#### Option A: Sauvegarde Locale
```bash
# Si la sauvegarde est locale
BACKUP_FILE="/path/to/recyclic_backup_YYYYMMDD_HHMMSS.dump"
```

#### Option B: Récupération depuis Stockage Externe
```bash
# Configuration des variables
BACKUP_REMOTE_HOST="your-backup-server.com"
BACKUP_REMOTE_USER="backup_user"
BACKUP_REMOTE_PATH="/backups/recyclic"

# Récupérer la sauvegarde la plus récente
LATEST_BACKUP=$(ssh $BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST \
    "ls -t $BACKUP_REMOTE_PATH/recyclic_backup_*.dump | head -1")

# Télécharger la sauvegarde
scp $BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST:"$LATEST_BACKUP" ./
BACKUP_FILE="./$(basename "$LATEST_BACKUP")"
```

### Étape 3: Vérification de la Sauvegarde

```bash
# Vérifier que le fichier existe et n'est pas corrompu
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERREUR: Fichier de sauvegarde introuvable: $BACKUP_FILE"
    exit 1
fi

# Vérifier la taille du fichier
ls -lh "$BACKUP_FILE"

# Tester l'intégrité du dump (optionnel)
pg_restore --list "$BACKUP_FILE" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde valide"
else
    echo "❌ ERREUR: Fichier de sauvegarde corrompu"
    exit 1
fi
```

### Étape 4: Sauvegarde de Sécurité (Recommandé)

```bash
# Créer une sauvegarde de l'état actuel avant restauration
CURRENT_BACKUP="recyclic_current_before_restore_$(date +%Y%m%d_%H%M%S).dump"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --format=custom \
    --file="$CURRENT_BACKUP"

echo "✅ Sauvegarde de sécurité créée: $CURRENT_BACKUP"
```

### Étape 5: Restauration de la Base de Données

#### Option A: Restauration Complète (Recommandée)

```bash
# 1. Supprimer la base existante
PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --if-exists \
    recyclic

# 2. Créer une nouvelle base
PGPASSWORD="$POSTGRES_PASSWORD" createdb \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --owner=recyclic \
    recyclic

# 3. Restaurer les données
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$BACKUP_FILE"
```

#### Option B: Restauration Sélective (Avancée)

```bash
# Restaurer uniquement les données (sans le schéma)
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --data-only \
    --verbose \
    "$BACKUP_FILE"
```

### Étape 6: Vérification Post-Restauration

```bash
# 1. Vérifier la connexion
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --command="SELECT version();"

# 2. Vérifier les tables principales
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --command="
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
    FROM pg_stat_user_tables 
    ORDER BY schemaname, tablename;
    "

# 3. Vérifier les utilisateurs
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --command="SELECT id, username, role, status FROM users LIMIT 5;"
```

### Étape 7: Redémarrage de l'Application

```bash
# 1. Redémarrer les services Docker
cd /path/to/recyclic
docker-compose up -d

# 2. Vérifier le statut des services
docker-compose ps

# 3. Vérifier les logs
docker-compose logs api --tail=50
docker-compose logs postgres --tail=50
```

---

## 🧪 Tests de Validation

### Test 1: Connexion API
```bash
# Tester l'endpoint de santé
curl -f http://localhost:8000/health || echo "❌ API non accessible"
```

### Test 2: Authentification
```bash
# Tester la connexion avec un utilisateur existant
curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test@example.com","password":"testpassword"}'
```

### Test 3: Données Critiques
```sql
-- Vérifier les données critiques
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_deposits FROM deposits;
SELECT COUNT(*) as total_sales FROM sales;
```

---

## 🚨 Gestion des Erreurs

### Erreur: "Database does not exist"
```bash
# Solution: Créer la base de données
PGPASSWORD="$POSTGRES_PASSWORD" createdb \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --owner=recyclic \
    recyclic
```

### Erreur: "Permission denied"
```bash
# Solution: Vérifier les permissions
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --command="GRANT ALL PRIVILEGES ON DATABASE recyclic TO recyclic;"
```

### Erreur: "Connection refused"
```bash
# Solution: Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql
sudo systemctl start postgresql
```

---

## 📊 Monitoring Post-Restauration

### Vérifications Immédiates (0-1h)
- [ ] Services Docker opérationnels
- [ ] API accessible sur le port 8000
- [ ] Base de données répond aux requêtes
- [ ] Logs sans erreurs critiques

### Vérifications Court Terme (1-24h)
- [ ] Fonctionnalités utilisateur testées
- [ ] Performance normale
- [ ] Pas d'erreurs dans les logs
- [ ] Sauvegarde automatique fonctionnelle

### Vérifications Long Terme (1-7 jours)
- [ ] Stabilité de l'application
- [ ] Intégrité des données
- [ ] Performance maintenue
- [ ] Monitoring opérationnel

---

## 📝 Documentation des Actions

### Log de Restauration
```bash
# Créer un log de la restauration
RESTORE_LOG="/var/log/recyclic_restore_$(date +%Y%m%d_%H%M%S).log"
echo "=== RESTAURATION RECYCLIC $(date) ===" > "$RESTORE_LOG"
echo "Sauvegarde source: $BACKUP_FILE" >> "$RESTORE_LOG"
echo "Base de données cible: recyclic" >> "$RESTORE_LOG"
echo "Utilisateur: recyclic" >> "$RESTORE_LOG"
```

### Notification d'Équipe
```bash
# Notifier l'équipe de la restauration
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d "chat_id=$ADMIN_CHAT_ID" \
    -d "text=🔄 RESTAURATION TERMINÉE - Base de données Recyclic restaurée depuis $BACKUP_FILE"
```

---

## 🔄 Procédure de Rollback

En cas de problème après restauration :

```bash
# 1. Arrêter l'application
docker-compose down

# 2. Restaurer la sauvegarde de sécurité
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
    --host=localhost \
    --port=5432 \
    --username=recyclic \
    --dbname=recyclic \
    --clean \
    --if-exists \
    "$CURRENT_BACKUP"

# 3. Redémarrer l'application
docker-compose up -d
```

---

## 📞 Contacts d'Urgence

- **DevOps Principal:** [Nom] - [Email] - [Téléphone]
- **DBA:** [Nom] - [Email] - [Téléphone]
- **Product Owner:** [Nom] - [Email] - [Téléphone]

---

## 📚 Références

- [Documentation PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Guide de sauvegarde Recyclic](../architecture/architecture.md#sauvegarde)
- [Procédure de déploiement](../guides/deploiement-vps.md)

