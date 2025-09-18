# Guide de Déploiement et de Rollback - Recyclic

**Version :** 1.0  
**Date :** 2025-01-27  
**Objectif :** Procédures opérationnelles pour le déploiement et le rollback en production

---

## 1. Vue d'Ensemble

Ce document décrit les procédures de déploiement et de rollback pour la plateforme Recyclic. Il s'agit de procédures critiques qui doivent être exécutées avec précaution pour assurer la continuité du service.

### 1.1 Principe de Fonctionnement

Le système de rollback repose sur le versionnement des images Docker :
- Chaque déploiement génère un tag unique basé sur le SHA du commit Git (7 caractères)
- Les images sont taguées avec la même version pour tous les services (api, bot, frontend)
- Le script `rollback.sh` permet de revenir à une version précédente en quelques minutes

---

## 2. Quand Déclencher un Rollback

### 2.1 Critères de Rollback Immédiat

**Déclencher un rollback immédiatement si :**
- L'application ne démarre pas ou ne répond pas
- Erreurs critiques dans les logs (500, erreurs de base de données)
- Problèmes de sécurité identifiés
- Dégradation majeure des performances (>50% de réduction)
- Perte de données ou corruption

### 2.2 Critères de Rollback Planifié

**Considérer un rollback si :**
- Fonctionnalités critiques non disponibles
- Problèmes de compatibilité avec les données existantes
- Erreurs mineures mais impactant l'expérience utilisateur
- Problèmes de performance modérés

### 2.3 Processus de Décision

1. **Évaluation rapide** (2-5 minutes) : Identifier la gravité du problème
2. **Communication** : Informer l'équipe via Slack/Teams
3. **Décision** : Rollback immédiat ou investigation plus poussée
4. **Exécution** : Suivre la procédure de rollback
5. **Post-mortem** : Analyser les causes et prévenir la récurrence

---

## 3. Procédure de Rollback

### 3.1 Commandes de Rollback

#### Rollback Automatique (Recommandé)
```bash
# Se placer dans le répertoire du projet
cd /path/to/recyclic

# Rollback vers la version précédente automatiquement
bash scripts/rollback.sh
```

#### Rollback vers une Version Spécifique
```bash
# Rollback vers une version spécifique (ex: commit abc1234)
bash scripts/rollback.sh abc1234

# Voir les versions disponibles
bash scripts/rollback.sh --help
```

### 3.2 Étapes Détaillées

1. **Préparation**
   ```bash
   # Vérifier que vous êtes dans le bon répertoire
   ls -la docker-compose.yml
   
   # Vérifier l'état actuel des services
   docker-compose ps
   ```

2. **Exécution du Rollback**
   ```bash
   # Le script va :
   # - Identifier la version actuelle
   # - Déterminer la version précédente
   # - Demander confirmation
   # - Arrêter les services actuels
   # - Redémarrer avec la version précédente
   bash scripts/rollback.sh
   ```

3. **Confirmation**
   - Le script demande confirmation avant d'effectuer le rollback
   - Répondre `y` pour confirmer ou `n` pour annuler
   - Le processus prend généralement 2-5 minutes

### 3.3 Vérification Post-Rollback

#### Vérifications Immédiates
```bash
# 1. Vérifier que les services sont en cours d'exécution
docker-compose ps

# 2. Vérifier les logs pour détecter des erreurs
docker-compose logs --tail=50 api
docker-compose logs --tail=50 frontend

# 3. Tester l'accès à l'application
curl -f http://localhost:8000/health || echo "API non accessible"
curl -f http://localhost:4444 || echo "Frontend non accessible"
```

#### Vérifications Fonctionnelles
- [ ] L'API répond aux requêtes de santé
- [ ] Le frontend se charge correctement
- [ ] Les fonctionnalités critiques sont opérationnelles
- [ ] Aucune erreur critique dans les logs

---

## 4. Gestion des Erreurs

### 4.1 Erreurs Courantes

#### "Impossible de déterminer la version actuellement déployée"
**Cause :** Aucun service n'est en cours d'exécution  
**Solution :**
```bash
# Vérifier l'état des conteneurs
docker ps -a

# Redémarrer les services si nécessaire
docker-compose up -d
```

#### "La version X n'existe pas ou est incomplète"
**Cause :** Les images Docker ne sont pas toutes taguées avec la même version  
**Solution :**
```bash
# Vérifier les images disponibles
docker images | grep recyclic

# Utiliser une version qui existe
bash scripts/rollback.sh [version-existante]
```

#### "Impossible d'accéder à l'historique Git"
**Cause :** Problème de permissions ou répertoire incorrect  
**Solution :**
```bash
# Vérifier que vous êtes dans le bon répertoire
pwd
ls -la docker-compose.yml

# Vérifier les permissions Git
git status
```

### 4.2 Rollback d'Urgence

En cas de problème critique, procédure accélérée :

```bash
# 1. Arrêter immédiatement les services
docker-compose down

# 2. Identifier manuellement la version précédente
docker images | grep recyclic | head -5

# 3. Redémarrer avec la version précédente
docker-compose --env-file .env.rollback up -d
```

---

## 5. Métriques et Monitoring

### 5.1 Métriques de Rollback

Le script enregistre automatiquement des métriques détaillées dans `logs/rollback-metrics.json` :

```json
{
  "timestamp": "2025-01-27T10:30:00Z",
  "event": "rollback_success",
  "version": "abc1234",
  "duration_seconds": "45",
  "status": "success",
  "hostname": "production-server",
  "user": "deploy-user",
  "system_metrics": {
    "cpu_usage_percent": "45.2",
    "memory_usage_percent": "67.8",
    "disk_usage_percent": "23.1",
    "docker_containers_running": "6",
    "docker_images_count": "12"
  },
  "performance": {
    "rollback_speed": "fast",
    "efficiency_score": "100"
  }
}
```

### 5.2 Notifications Automatiques

Le script envoie automatiquement des notifications via Telegram aux administrateurs :

- **Notifications de succès** : Confirmation du rollback réussi
- **Notifications d'échec** : Alerte en cas de problème
- **Notifications d'annulation** : Information sur l'annulation
- **Alertes d'urgence** : Alerte immédiate pour les échecs critiques

**Configuration requise :**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321
```

Voir [Configuration des Notifications](./rollback-notifications-config.md) pour plus de détails.

### 5.3 Surveillance Post-Rollback

**Métriques à surveiller :**
- Temps de réponse de l'API (< 500ms)
- Taux d'erreur (< 1%)
- Disponibilité des services (> 99%)
- Utilisation des ressources (CPU < 80%, RAM < 80%)

**Outils de monitoring :**
- Logs Docker : `docker-compose logs -f`
- Métriques système : `docker stats`
- Health checks : `curl http://localhost:8000/health`

---

## 6. Procédures Post-Rollback

### 6.1 Communication

**Immédiatement après le rollback :**
1. **Notifier l'équipe** via Slack/Teams
2. **Mettre à jour le statut** sur le tableau de bord
3. **Informer les utilisateurs** si nécessaire

**Template de communication :**
```
🚨 ROLLBACK EFFECTUÉ
- Heure : [timestamp]
- Version précédente : [version]
- Cause : [description brève]
- Statut : Services restaurés
- Prochaine étape : Investigation en cours
```

### 6.2 Investigation

**Dans les 2 heures suivant le rollback :**
1. **Analyser les logs** de la version défaillante
2. **Identifier la cause racine** du problème
3. **Documenter les leçons apprises**
4. **Planifier les corrections** nécessaires

### 6.3 Post-Mortem

**Dans les 24 heures :**
1. **Réunion post-mortem** avec l'équipe
2. **Documentation** des causes et solutions
3. **Amélioration** des procédures si nécessaire
4. **Mise à jour** de ce guide

---

## 7. Prévention et Bonnes Pratiques

### 7.1 Tests Avant Déploiement

**Toujours tester avant de déployer :**
- Tests unitaires et d'intégration
- Tests de performance
- Tests de rollback en environnement de staging
- Validation des migrations de base de données

### 7.2 Déploiements Sécurisés

**Bonnes pratiques :**
- Déploiements en dehors des heures de pointe
- Déploiements par étapes (staging → production)
- Surveillance active pendant les premières heures
- Plan de rollback toujours prêt

### 7.3 Maintenance Préventive

**Actions régulières :**
- Nettoyage des anciennes images Docker
- Sauvegarde des configurations
- Mise à jour de la documentation
- Formation de l'équipe sur les procédures

---

## 8. Contacts et Escalade

### 8.1 Contacts d'Urgence

**En cas de problème critique :**
- **DevOps Lead** : [nom] - [téléphone]
- **Tech Lead** : [nom] - [téléphone]
- **Product Owner** : [nom] - [téléphone]

### 8.2 Escalade

**Niveau 1** : Équipe de développement (0-30 min)  
**Niveau 2** : Tech Lead + DevOps (30-60 min)  
**Niveau 3** : Management + Support externe (60+ min)

---

## 9. Annexes

### 9.1 Commandes de Diagnostic

```bash
# État des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Utilisation des ressources
docker stats

# Espace disque
df -h

# Mémoire disponible
free -h
```

### 9.2 Fichiers de Configuration

- **Script de rollback** : `scripts/rollback.sh`
- **Configuration Docker** : `docker-compose.yml`
- **Variables d'environnement** : `.env`
- **Métriques** : `logs/rollback-metrics.json`

### 9.3 Liens Utiles

- **Documentation API** : http://localhost:8000/docs
- **Interface utilisateur** : http://localhost:4444
- **Monitoring** : [URL du dashboard]
- **Logs centralisés** : [URL des logs]

---

**Dernière mise à jour :** 2025-01-27  
**Prochaine révision :** 2025-02-27  
**Responsable :** Équipe DevOps Recyclic
