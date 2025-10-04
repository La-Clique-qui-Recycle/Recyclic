# Epic: Refonte Complète du Workflow de Caisse V2

**ID:** EPIC-CAISSE-V2
**Titre:** Refonte Complète du Workflow de Caisse V2
**Statut:** Défini
**Priorité:** P1 (Critique)

---

## 1. Objectif de l'Epic

Refondre intégralement le module de Caisse pour l'aligner sur le workflow métier final en 6 étapes (Catégorie → Sous-catégorie → Quantité → Poids → Prix → Ticket). L'objectif est de créer une expérience de saisie guidée, rapide et ergonomique, tout en garantissant la précision des données collectées et en réutilisant les standards visuels et techniques du module de Réception.

## 2. Description

Le workflow de caisse actuel est obsolète. Cette refonte complète le remplace par un assistant en plusieurs étapes, introduit la gestion des sous-catégories et des prix par plage, et corrige la logique de saisie du poids et de la quantité. L'architecture de la page s'inspirera fortement du module de Réception pour la cohérence visuelle et technique (layout, responsive, composants).

## 3. Stories de l'Epic

Cet epic est composé des 5 stories suivantes, qui doivent être exécutées dans l'ordre :

1.  **Story 1 (Fondations - Backend) :** Évolution du Modèle de Catégories pour les Prix et les Images.
2.  **Story 2 (Fondations - Frontend) :** Mise à Jour de l'Administration des Catégories.
3.  **Story 3 (Workflow - Frontend) :** Implémentation de l'Assistant de Saisie de la Caisse.
4.  **Story 4 (Workflow - Frontend) :** Implémentation de la Page Principale avec Ticket Global.
5.  **Story 5 (Finalisation - Backend) :** Logique de Finalisation du Ticket de Vente.

## 4. Risques et Plan de Rollback

- **Risque Principal :** Complexité de l'état de l'assistant de saisie frontend. La gestion de la navigation entre les 6 étapes doit être robuste.
- **Mitigation :** Utilisation d'un gestionnaire d'état (comme Zustand) pour le workflow de la caisse, et développement de tests unitaires pour chaque étape.

## 5. Definition of Done (pour l'Epic)

- [ ] Les 5 stories sont terminées et validées.
- [ ] Un utilisateur peut compléter le nouveau workflow de vente de bout en bout.
- [ ] L'interface est cohérente avec le module de Réception.
