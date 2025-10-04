# Guide de Rollback pour la Migration des Catégories

**Version**: 1.0  
**Date**: 2025-01-27  
**Migration**: dom_category → categories  
**Migration ID**: k1l2m3n4o5p6  

## Vue d'ensemble

Ce guide décrit les procédures de rollback pour la migration des données de `dom_category` vers `categories`. Le rollback est une opération destructive qui supprime toutes les données de la table `categories`.

## ⚠️ AVERTISSEMENTS IMPORTANTS

- **OPÉRATION DESTRUCTIVE** : Le rollback supprime TOUTES les données de la table `categories`
- **IRRÉVERSIBLE** : Une fois exécuté, les données ne peuvent pas être récupérées
- **IMPACT MÉTIER** : Toute fonctionnalité dépendant de la table `categories` sera affectée
- **SAUVEGARDE REQUISE** : Toujours créer une sauvegarde avant le rollback

## Prérequis

### 1. Sauvegarde de la Base de Données

```bash
# Créer une sauvegarde complète avant le rollback
docker-compose exec postgres pg_dump -U recyclic -d recyclic > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Ou sauvegarde spécifique à la table categories
docker-compose exec postgres pg_dump -U recyclic -d recyclic -t categories > backup_categories_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Vérification de l'État Actuel

```bash
# Vérifier le nombre de catégories actuelles
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"

# Vérifier la version de migration actuelle
docker-compose run --rm api-migrations alembic current
```

## Procédures de Rollback

### Option 1: Rollback via Alembic (Recommandé)

```bash
# 1. Revenir à la migration précédente
docker-compose run --rm api-migrations alembic downgrade 9a2b3c4d5e6f

# 2. Vérifier que la table categories est vide
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"

# 3. Vérifier l'état de la migration
docker-compose run --rm api-migrations alembic current
```

### Option 2: Rollback Manuel (Si Alembic échoue)

```bash
# 1. Supprimer manuellement toutes les données de categories
docker-compose exec postgres psql -U recyclic -d recyclic -c "DELETE FROM categories;"

# 2. Mettre à jour la table alembic_version
docker-compose exec postgres psql -U recyclic -d recyclic -c "UPDATE alembic_version SET version_num = '9a2b3c4d5e6f';"

# 3. Vérifier l'état
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"
```

### Option 3: Rollback avec Restauration de Sauvegarde

```bash
# 1. Arrêter l'application
docker-compose down

# 2. Restaurer la sauvegarde complète
docker-compose exec postgres psql -U recyclic -d recyclic < backup_before_rollback_YYYYMMDD_HHMMSS.sql

# 3. Redémarrer l'application
docker-compose up -d
```

## Validation Post-Rollback

### 1. Vérifications de Base

```bash
# Vérifier que la table categories est vide
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM categories;"

# Vérifier que dom_category est intacte
docker-compose exec postgres psql -U recyclic -d recyclic -c "SELECT COUNT(*) FROM dom_category WHERE level = 1;"

# Vérifier la version de migration
docker-compose run --rm api-migrations alembic current
```

### 2. Tests Fonctionnels

```bash
# Exécuter les tests de l'application
docker-compose run --rm api-tests

# Vérifier que l'API fonctionne sans les catégories
curl -X GET "http://localhost:8000/api/v1/categories/" -H "accept: application/json"
```

### 3. Validation Complète

```bash
# Exécuter le script de validation post-migration
python3 api/scripts/validate_migration_post.py
```

## Scénarios de Rollback

### Scénario 1: Problème de Performance

**Symptômes**: L'application est lente après la migration  
**Action**: Rollback immédiat via Alembic  
**Temps estimé**: 2-3 minutes  

### Scénario 2: Erreurs de Données

**Symptômes**: Données corrompues ou manquantes  
**Action**: Rollback + investigation + re-migration  
**Temps estimé**: 10-15 minutes  

### Scénario 3: Problème de Compatibilité

**Symptômes**: L'application ne démarre pas  
**Action**: Rollback d'urgence + restauration de sauvegarde  
**Temps estimé**: 5-10 minutes  

## Procédures de Récupération

### Après un Rollback Réussi

1. **Analyser les Logs**
   ```bash
   docker-compose logs api | grep -i migration
   docker-compose logs postgres | grep -i error
   ```

2. **Identifier la Cause**
   - Vérifier les logs d'erreur
   - Analyser les métriques de performance
   - Consulter les rapports de monitoring

3. **Préparer une Nouvelle Migration**
   - Corriger les problèmes identifiés
   - Tester en environnement de développement
   - Planifier une nouvelle migration

### En Cas d'Échec du Rollback

1. **Arrêt d'Urgence**
   ```bash
   docker-compose down
   ```

2. **Restauration Complète**
   ```bash
   # Restaurer la sauvegarde la plus récente
   docker-compose exec postgres psql -U recyclic -d recyclic < backup_latest.sql
   ```

3. **Redémarrage Graduel**
   ```bash
   # Redémarrer les services un par un
   docker-compose up -d postgres
   docker-compose up -d redis
   docker-compose up -d api
   ```

## Monitoring et Alertes

### Métriques à Surveiller

- **Nombre de catégories**: Doit être 0 après rollback
- **Temps de réponse API**: Doit revenir aux niveaux normaux
- **Erreurs de base de données**: Doit être 0
- **Utilisation mémoire**: Doit revenir aux niveaux normaux

### Alertes Configurées

```yaml
# Exemple de configuration d'alerte
alerts:
  - name: "Categories Table Empty After Rollback"
    condition: "SELECT COUNT(*) FROM categories = 0"
    severity: "info"
  
  - name: "Migration Rollback Failed"
    condition: "alembic_version != '9a2b3c4d5e6f'"
    severity: "critical"
```

## Communication

### Notifications Requises

1. **Avant le Rollback**
   - Notifier l'équipe de développement
   - Informer les utilisateurs de la maintenance
   - Mettre à jour le statut du système

2. **Pendant le Rollback**
   - Maintenir la communication avec l'équipe
   - Documenter les étapes effectuées
   - Surveiller les métriques en temps réel

3. **Après le Rollback**
   - Confirmer le succès du rollback
   - Informer l'équipe du statut
   - Planifier les prochaines étapes

## Documentation et Rapports

### Rapport de Rollback

Créer un rapport documentant :

1. **Raison du Rollback**
   - Problème identifié
   - Impact sur l'application
   - Décision de rollback

2. **Procédure Exécutée**
   - Étapes suivies
   - Commandes exécutées
   - Résultats obtenus

3. **Validation Post-Rollback**
   - Tests effectués
   - Métriques vérifiées
   - Statut final

4. **Prochaines Étapes**
   - Actions correctives
   - Nouvelle migration planifiée
   - Améliorations prévues

## Contacts d'Urgence

- **Équipe de Développement**: [Contact]
- **Administrateur Base de Données**: [Contact]
- **Responsable Infrastructure**: [Contact]
- **Chef de Projet**: [Contact]

## Historique des Modifications

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 2025-01-27 | James (Dev) | Création initiale du guide |

---

**Note**: Ce guide doit être testé régulièrement en environnement de staging pour s'assurer de sa validité et de sa complétude.
