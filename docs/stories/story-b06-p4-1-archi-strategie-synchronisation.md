# Story (Architecture): Conception de la Stratégie de Synchronisation et de Résolution de Conflits

**ID:** STORY-B06-P4
**Titre:** Conception de la Stratégie de Synchronisation et de Résolution de Conflits
**Epic:** Architecture Hybride avec Synchronisation Offline
**Priorité:** Basse

---

## Objectif

**En tant qu'** Architecte,  
**Je veux** produire un document de design technique détaillé pour le mécanisme de synchronisation de données entre les serveurs locaux et le serveur central,  
**Afin de** fournir une base solide et sans ambiguïté pour le développement de cette fonctionnalité critique et de minimiser les risques de perte ou de corruption de données.

## Contexte

Cette story est le prérequis indispensable à tout développement de l'architecture hybride. Elle doit définir précisément le fonctionnement de la synchronisation, la gestion des données et la résolution des conflits.

## Critères d'Acceptation

1.  Un document de design technique est produit (`docs/architecture/hybrid-sync-design.md`).
2.  Ce document définit précisément les points suivants :
    -   **Le Modèle de Données :** Les modifications de schéma nécessaires pour supporter la synchronisation (ex: ajout de `last_sync_at`, `is_synced`, utilisation d'UUIDs pour les clés primaires).
    -   **La Stratégie de Résolution de Conflits :** Définir la règle à appliquer en cas de conflit (ex: "Last Write Wins" - la dernière écriture gagne, ou une stratégie plus complexe). La stratégie doit être simple et robuste.
    -   **Le Protocole de Communication :** Le format des données échangées entre le serveur local et le serveur central. Utiliser des DTOs (Data Transfer Objects) spécifiques pour la synchronisation.
    -   **Les Endpoints API :** La spécification détaillée des nouveaux endpoints sur le serveur central pour recevoir les données (ex: `POST /api/v1/sync/push`).
    -   **La Logique du Sync Agent :** Le fonctionnement du service de synchronisation sur le serveur local (détection des changements, mise en file d'attente, gestion des tentatives et des échecs).
    -   **La Configuration :** La liste des variables d'environnement nécessaires (`APP_MODE`, `CENTRAL_API_URL`, etc.).

## Notes Techniques

-   **Simplicité :** La première version de cette architecture doit privilégier la simplicité et la robustesse. La synchronisation sera unidirectionnelle dans un premier temps (local -> central).
-   **Sécurité :** Le protocole de communication doit être sécurisé (ex: authentification par clé d'API pour les serveurs locaux).

## Definition of Done

- [ ] Le document de design technique est complet et validé.
- [ ] Il couvre tous les points listés dans les critères d'acceptation.
- [ ] La story a été validée par le Product Owner.
