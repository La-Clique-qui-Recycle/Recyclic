# Note de Synthèse pour BMad Master

**Date:** 2025-09-18
**Auteur:** Bob (Scrum Master)
**Destinataire:** BMad Master (en tant que PM & Architecte)

**Objet : Mise à jour des documents de référence (PRD, Architecture) suite aux récents ajustements de projet.**

---

### Contexte

Au cours des dernières sessions de développement et de gestion de backlog, nous avons effectué plusieurs corrections et un pivot stratégique majeur. Il est maintenant crucial de répercuter ces changements dans la documentation de haut niveau pour garantir que le PRD et les documents d'architecture reflètent l'état réel et la direction actuelle du projet.

### 1. Pivot Stratégique : Abandon de la Synchronisation kDrive

-   **Décision :** Nous avons abandonné l'implémentation de la synchronisation cloud avec Infomaniak kDrive (prévue dans la Story 4.2 originale).
-   **Raison :** La fonctionnalité WebDAV requise pour notre implémentation nécessite un abonnement payant, ce qui va à l'encontre de nos contraintes de maintenir le projet sur des services gratuits.
-   **Nouvelle Solution :** La fonctionnalité a été remplacée par un système de génération de rapports CSV envoyés par email et téléchargeables depuis l'interface d'administration.

**Action Requise pour BMad Master :**
-   **Mettre à jour le PRD :** Supprimer ou amender la section sur la synchronisation kDrive (FR8) et la remplacer par les nouvelles exigences de génération/envoi/téléchargement de rapports.
-   **Mettre à jour l'Architecture :** Retirer toute mention d'une intégration WebDAV et la remplacer par le nouveau workflow basé sur le service d'email.

### 2. Clarification de la Nomenclature des Epics et Stories

-   **Problème Identifié :** Il y avait une incohérence majeure entre la numérotation des Epics dans le PRD et les noms des fichiers de story. L'Epic 2 (IA & Classification) avait été implémenté avec des stories numérotées 4.x.
-   **Action Corrective :** Nous avons procédé à un grand nettoyage. Les fichiers de story ont été renommés pour correspondre à leur véritable Epic (ex: `story-4.1-commande-depot-vocal.md` est maintenant `story-2.1-commande-depot-vocal.md`).

**Action Requise pour BMad Master :**
-   **Vérifier la cohérence du PRD :** S'assurer que la description des stories dans les Epics 2 et 4 du PRD correspond bien aux stories qui ont été réellement implémentées et qui sont maintenant correctement nommées dans `docs/stories/`.

### 3. Ajout de Fonctionnalités Émergentes

-   **Historique des Statuts Utilisateur :** Suite à une discussion, nous avons décidé d'enrichir la gestion des utilisateurs en ajoutant une traçabilité complète de leurs changements de statut (actif/inactif). Une nouvelle table `user_status_history` a été créée (Story 5.4.1).
-   **Historique d'Activité Complet :** La vision UX a évolué pour inclure un onglet "Historique" complet, agrégeant toutes les actions d'un utilisateur. Un endpoint dédié a été créé pour cela (Story 5.4.2).

**Action Requise pour BMad Master :**
-   **Mettre à jour le PRD :** Ajouter ces nouvelles exigences fonctionnelles (FR) dans la section `Requirements`.
-   **Mettre à jour l'Architecture :** Ajouter la nouvelle table `user_status_history` au schéma de la base de données et documenter le nouvel endpoint d'historique dans la spécification de l'API.

### 4. Documentation des Standards de Test

-   **Problème Identifié :** Les agents développeurs avaient des difficultés à lancer les tests car la procédure n'était pas clairement documentée.
-   **Action Corrective :** Nous avons stabilisé la suite de tests et créé deux guides de référence : `api/testing-guide.md` et `frontend/testing-guide.md`.

**Action Requise pour BMad Master :**
-   **Mettre à jour l'Architecture :** Dans la section sur la stratégie de test, ajouter des liens directs vers ces deux nouveaux guides pour qu'ils deviennent la référence officielle pour tous les futurs développements.

---

Merci de prendre en charge cette importante mise à jour pour garantir que notre documentation reste notre source de vérité.
