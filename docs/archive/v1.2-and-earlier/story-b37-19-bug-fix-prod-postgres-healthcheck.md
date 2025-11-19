# Story b37-19: Bug: Le healthcheck Postgres est manquant en production

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Bug / Infrastructure
**Priorité:** Bloquant

## 1. Contexte

Le déploiement de l'application sur l'environnement de production échoue car le conteneur `postgres` ne démarre pas correctement. L'erreur `dependency failed to start: container recyclic-prod-postgres has no healthcheck configured` indique que Docker Compose ne peut pas vérifier la santé du service Postgres.

Une comparaison des fichiers `docker-compose.staging.yml` et `docker-compose.prod.yml` a révélé que la commande `test` du healthcheck est manquante dans la configuration de production.

## 2. User Story (En tant que...)

En tant que **Développeur DevOps**, je veux que **le healthcheck du service Postgres soit correctement configuré en production**, afin que le conteneur puisse démarrer et que l'application puisse se déployer sans erreur.

## 3. Critères d'Acceptation

1.  Dans le fichier `docker-compose.prod.yml`, la section `healthcheck` du service `postgres` DOIT inclure la commande `test`.
2.  La commande `test` DOIT être `["CMD-SHELL", "pg_isready -U recyclic"]`.
3.  Après cette modification, le déploiement sur production DOIT réussir et le conteneur `postgres` DOIT démarrer correctement.

## 4. Solution Technique Recommandée

**Fichier à modifier :** `docker-compose.prod.yml`

**Section à modifier :** `services.postgres.healthcheck`

**Code Actuel (Incorrect) :**
```yaml
    healthcheck:
      interval: 30s
      timeout: 5s
      retries: 5
```

**Code Corrigé (Attendu) :**
```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recyclic"]
      interval: 30s
      timeout: 5s
      retries: 5
```

## 5. Prérequis de Test

- L'agent devra lancer un déploiement sur l'environnement de production après cette modification.
- **Vérification :** Le conteneur `postgres` doit démarrer correctement et l'application doit être accessible.
