# Epic: Refonte du Workflow de Caisse

**ID:** EPIC-REVENTE-CAISSE
**Titre:** Refonte du Workflow de Caisse
**Statut:** Défini
**Priorité:** P1 (Critique)

---

## 1. Objectif de l'Epic

Corriger et améliorer en profondeur le workflow de saisie de la caisse pour qu'il corresponde à la logique métier réelle de la ressourcerie. Cela inclut la correction de la sémantique (Quantité -> Poids), la résolution de bugs bloquants, et l'amélioration de l'ergonomie de l'interface.

## 2. Description

Le module de caisse actuel a été développé sur des spécifications obsolètes. Il traite la "quantité" comme un nombre d'articles et la lie au prix, ce qui est incorrect. De plus, plusieurs fonctionnalités clés sont cassées (finalisation de la vente, fermeture de session) et l'ergonomie est à revoir. Cet epic vise à rendre le module de caisse pleinement fonctionnel et conforme au besoin métier.

## 3. Stories de l'Epic

Cet epic est composé des 3 stories suivantes :

1.  **Story 1 (Logique Métier) :** Refonte de l'Étape "Quantité" en "Poids" et Découplage du Prix.
2.  **Story 2 (Bugs) :** Correction des Fonctionnalités de Finalisation et de Fermeture de Session.
3.  **Story 3 (UI) :** Amélioration de l'Interface de Vente.

## 4. Risques et Plan de Rollback

- **Risque Principal :** Le refactoring de la logique de saisie pourrait introduire de nouveaux bugs.
- **Mitigation :** Des tests manuels complets du workflow de vente seront nécessaires après chaque story.

## 5. Definition of Done (pour l'Epic)

- [ ] Les 3 stories sont terminées et validées.
- [ ] Un utilisateur peut enregistrer une vente complète avec un poids et un prix découplés.
- [ ] La finalisation et la fermeture de session sont fonctionnelles.
