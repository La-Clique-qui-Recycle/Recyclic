# Story (Bug): Correction du Bug de la Page Blanche au Scroll sur le Dashboard de Réception

**ID:** STORY-B07-P1
**Titre:** Correction du Bug de la Page Blanche au Scroll sur le Dashboard de Réception
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant qu'** administrateur,  
**Je veux** pouvoir scroller sur toute la page du tableau de bord des réceptions sans qu'elle ne devienne blanche,  
**Afin de** pouvoir consulter toutes les statistiques et graphiques sans être interrompu par un bug d'affichage.

## Contexte

Sur la page `/admin/reception-stats`, lorsque l'on scrolle vers le bas sur un grand écran, la page devient entièrement blanche. Ce bug ne se produit pas sur des écrans de taille tablette ou mobile et ne génère aucune erreur dans la console du navigateur.

**Impact :** Ce bug rend une partie du tableau de bord inaccessible sur les écrans de bureau, ce qui est critique pour l'analyse des données.

**Hypothèse Technique :** Le bug est probablement causé par une "Error Boundary" de React qui attrape une erreur de rendu "silencieuse" dans un composant qui n'est affiché que sur les grands écrans (probablement un des graphiques `recharts`).

## Critères d'Acceptation

1.  L'utilisateur peut scroller de haut en bas sur la page `/admin/reception-stats` sur un grand écran (desktop) sans que la page ne devienne blanche.
2.  Tous les composants de la page (KPIs, graphiques, etc.) restent visibles et fonctionnels pendant et après le scroll.

## Notes Techniques

-   **Fichier à investiguer :** `frontend/src/pages/Admin/ReceptionDashboard.tsx`.
-   **Pistes de correction :**
    1.  Identifier le composant qui cause l'erreur. Il s'agit probablement d'un des graphiques (`BarChart` ou `PieChart`) de la bibliothèque `recharts`.
    2.  Vérifier les données passées à ce composant. L'erreur peut être due à un format de données inattendu ou à un bug dans la bibliothèque `recharts` elle-même lorsqu'elle est rendue dans certaines conditions.
    3.  Pour faciliter le débogage, l'agent DEV peut envelopper chaque graphique dans sa propre `Error Boundary` avec un message d'erreur spécifique (ex: "Erreur dans le graphique des catégories"). Cela permettra d'identifier précisément quel composant plante.

## Definition of Done

- [ ] Le bug de la page blanche est corrigé.
- [ ] La page est scrollable en entier sur grand écran.
- [ ] La story a été validée par le Product Owner.
