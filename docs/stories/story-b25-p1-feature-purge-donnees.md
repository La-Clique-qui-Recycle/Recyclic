# Story (Fonctionnalité): Purge Sécurisée des Données Transactionnelles

**ID:** STORY-B25-P1
**Titre:** Purge Sécurisée des Données Transactionnelles
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** un outil pour effacer de manière sécurisée toutes les données transactionnelles (ventes, réceptions),  
**Afin de** pouvoir réinitialiser l'application avant sa mise en production officielle, après la phase de tests.

## Contexte

Cette fonctionnalité est une opération de maintenance critique et dangereuse, à n'utiliser qu'une seule fois avant le lancement. Elle doit être protégée par de multiples garde-fous pour éviter toute suppression accidentelle.

## Critères d'Acceptation

### 1. Backend

-   Un nouvel endpoint API `POST /api/v1/admin/db/purge-transactions` est créé.
-   Cet endpoint est protégé et accessible **uniquement** par les utilisateurs ayant le rôle `SUPER_ADMIN`.
-   La logique de cet endpoint exécute une suppression (`TRUNCATE` ou `DELETE`) des données des tables suivantes (et de toutes les tables liées) :
    -   `sales`
    -   `sale_items`
    -   `cash_sessions`
    -   `reception_tickets`
    -   `reception_lines`
-   La logique **NE DOIT PAS** toucher aux tables de configuration : `users`, `sites`, `categories`, `cash_registers`.
-   L'opération complète doit être effectuée dans une seule transaction de base de données.

### 2. Frontend

-   Dans une nouvelle page `/admin/settings` (sous-menu "Base de Données"), un bouton "Purger les données transactionnelles" est ajouté, dans une section clairement marquée comme "Zone de Danger".
-   Un clic sur ce bouton déclenche le **workflow de confirmation en 3 étapes** :
    1.  **Popup 1 :** Affiche un message "Êtes-vous sûr de vouloir supprimer toutes les données de ventes et de réceptions ? Cette action est irréversible." avec les boutons "Oui, je suis sûr" et "Annuler".
    2.  **Popup 2 (si "Oui") :** Affiche un message "Vraiment sûr(e) ? Toutes les transactions seront définitivement perdues." avec les boutons "Oui, je confirme" et "Annuler".
    3.  **Popup 3 (si "Oui") :** Affiche un champ de texte avec l'instruction "Pour confirmer, veuillez recopier exactement la phrase suivante : Adieu la base". Le bouton de confirmation final est désactivé tant que la phrase n'est pas correctement saisie.
-   Ce n'est qu'après la réussite de ces 3 étapes que l'appel à l'API `POST /api/v1/admin/db/purge-transactions` est effectué.

## Notes Techniques

-   **Sécurité :** C'est la story la plus critique en termes de sécurité. La validation du rôle `SUPER_ADMIN` côté backend est impérative.
-   **Interface :** Utiliser des modales de confirmation de la bibliothèque UI (ex: Mantine) pour le workflow de validation.

## Definition of Done

- [ ] L'endpoint de purge est fonctionnel, sécurisé, et ne supprime que les bonnes tables.
- [ ] Le workflow de confirmation en 3 étapes est implémenté à l'identique.
- [ ] La story a été validée par le Product Owner.
