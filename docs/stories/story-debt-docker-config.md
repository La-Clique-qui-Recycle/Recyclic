# Story: Nettoyage Configuration Docker

**ID :** DEBT-002  
**Type :** Dette Technique  
**Priorité :** Faible  
**Effort estimé :** 30 minutes  
**Sprint :** Prochain cycle de maintenance  

## 📋 Description

Supprimer l'attribut `version` obsolète du fichier `docker-compose.yml` pour éliminer les warnings.

## 🎯 Contexte

Le fichier `docker-compose.yml` contient un attribut `version` qui est obsolète et génère des warnings dans les logs Docker.

## ✅ Critères d'Acceptation

- [ ] Supprimer l'attribut `version` de `docker-compose.yml`
- [ ] Vérifier que tous les services fonctionnent correctement
- [ ] Aucun warning Docker dans les logs
- [ ] Documentation mise à jour si nécessaire

## 🔧 Détails Techniques

### Code actuel (à modifier) :
```yaml
version: '3.8'

services:
  postgres:
    # ...
```

### Code cible :
```yaml
services:
  postgres:
    # ...
```

## 📚 Références

- [Docker Compose Version](https://docs.docker.com/compose/compose-file/compose-versioning/)
- [Migration Guide](https://docs.docker.com/compose/compose-file/compose-versioning/#version-3)

## 🧪 Tests

- [ ] `docker-compose up -d` fonctionne sans warnings
- [ ] Tous les services démarrent correctement
- [ ] Tests d'intégration passent
- [ ] Aucun warning dans les logs

## 📝 Notes

Cette modification améliore la compatibilité avec les versions récentes de Docker Compose et élimine les warnings de dépréciation.
