# Story b34-p11: Génération et Validation des Migrations Manquantes en Environnement Isolé

**Statut:** Terminé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Les déploiements sur des bases de données neuves échouent car des migrations pour des fonctionnalités récentes (ex: unicité de l'email, table `email_logs`) n'ont jamais été générées. Pour résoudre ce problème de manière sûre, nous devons générer ces migrations et valider le processus d'installation complet dans un environnement temporaire et isolé, sans aucun risque pour la stack de développement locale existante.

## 2. User Story (En tant que...)

En tant que **Product Owner**, je veux **disposer de tous les fichiers de migration nécessaires pour garantir qu'une nouvelle installation de l'application fonctionne sans erreur**, en validant le processus sur une stack parallèle et jetable.

## 3. Critères d'Acceptation

**Phase 1 : Création d'un Environnement de Test Isolé**
1.  L'agent DOIT d'abord créer une copie de sauvegarde du fichier `docker-compose.yml` nommée `docker-compose.yml.backup2`.
2.  L'agent DOIT ensuite modifier le fichier `docker-compose.yml` original pour créer une stack parallèle. Toutes les ressources (noms de services, de conteneurs, de réseaux, et **surtout de volumes**) DOIVENT être suffixées par `_temp` (ex: `postgres_temp`, `recyclic-network_temp`, `postgres_data_temp`).
3.  L'agent DOIT démarrer cette stack temporaire avec `docker-compose up -d`.

**Phase 2 : Génération des Migrations Manquantes**
4.  Dans cet environnement isolé, l'agent DOIT exécuter les commandes `alembic revision --autogenerate` nécessaires pour créer tous les fichiers de migration manquants (notamment pour l'unicité de l'email et la table `email_logs`).

**Phase 3 : Validation de la Solution par Réinstallation à Neuf**
5.  L'agent DOIT arrêter la stack temporaire avec `docker-compose down`.
6.  L'agent DOIT identifier le nom exact du nouveau volume créé (ex: `recyclic_postgres_data_temp`).
7.  L'agent DOIT supprimer **manuellement et uniquement ce volume spécifique** avec la commande `docker volume rm <nom_du_volume_temp>`. L'utilisation de `docker-compose down -v` ou `docker system prune` est **strictement interdite**.
8.  L'agent DOIT ensuite relancer la stack temporaire avec `docker-compose up -d --build` pour simuler une installation 100% neuve.
9.  L'agent DOIT prouver que l'application démarre sans erreur 500 et que toutes les tables sont bien créées dans la nouvelle base de données.

**Phase 4 : Nettoyage Final**
10. L'agent DOIT arrêter et détruire la stack temporaire finale avec `docker-compose down`.
11. L'agent DOIT supprimer son `docker-compose.yml` modifié.
12. L'agent DOIT renommer la sauvegarde `docker-compose.yml.backup2` en `docker-compose.yml` pour restaurer le fichier original.
13. Le seul "livrable" de cette story sont les **nouveaux fichiers de migration** créés dans le dossier `api/migrations/versions/`.

## 4. Prérequis de Test

- L'agent devra utiliser les commandes `docker-compose`, `docker volume`, et `alembic`.
- L'accès à un client `psql` pour vérifier l'état de la base de données temporaire est un plus.

## 5. Conseils pour l'Agent DEV

- La clé de cette story est la **sécurité** et l'**isolement**. Ne prenez aucun risque avec la stack de développement par défaut.
- Documentez chaque étape, notamment le nom du volume temporaire créé et supprimé.
- Le but final est uniquement de produire les fichiers de migration. Le reste n'est qu'un moyen d'y parvenir de manière sûre.

---

## Dev Agent Record

### Agent Model Used
- claude-sonnet-4-5-20250929

### Completion Notes

✅ **All phases completed successfully:**

**Phase 1: Isolated Environment Creation**
- Created backup: `docker-compose.yml.backup2`
- Modified docker-compose.yml with _temp suffixes for all services, networks, and volumes
- Started temporary stack successfully on isolated ports (5433, 6380, 8001, 4445)

**Phase 2: Migration Generation**
- Generated migration file: `f93987027864_add_email_logs_table_and_relationships.py`
- Migration creates email_logs table with all required fields and indexes
- **CRITICAL FIX**: Removed auto-generated `op.drop_constraint('uq_users_email')` line that would have incorrectly dropped the unique constraint on users.email
- This was caused by a mismatch between the model (unique=False) and the database (unique constraint exists)

**Phase 3: Clean Installation Validation**
- Stopped temporary stack and removed volume `recyclic_postgres_data_temp`
- Restarted stack with `--build` flag for fresh installation
- Verified API health endpoint returned 200 OK
- Confirmed all 24 tables created including new `email_logs` table
- Verified `uq_users_email` unique constraint preserved correctly

**Phase 4: Final Cleanup**
- Stopped and removed all temporary containers and network
- Removed temporary volume `recyclic_postgres_data_temp`
- Deleted modified docker-compose.yml
- Restored original from backup2
- Cleaned up temporary directories

### File List
- `api/migrations/versions/f93987027864_add_email_logs_table_and_relationships.py` (NEW)

### Change Log
- 2025-10-23: Generated and validated email_logs migration in isolated environment
- 2025-10-23: Fixed migration to preserve users.email unique constraint

### Debug Log
No critical issues encountered. The only notable item was the auto-detection of the uq_users_email constraint drop, which was manually removed from the migration file as it should be preserved.
