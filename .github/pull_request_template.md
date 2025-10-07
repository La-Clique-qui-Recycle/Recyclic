# Pull Request

## Description
<!-- Décrivez les changements apportés par cette PR -->

## Type de changement
- [ ] 🐛 Bug fix (correction d'un bug)
- [ ] ✨ New feature (nouvelle fonctionnalité)
- [ ] 💥 Breaking change (changement incompatible avec les versions précédentes)
- [ ] 📝 Documentation (mise à jour de la documentation)
- [ ] 🎨 Style (formatage, nommage, etc.)
- [ ] ♻️  Refactoring (restructuration du code sans changement de fonctionnalité)
- [ ] ⚡ Performance (amélioration des performances)
- [ ] ✅ Tests (ajout ou correction de tests)
- [ ] 🔧 Chore (mise à jour des dépendances, configuration, etc.)

## Story/Issue liée
<!-- Référence à la story ou issue (ex: #123, STORY-ABC-123) -->

## Checklist générale
- [ ] Mon code respecte les conventions de style du projet
- [ ] J'ai effectué une auto-revue de mon code
- [ ] J'ai commenté mon code, notamment dans les zones complexes
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que ma correction est efficace ou que ma fonctionnalité fonctionne
- [ ] Les tests unitaires existants et nouveaux passent localement
- [ ] Les changements dépendants ont été mergés et publiés

## Checklist Migrations Alembic
<!-- À compléter UNIQUEMENT si cette PR contient des migrations de base de données -->
- [ ] Chaque nouvelle migration a un `down_revision` correct pointant vers la migration parent
- [ ] L'ordre des opérations est correct : drop contraintes FK → drop colonnes → drop tables
- [ ] Si des contraintes ou tables sont supprimées, un plan de migration/rollback est documenté
- [ ] `docker-compose run --rm api-migrations alembic heads` retourne une seule tête
- [ ] `docker-compose run --rm api-migrations alembic upgrade head --sql` s'exécute sans erreur (dry-run)
- [ ] Les migrations ont été testées sur une base de données propre :
  ```bash
  docker-compose exec postgres psql -U recyclic -d recyclic -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  docker-compose run --rm api-migrations alembic upgrade head
  ```
- [ ] Les tests passent après les migrations : `docker-compose run --rm api-tests`
- [ ] Les migrations sont idempotentes (peuvent être exécutées plusieurs fois sans erreur)
- [ ] Les données existantes sont préservées ou migrées correctement

### Plan de Migration (si applicable)
<!-- Décrivez la stratégie de migration pour les environnements de production -->
```
1. Sauvegarde de la base de données
2. Étapes de migration
3. Validation post-migration
4. Plan de rollback en cas de problème
```

## Tests
<!-- Décrivez les tests effectués pour vérifier vos changements -->
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E
- [ ] Tests manuels

### Commandes de test exécutées
```bash
# Backend
docker-compose run --rm api-tests

# Frontend
npm test

# Migrations
docker-compose run --rm api-migrations alembic upgrade head
```

## Screenshots / GIFs
<!-- Si applicable, ajoutez des captures d'écran ou GIFs pour illustrer les changements -->

## Notes additionnelles
<!-- Toute information supplémentaire pour les reviewers -->

## Checklist de revue
<!-- Pour les reviewers -->
- [ ] Le code est clair et maintenable
- [ ] Les tests couvrent les cas limites
- [ ] La documentation est à jour
- [ ] Les migrations sont sûres et testées
- [ ] Aucune régression détectée

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
