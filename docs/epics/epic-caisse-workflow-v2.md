# Epic: Évolution du Workflow de Vente en Caisse

**ID:** EPIC-CAISSE-WORKFLOW-V2
**Titre:** Évolution du Workflow de Vente en Caisse
**Statut:** Défini
**Priorité:** P1 (Critique)

---

## 1. Objectif de l'Epic

Faire évoluer en profondeur le workflow de la caisse pour qu'il soit plus guidé, plus flexible et qu'il intègre de nouvelles fonctionnalités métier comme la gestion de la quantité, les pesées multiples, les dons et le rendu de monnaie. L'objectif est de fournir une expérience utilisateur robuste et complète pour les caissiers.

## 2. Description

Suite à la refonte initiale, ce nouvel epic vise à construire un workflow de caisse de deuxième génération. Il introduit un assistant de saisie pas-à-pas (catégorie, quantité, poids, prix), une gestion plus fine du poids (pesées multiples), et un écran de finalisation de vente enrichi (dons, moyens de paiement, rendu de monnaie). Cela permettra de couvrir l'ensemble des cas d'usage réels de la ressourcerie.

## 3. Stories de l'Epic

Cet epic est composé de 3 stories séquentielles :

1.  **Story 1 (Frontend) :** Refonte du Wizard de Saisie d'Article.
2.  **Story 2 (Frontend) :** Implémentation de l'Écran de Finalisation de Vente.
3.  **Story 3 (Backend) :** Évolution de l'API pour le Nouveau Workflow de Vente.

## 4. Definition of Done (pour l'Epic)

- [ ] Les 3 stories sont terminées et validées.
- [ ] Un caissier peut enregistrer une vente complète en utilisant le nouvel assistant, y compris avec des pesées multiples.
- [ ] Un caissier peut finaliser une vente en ajoutant un don et en gérant le rendu de monnaie pour les paiements en espèces.
- [ ] Toutes les nouvelles données (quantité, don, moyen de paiement) sont correctement sauvegardées en base de données.