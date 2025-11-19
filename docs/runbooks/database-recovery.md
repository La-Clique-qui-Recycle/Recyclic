# Guide de Récupération Base de Données - Recyclic

## Vue d'ensemble

Ce guide détaille les procédures de récupération de la base de données PostgreSQL pour l'application Recyclic. Il couvre tous les scénarios de récupération, des tests simples aux situations de crise.

**Version:** 1.0
**Date:** 2025-01-27
**Auteur:** James (Dev Agent)

---

## 1. Métriques de Récupération (RTO/RPO)

### Objectifs Définis
- **RTO (Recovery Time Objective)**: < 4 heures pour restauration complète
- **RPO (Recovery Point Objective)**: < 1 heure de données critiques perdues

### Métriques Actuelles du Système
- Sauvegarde quotidienne automatique à 02h00
- Vérification d'intégrité toutes les 6 heures
- Alertes automatiques pour les échecs

---

## 2. Scénarios de Récupération

### 2.1. Récupération Simple (Test/ Développement)

**Contexte:** Récupération de test ou remise à zéro de l'environnement de développement.

**Prérequis:**
- Accès au conteneur PostgreSQL
- Fichier de sauvegarde valide
- Droits d'administration sur la base

**Procédure:**

```bash
# 1. Vérifier l'état actuel
docker-compose exec postgres pg_isready -U recyclic

# 2. Créer une sauvegarde de sécurité (optionnel)
docker-compose exec postgres pg_dump -U recyclic -d recyclic > pre_recovery_backup.sql

# 3. Arrêter les services dépendants
docker-compose stop api bot frontend

# 4. Supprimer la base existante
docker-compose exec postgres psql -U recyclic -c "DROP DATABASE IF EXISTS recyclic;"

# 5. Créer une nouvelle base
docker-compose exec postgres psql -U recyclic -c "CREATE DATABASE recyclic;"

# 6. Restaurer depuis la sauvegarde
docker-compose exec -T postgres psql -U recyclic -d recyclic < /path/to/backup.sql

# 7. Redémarrer les services
docker-compose start api bot frontend

# 8. Vérifier la restauration
docker-compose exec api python -c "from recyclic_api.database import get_db; db = next(get_db()); print('Connection successful')"
```

### 2.2. Récupération après Corruption Partielle

**Contexte:** Tables corrompues ou données incohérentes détectées.

**Symptômes:**
- Erreurs SQL spécifiques
- Incohérences dans les données
- Échecs des contraintes d'intégrité

**Procédure de Diagnostic:**

```bash
# 1. Vérifier la santé de la base
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT * FROM pg_stat_database WHERE datname = 'recyclic';"

# 2. Contrôler l'intégrité des tables principales
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC LIMIT 10;"

# 3. Vérifier les contraintes
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'deposits'::regclass;"
```

**Procédure de Récupération:**

```bash
# 1. Isoler la table corrompue (si possible)
docker-compose exec postgres psql -U recyclic -d recyclic -c "
CREATE TABLE deposits_backup AS SELECT * FROM deposits;
CREATE TABLE categories_backup AS SELECT * FROM categories;"

# 2. Restaurer depuis la dernière sauvegarde saine
# Suivre la procédure 2.1

# 3. Rejouer les opérations manquantes depuis les logs applicatifs
# (nécessite analyse des logs pour identifier les opérations post-sauvegarde)
```

### 2.3. Récupération après Perte Complète

**Contexte:** Perte totale du volume PostgreSQL ou corruption généralisée.

**Symptômes:**
- Conteneur PostgreSQL qui ne démarre pas
- Volume `postgres_data` corrompu
- Erreur "database does not exist"

**Procédure d'Urgence:**

```bash
# 1. Arrêter tous les services
docker-compose down

# 2. Sauvegarder le volume corrompu (si possible)
docker run --rm -v recyclic_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data_corrupted_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# 3. Supprimer le volume corrompu
docker volume rm recyclic_postgres_data

# 4. Recréer le volume
docker volume create recyclic_postgres_data

# 5. Redémarrer PostgreSQL seul
docker-compose up -d postgres

# 6. Attendre que PostgreSQL soit prêt
docker-compose exec postgres pg_isready -U recyclic

# 7. Créer la base de données
docker-compose exec postgres psql -U recyclic -c "CREATE DATABASE recyclic;"

# 8. Restaurer depuis la sauvegarde la plus récente
docker-compose exec -T postgres psql -U recyclic -d recyclic < /path/to/latest_backup.sql

# 9. Redémarrer tous les services
docker-compose up -d

# 10. Vérifier le fonctionnement
curl -f http://localhost:8000/health
```

### 2.4. Récupération Point-in-Time (PITR)

**Contexte:** Récupération à un moment précis dans le temps.

**Prérequis:**
- Sauvegarde de base + WAL archives
- Horodatage cible connu

**Procédure:**

```bash
# 1. Arrêter PostgreSQL
docker-compose stop postgres

# 2. Restaurer la sauvegarde de base
docker run --rm -v recyclic_postgres_data:/var/lib/postgresql/data -v $(pwd)/backups:/backups alpine tar xzf /backups/base_backup.tar.gz -C /var/lib/postgresql/data

# 3. Configurer recovery.conf
docker-compose exec postgres bash -c "
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /path/to/wal/%f %p'
recovery_target_time = '2025-01-27 14:30:00+00'
recovery_target_action = 'promote'
EOF"

# 4. Démarrer PostgreSQL en mode recovery
docker-compose start postgres

# 5. Surveiller la progression
docker-compose logs -f postgres

# 6. Vérifier une fois la récupération terminée
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT now();"
```

---

## 3. Outils et Scripts de Récupération

### Scripts Automatisés

#### `scripts/recovery-postgres.sh`
Script principal de récupération automatisée.

```bash
#!/bin/bash
# Script de récupération PostgreSQL
# Usage: ./scripts/recovery-postgres.sh <backup_file> [target_time]

BACKUP_FILE=$1
TARGET_TIME=${2:-latest}

# Fonction principale de récupération
recover_database() {
    echo "Starting database recovery..."

    # Validation du fichier de sauvegarde
    if ! pg_restore --list "$BACKUP_FILE" >/dev/null 2>&1; then
        echo "ERROR: Invalid backup file"
        exit 1
    fi

    # Arrêt des services
    docker-compose stop api bot frontend

    # Récupération
    docker-compose exec -T postgres psql -U recyclic -d recyclic < "$BACKUP_FILE"

    # Redémarrage
    docker-compose start api bot frontend

    echo "Recovery completed successfully"
}
```

#### `scripts/test-recovery.sh`
Script de test des procédures de récupération.

```bash
#!/bin/bash
# Script de test des procédures de récupération

echo "Testing recovery procedures..."

# Créer une sauvegarde de test
docker-compose exec postgres pg_dump -U recyclic -d recyclic > test_backup.sql

# Simuler une corruption
docker-compose exec postgres psql -U recyclic -d recyclic -c "DROP TABLE deposits;"

# Tester la récupération
./scripts/recovery-postgres.sh test_backup.sql

# Vérifier l'intégrité
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM deposits;"

echo "Recovery test completed"
```

### Outils de Diagnostic

#### Vérification d'Intégrité
```bash
# Vérifier l'intégrité de toutes les tables
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY tablename;"

# Contrôler les index corrompus
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND idx_tup_read > 0;"
```

#### Analyse des Logs PostgreSQL
```bash
# Afficher les erreurs récentes
docker-compose exec postgres tail -f /var/log/postgresql/postgresql-*.log | grep -i error

# Analyser les deadlocks
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;"
```

---

## 4. Validation Post-Récupération

### Tests Fonctionnels

#### Test de l'API
```bash
# Vérifier la santé de l'API
curl -f http://localhost:8000/health

# Tester les endpoints principaux
curl -f http://localhost:8000/api/v1/deposits/
curl -f http://localhost:8000/api/v1/categories/
curl -f http://localhost:8000/docs
```

#### Test de l'Interface Frontend
```bash
# Vérifier l'accès au frontend
curl -f http://localhost:4444

# Tester les fonctionnalités critiques
# - Connexion utilisateur
# - Création d'un dépôt
# - Consultation des ventes
```

#### Test des Bots
```bash
# Vérifier les webhooks Telegram
curl -f http://localhost:8001/health

# Tester l'envoi d'un message de test
curl -X POST http://localhost:8001/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "/test", "chat": {"id": 12345}}}'
```

### Tests de Cohérence Données

#### Vérification des Contraintes
```bash
# Contrôler l'intégrité référentielle
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';"
```

#### Validation des Données Métier
```bash
# Vérifier les données essentielles
docker-compose exec postgres psql -U recyclic -d recyclic -c "
-- Compter les enregistrements par table
SELECT
    schemaname,
    tablename,
    n_tup_ins - n_tup_del as estimated_count
FROM pg_stat_user_tables
ORDER BY estimated_count DESC;"

# Valider les catégories actives
docker-compose exec postgres psql -U recyclic -d recyclic -c "
SELECT
    name,
    eee_category,
    COUNT(*) as deposit_count
FROM deposits d
JOIN categories c ON d.category_id = c.id
GROUP BY c.name, c.eee_category
ORDER BY deposit_count DESC;"
```

---

## 5. Prévention et Maintenance

### Sauvegardes Régulières

#### Configuration Automatisée
```bash
# Installation du cron job (Linux)
./scripts/setup-postgres-backup-cron.sh

# Ou utilisation des services Docker
docker-compose -f docker-compose.backup.yml up -d postgres-backup
```

#### Tests de Sauvegarde
```bash
# Test mensuel des procédures de récupération
./scripts/test-recovery.sh

# Validation des sauvegardes
./scripts/verify-backup.sh
```

### Monitoring Continu

#### Métriques à Surveiller
- Âge de la dernière sauvegarde (< 25h)
- Taille des sauvegardes (stabilité)
- Temps d'exécution des sauvegardes (< 30 min)
- Espace disque disponible (> 5GB)

#### Alertes Configurées
```bash
# Configuration des seuils d'alerte
export ALERT_BACKUP_AGE_CRITICAL=25
export ALERT_DISK_SPACE_WARNING=5242880

# Test des alertes
./scripts/backup-alerting.sh test
```

---

## 6. Contacts et Escalade

### En Cas de Crise

1. **Immédiat (< 15 min)**: Vérifier les logs et métriques
2. **Court terme (< 1h)**: Initier la récupération appropriée
3. **Moyen terme (< 4h)**: Valider la restauration complète
4. **Long terme (< 24h)**: Analyse post-mortem et amélioration

### Contacts d'Urgence
- **Technique**: Équipe Dev (James, Bob)
- **Métier**: Direction Ressourcerie
- **Support**: Fournisseur d'hébergement

---

## 7. Historique des Incidents

| Date | Incident | Cause | Résolution | Temps de Résolution | Leçons Apprises |
|------|----------|-------|------------|-------------------|-----------------|
| 2025-01-27 | Test initial | N/A | Procédures validées | N/A | Documentation complète créée |

---

*Ce guide doit être testé mensuellement et mis à jour après chaque incident réel.*
