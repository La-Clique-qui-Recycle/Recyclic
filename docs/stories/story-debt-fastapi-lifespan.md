# Story: Migration FastAPI vers Lifespan Handlers

**ID :** DEBT-001  
**Type :** Dette Technique  
**Priorité :** Moyenne  
**Effort estimé :** 2-3 heures  
**Sprint :** Prochain cycle de maintenance  

## 📋 Description

Migrer les gestionnaires d'événements FastAPI dépréciés vers les nouveaux gestionnaires de cycle de vie (`lifespan`).

## 🎯 Contexte

Actuellement, l'API utilise `@app.on_event("startup")` et `@app.on_event("shutdown")` qui sont dépréciés et génèrent des warnings dans les logs de test.

## ✅ Critères d'Acceptation

- [ ] Remplacer `@app.on_event("startup")` par `lifespan` handler
- [ ] Remplacer `@app.on_event("shutdown")` par `lifespan` handler
- [ ] Supprimer tous les warnings FastAPI dans les logs
- [ ] Tous les tests passent sans warnings
- [ ] Documentation mise à jour

## 🔧 Détails Techniques

### Code actuel (à remplacer) :
```python
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up Recyclic API...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Recyclic API...")
```

### Code cible :
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Recyclic API...")
    yield
    # Shutdown
    logger.info("Shutting down Recyclic API...")

app = FastAPI(lifespan=lifespan, ...)
```

## 📚 Références

- [FastAPI Lifespan Events](https://fastapi.tiangolo.com/advanced/events/)
- [Migration Guide](https://fastapi.tiangolo.com/advanced/events/#lifespan-events)

## 🧪 Tests

- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Aucun warning dans les logs
- [ ] Fonctionnalité de démarrage/arrêt préservée

## 📝 Notes

Cette migration améliore la compatibilité avec les futures versions de FastAPI et élimine les warnings de dépréciation.
