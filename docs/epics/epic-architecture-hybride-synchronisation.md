# Epic: Architecture Hybride avec Synchronisation Offline

**ID:** EPIC-HYBRID-ARCHITECTURE
**Titre:** Architecture Hybride avec Synchronisation Offline
**Statut:** Défini
**Priorité:** Basse

---

## 1. Objectif de l'Epic

Faire évoluer l'application vers une architecture hybride robuste, composée d'un serveur central (source de vérité) et de serveurs locaux (en boutique) capables de fonctionner de manière autonome (offline) et de se synchroniser automatiquement avec le serveur central dès qu'une connexion internet est disponible.

## 2. Description

Cette évolution architecturale majeure vise à garantir la continuité de service pour les opérations critiques en boutique (réception, caisse) tout en centralisant les données pour le reporting, l'administration et l'analyse. L'application sera configurable pour fonctionner en mode `central` ou `local` à partir d'une seule et même base de code.

## 3. Stories de l'Epic

Cet epic est composé des 4 stories suivantes :

1.  **Story 1 (Architecture & Design) :** Conception de la Stratégie de Synchronisation et de Résolution de Conflits.
2.  **Story 2 (Backend) :** Implémentation des Endpoints de Synchronisation sur le Serveur Central.
3.  **Story 3 (Local Server / Sync Agent) :** Développement du Service de Synchronisation sur le Serveur Local.
4.  **Story 4 (Tests) :** Création d'une Suite de Tests d'Intégration pour la Synchronisation Offline.

## 4. Risques et Plan de Rollback

- **Risque Principal :** Perte ou corruption de données lors de la synchronisation, ou gestion incorrecte des conflits. C'est le risque le plus élevé du projet.
- **Mitigation :** Conception architecturale détaillée (Story 1) et suite de tests exhaustive (Story 4) pour couvrir tous les scénarios de déconnexion, reconnexion et conflits.
- **Plan de Rollback :** La fonctionnalité sera activée par une variable de configuration. En cas de problème, elle pourra être désactivée pour revenir au fonctionnement centralisé simple.

## 5. Definition of Done (pour l'Epic)

- [ ] Les 4 stories sont terminées et validées.
- [ ] Une instance de l'application peut être configurée en mode `local` et se synchroniser avec une instance en mode `central`.
- [ ] Les données collectées en mode offline sont correctement transmises au serveur central.
