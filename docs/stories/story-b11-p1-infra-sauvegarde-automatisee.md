# Story (Infrastructure): Stratégie de Sauvegarde Automatisée et Externalisée

**ID:** STORY-B11-P1
**Titre:** Stratégie de Sauvegarde Automatisée et Externalisée de la Base de Données
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** DevOps / Administrateur Système,  
**Je veux** mettre en place un système de sauvegarde nocturne, automatisé et externalisé pour la base de données PostgreSQL,  
**Afin de** garantir la sécurité des données et de pouvoir restaurer le service en cas d'incident majeur (panne de disque, corruption de données, etc.).

## Contexte

La sécurité des données est primordiale. Cette story met en place une stratégie de sauvegarde robuste pour la base de données du serveur central, conformément aux meilleures pratiques de l'industrie.

## Critères d'Acceptation

1.  Un script de sauvegarde (`/scripts/backup.sh`) est créé. Ce script utilise `pg_dump` pour créer un export compressé de la base de données de production.
2.  Une tâche planifiée (`cron job`) est configurée sur le serveur de production pour exécuter ce script tous les jours à une heure de faible trafic (ex: 2h du matin).
3.  Après sa création, le fichier de sauvegarde est envoyé vers un service de stockage externe sécurisé (ex: S3, Google Cloud Storage, ou un serveur SFTP). Les identifiants pour ce stockage sont gérés via des secrets.
4.  Une politique de rétention est implémentée : le script supprime les sauvegardes les plus anciennes sur le stockage externe pour ne conserver, par exemple, que les 7 dernières sauvegardes quotidiennes.
5.  La procédure de restauration à partir d'une sauvegarde est documentée dans un fichier `docs/runbooks/database-restore.md`.

## Notes Techniques

-   **Sécurité :** Le script doit gérer les mots de passe et les clés d'API de manière sécurisée (ex: via des variables d'environnement ou un gestionnaire de secrets).
-   **Monitoring :** Le script doit logger son succès ou son échec. Idéalement, il envoie une notification en cas d'échec de la sauvegarde.

## Definition of Done

- [ ] Le script de sauvegarde est créé et fonctionnel.
- [ ] La tâche planifiée est configurée et s'exécute correctement.
- [ ] Les sauvegardes sont bien envoyées vers un stockage externe.
- [ ] La politique de rétention est fonctionnelle.
- [ ] La procédure de restauration est documentée.
- [ ] La story a été validée par le Product Owner.
