# Guide de Test - Procédure de Rollback

## Objectif
Ce guide permet de valider le bon fonctionnement de la procédure de rollback sur un environnement de test.

## Prérequis
- Docker et Docker Compose installés
- Git configuré
- Environnement de test disponible

## Tests à Effectuer

### 1. Test du Workflow de Déploiement

#### 1.1. Vérification du Versionnement
```bash
# Vérifier que le workflow génère des tags de version
grep -A 5 "Set version tag" .github/workflows/deploy.yaml
grep -A 3 "Build Docker images" .github/workflows/deploy.yaml
```

**Résultat attendu** : Le workflow doit utiliser `${GITHUB_SHA::7}` pour générer des tags uniques.

#### 1.2. Vérification de la Conservation des Versions
```bash
# Vérifier que le script nettoie seulement les anciennes versions
grep -A 10 "Cleaning up old images" .github/workflows/deploy.yaml
```

**Résultat attendu** : Le script doit conserver les 5 dernières versions de chaque image.

### 2. Test du Script de Rollback

#### 2.1. Test Rapide (Recommandé)
```bash
# Exécuter le test rapide
bash scripts/test-rollback-quick.sh
```

**Résultat attendu** : Tous les tests rapides doivent passer.

#### 2.2. Test de l'Aide
```bash
# Tester l'affichage de l'aide
bash scripts/rollback.sh --help
```

**Résultat attendu** : Affichage de l'aide avec les options disponibles.

#### 2.3. Test de Validation des Arguments
```bash
# Tester avec un tag inexistant
bash scripts/rollback.sh nonexistent-tag
```

**Résultat attendu** : Message d'erreur indiquant que la version n'existe pas.

#### 2.4. Test des Métriques
```bash
# Tester l'enregistrement des métriques
mkdir -p logs
bash -c 'source scripts/rollback.sh && log_metrics test_event test_version 10 success'
cat logs/rollback-metrics.json
```

**Résultat attendu** : Fichier JSON avec les métriques correctement formatées.

#### 2.5. Test de Détection de Version Actuelle
```bash
# Simuler un environnement avec des conteneurs
docker run -d --name test-api recyclic-api:latest || true
bash scripts/rollback.sh
```

**Résultat attendu** : Le script doit détecter la version actuelle et proposer la version précédente.

### 3. Test de la Configuration Docker Compose

#### 3.1. Vérification des Variables d'Environnement
```bash
# Vérifier que docker-compose.yml utilise les variables
grep "API_IMAGE_TAG" docker-compose.yml
grep "BOT_IMAGE_TAG" docker-compose.yml
grep "FRONTEND_IMAGE_TAG" docker-compose.yml
```

**Résultat attendu** : Toutes les images doivent utiliser des variables d'environnement avec des valeurs par défaut.

#### 3.2. Test avec Variables d'Environnement
```bash
# Créer un fichier .env de test
echo "API_IMAGE_TAG=test-version" > .env.test
echo "BOT_IMAGE_TAG=test-version" >> .env.test
echo "FRONTEND_IMAGE_TAG=test-version" >> .env.test

# Tester la configuration
docker-compose --env-file .env.test config
```

**Résultat attendu** : La configuration doit utiliser les tags spécifiés.

### 4. Test d'Intégration Complet

#### 4.1. Simulation d'un Déploiement
```bash
# Créer des images de test avec des tags différents
docker build -t recyclic-api:v1.0.0 -f api/Dockerfile .
docker build -t recyclic-bot:v1.0.0 -f bot/Dockerfile .
docker build -t recyclic-frontend:v1.0.0 -f frontend/Dockerfile .

docker build -t recyclic-api:v1.1.0 -f api/Dockerfile .
docker build -t recyclic-bot:v1.1.0 -f bot/Dockerfile .
docker build -t recyclic-frontend:v1.1.0 -f frontend/Dockerfile .
```

#### 4.2. Test de Rollback
```bash
# Déployer la version 1.1.0
echo "API_IMAGE_TAG=v1.1.0" > .env.production
echo "BOT_IMAGE_TAG=v1.1.0" >> .env.production
echo "FRONTEND_IMAGE_TAG=v1.1.0" >> .env.production

docker-compose --env-file .env.production up -d

# Effectuer un rollback vers 1.0.0
bash scripts/rollback.sh v1.0.0
```

**Résultat attendu** : Les services doivent redémarrer avec la version 1.0.0.

### 5. Test de Sécurité

#### 5.1. Test de Confirmation
```bash
# Tester l'annulation du rollback
echo "n" | bash scripts/rollback.sh v1.0.0
```

**Résultat attendu** : Le script doit s'arrêter sans effectuer le rollback.

#### 5.2. Test de Validation des Images
```bash
# Tester avec des images manquantes
docker rmi recyclic-api:v1.0.0 || true
bash scripts/rollback.sh v1.0.0
```

**Résultat attendu** : Message d'erreur indiquant que les images sont manquantes.

## Checklist de Validation

- [ ] Le workflow GitHub Actions génère des tags de version uniques
- [ ] Le workflow conserve les 5 dernières versions d'images
- [ ] Le test rapide `scripts/test-rollback-quick.sh` passe
- [ ] Le script de rollback affiche l'aide correctement
- [ ] Le script valide les arguments et les images disponibles
- [ ] Le script détecte la version actuelle automatiquement
- [ ] Les métriques sont enregistrées correctement dans `logs/rollback-metrics.json`
- [ ] Docker Compose utilise les variables d'environnement
- [ ] Le rollback fonctionne avec des versions spécifiques
- [ ] Le rollback fonctionne en mode automatique
- [ ] La confirmation utilisateur fonctionne
- [ ] Les erreurs sont gérées correctement
- [ ] Les tests automatisés complets passent (optionnel)

## Nettoyage

```bash
# Nettoyer les images de test
docker rmi recyclic-api:v1.0.0 recyclic-api:v1.1.0 || true
docker rmi recyclic-bot:v1.0.0 recyclic-bot:v1.1.0 || true
docker rmi recyclic-frontend:v1.0.0 recyclic-frontend:v1.1.0 || true

# Nettoyer les conteneurs de test
docker rm -f test-api || true

# Nettoyer les fichiers temporaires
rm -f .env.test .env.production
```

## Notes Importantes

- Ces tests doivent être effectués sur un environnement de test, jamais en production
- Tous les tests doivent passer avant de considérer la procédure de rollback comme fonctionnelle
- En cas d'échec, corriger les problèmes identifiés et relancer les tests
