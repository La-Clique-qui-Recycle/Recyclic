# Story (Fonctionnalité): Export Manuel de la Base de Données

**ID:** STORY-B11-P2
**Titre:** Export Manuel de la Base de Données depuis l'Interface SuperAdmin
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** un bouton dans le panneau d'administration pour pouvoir déclencher un export de la base de données à la demande,  
**Afin de** pouvoir récupérer un snapshot de la base de données pour des besoins de débogage, de migration ou d'archivage ponctuel.

## Contexte

Cette fonctionnalité offre une flexibilité supplémentaire en complément des sauvegardes automatisées. Elle permet d'obtenir une copie de la base de données à un instant T, directement depuis l'interface utilisateur.

## Critères d'Acceptation

### Partie Backend

1.  Un nouvel endpoint API `POST /api/v1/admin/db/export` est créé.
2.  Cet endpoint est protégé et accessible uniquement par les utilisateurs ayant le rôle `SUPER_ADMIN`.
3.  Lorsqu'il est appelé, cet endpoint déclenche un script qui utilise `pg_dump` pour créer un export de la base de données, puis retourne ce fichier en réponse, prêt à être téléchargé.

### Partie Frontend

4.  Dans une page du panneau d'administration réservée aux SuperAdmins (ex: une nouvelle page "Maintenance" ou la page de santé du système), un bouton "Exporter la base de données" est ajouté.
5.  Un clic sur ce bouton appelle l'endpoint `POST /api/v1/admin/db/export` et déclenche le téléchargement du fichier de sauvegarde dans le navigateur de l'utilisateur.
6.  Un message d'avertissement est affiché à côté du bouton pour indiquer que cette opération peut être longue et consommer des ressources.

## Notes Techniques

-   **Sécurité :** L'accès à cet endpoint doit être très strictement contrôlé.
-   **Performance :** Pour les bases de données volumineuses, la génération de l'export peut être longue. L'appel API doit gérer un timeout suffisamment long. Idéalement, l'API pourrait retourner une réponse immédiate avec un ID de tâche, et un autre endpoint permettrait de vérifier le statut et de télécharger le fichier une fois prêt (approche asynchrone).

## Definition of Done

- [ ] L'endpoint d'export est fonctionnel et sécurisé.
- [ ] Le bouton dans l'interface SuperAdmin déclenche bien le téléchargement.
- [ ] La story a été validée par le Product Owner.
