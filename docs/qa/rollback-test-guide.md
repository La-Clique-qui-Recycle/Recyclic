# Guide de Test - Procédure de Rollback

**Version :** 1.0  
**Date :** 2025-01-27  
**Objectif :** Valider la procédure de rollback dans un environnement de test

---

## 1. Prérequis

### 1.1 Environnement de Test
- Docker et Docker Compose installés
- Git configuré avec un historique de commits
- Accès en ligne de commande (WSL recommandé sur Windows)

### 1.2 Préparation de l'Environnement
```bash
# 1. Se placer dans le répertoire du projet
cd /mnt/d/Users/Strophe/Documents/°IA/La\ Clique\ Qui\ Recycle/Recyclic/

# 2. Vérifier que le script rollback existe
ls -la scripts/rollback.sh

# 3. Rendre le script exécutable
chmod +x scripts/rollback.sh
```

---

## 2. Scénarios de Test

### 2.1 Test 1 : Vérification des Prérequis

**Objectif :** S'assurer que l'environnement est prêt pour les tests

**Étapes :**
```bash
# 1. Vérifier la présence de docker-compose.yml
ls -la docker-compose.yml

# 2. Vérifier l'historique Git
git log --oneline -5

# 3. Tester l'aide du script
bash scripts/rollback.sh --help
```

**Résultat attendu :**
- Le script affiche l'aide avec les options disponibles
- Aucune erreur n'est générée

### 2.2 Test 2 : Création d'Images de Test

**Objectif :** Créer au moins deux versions d'images Docker pour tester le rollback

**Étapes :**
```bash
# 1. Créer une première version (version actuelle)
git tag test-version-1
docker-compose build
docker tag recyclic-api:latest recyclic-api:test-version-1
docker tag recyclic-bot:latest recyclic-bot:test-version-1
docker tag recyclic-frontend:latest recyclic-frontend:test-version-1

# 2. Faire un petit changement pour simuler une nouvelle version
echo "# Test change" >> README.md
git add README.md
git commit -m "Test: simulate new version"

# 3. Créer une deuxième version
git tag test-version-2
docker-compose build
docker tag recyclic-api:latest recyclic-api:test-version-2
docker tag recyclic-bot:latest recyclic-bot:test-version-2
docker tag recyclic-frontend:latest recyclic-frontend:test-version-2

# 4. Vérifier que les images existent
docker images | grep recyclic
```

**Résultat attendu :**
- Deux versions d'images sont créées et taguées
- Les images sont visibles dans `docker images`

### 2.3 Test 3 : Déploiement Initial

**Objectif :** Déployer la version la plus récente pour simuler un environnement de production

**Étapes :**
```bash
# 1. Créer un fichier d'environnement pour la version 2
cat > .env.test << EOF
API_IMAGE_TAG=test-version-2
BOT_IMAGE_TAG=test-version-2
FRONTEND_IMAGE_TAG=test-version-2
EOF

# 2. Démarrer les services avec la version 2
docker-compose --env-file .env.test up -d

# 3. Vérifier que les services sont en cours d'exécution
docker-compose --env-file .env.test ps

# 4. Attendre que les services soient prêts
sleep 10
```

**Résultat attendu :**
- Les services démarrent sans erreur
- Tous les conteneurs sont en état "Up"

### 2.4 Test 4 : Rollback vers Version Spécifique

**Objectif :** Tester le rollback vers une version spécifique

**Étapes :**
```bash
# 1. Exécuter le rollback vers la version 1
bash scripts/rollback.sh test-version-1

# 2. Vérifier que les services ont redémarré
docker-compose ps

# 3. Vérifier les logs de rollback
cat logs/rollback-metrics.json
```

**Résultat attendu :**
- Le script demande confirmation avant d'effectuer le rollback
- Les services redémarrent avec la version 1
- Les métriques sont enregistrées dans le fichier de logs

### 2.5 Test 5 : Rollback Automatique

**Objectif :** Tester le rollback automatique vers la version précédente

**Étapes :**
```bash
# 1. Redéployer la version 2
docker-compose --env-file .env.test up -d

# 2. Exécuter le rollback automatique (sans spécifier de version)
bash scripts/rollback.sh

# 3. Vérifier que le rollback s'est effectué vers la version 1
docker-compose ps
```

**Résultat attendu :**
- Le script détermine automatiquement la version précédente
- Le rollback s'effectue vers la version 1

### 2.6 Test 6 : Gestion des Erreurs

**Objectif :** Tester la gestion des cas d'erreur

**Étapes :**
```bash
# 1. Tester avec une version inexistante
bash scripts/rollback.sh version-inexistante

# 2. Tester depuis un mauvais répertoire
cd /tmp
bash /path/to/recyclic/scripts/rollback.sh

# 3. Tester l'annulation du rollback
bash scripts/rollback.sh test-version-1
# Répondre "N" à la confirmation
```

**Résultat attendu :**
- Le script affiche des messages d'erreur clairs
- Le script s'arrête proprement en cas d'erreur
- L'annulation fonctionne correctement

---

## 3. Validation des Résultats

### 3.1 Critères de Succès
- [ ] Tous les tests s'exécutent sans erreur critique
- [ ] Le script gère correctement les cas d'erreur
- [ ] Les métriques sont enregistrées dans `logs/rollback-metrics.json`
- [ ] Les services redémarrent correctement après rollback
- [ ] Le script demande confirmation avant d'effectuer le rollback

### 3.2 Vérifications Post-Test
```bash
# 1. Vérifier les métriques
cat logs/rollback-metrics.json | jq '.'

# 2. Vérifier l'état des services
docker-compose ps

# 3. Nettoyer les images de test
docker rmi recyclic-api:test-version-1 recyclic-api:test-version-2
docker rmi recyclic-bot:test-version-1 recyclic-bot:test-version-2
docker rmi recyclic-frontend:test-version-1 recyclic-frontend:test-version-2

# 4. Nettoyer les tags Git
git tag -d test-version-1 test-version-2
```

---

## 4. Problèmes Connus et Solutions

### 4.1 Problème : "Impossible de déterminer la version actuellement déployée"
**Cause :** Aucun conteneur recyclic-api n'est en cours d'exécution  
**Solution :** S'assurer qu'au moins un service est déployé avant de tester le rollback

### 4.2 Problème : "La version X n'existe pas ou est incomplète"
**Cause :** Les images Docker ne sont pas toutes taguées avec la même version  
**Solution :** Vérifier que toutes les images (api, bot, frontend) sont taguées avec la même version

### 4.3 Problème : "Impossible d'accéder à l'historique Git"
**Cause :** Le répertoire n'est pas un dépôt Git ou les permissions sont incorrectes  
**Solution :** Vérifier que le script est exécuté depuis la racine du projet et que Git est accessible

---

## 5. Rapport de Test

Après l'exécution de tous les tests, documenter les résultats dans ce tableau :

| Test | Statut | Commentaires |
|------|--------|--------------|
| Test 1 : Vérification des Prérequis | ⬜ Passé / ⬜ Échec | |
| Test 2 : Création d'Images de Test | ⬜ Passé / ⬜ Échec | |
| Test 3 : Déploiement Initial | ⬜ Passé / ⬜ Échec | |
| Test 4 : Rollback vers Version Spécifique | ⬜ Passé / ⬜ Échec | |
| Test 5 : Rollback Automatique | ⬜ Passé / ⬜ Échec | |
| Test 6 : Gestion des Erreurs | ⬜ Passé / ⬜ Échec | |

**Résultat Global :** ⬜ Tous les tests passent / ⬜ Des corrections sont nécessaires

**Actions Correctives :**
- [ ] Corriger les bugs identifiés
- [ ] Améliorer la gestion d'erreurs
- [ ] Mettre à jour la documentation
