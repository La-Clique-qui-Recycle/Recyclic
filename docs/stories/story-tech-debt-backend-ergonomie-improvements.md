# Story (Dette Technique): Améliorations Backend et Ergonomie

**ID:** STORY-TECH-DEBT-BACKEND-ERGONOMIE-IMPROVEMENTS
**Titre:** Améliorations Backend (Export) et Ergonomie (Saisie)
**Epic:** Maintenance & Dette Technique
**Priorité:** P4 (Basse)

---

## Objectif

**En tant que** Développeur,  
**Je veux** implémenter des améliorations de performance pour l'export CSV et de robustesse pour la saisie numérique,  
**Afin de** rendre l'application plus performante et plus agréable à utiliser.

## Contexte

Cette story regroupe deux recommandations issues des revues QA des lots B05 et B08 : l'une concerne l'optimisation de l'export de gros volumes de données, l'autre la finalisation de l'ergonomie du pavé numérique.

## Critères d'Acceptation

1.  **Export CSV pour Gros Volumes (`b05-p3`) :**
    -   L'endpoint d'export CSV est étudié pour déterminer si une optimisation est nécessaire pour les très gros volumes de données.
    -   Si nécessaire, une solution de "streaming" est implémentée côté serveur pour que le fichier soit généré et envoyé sans consommer une grande quantité de mémoire, évitant ainsi de bloquer le serveur ou le navigateur.

2.  **Gestion des Touches Non Supportées (`b08-p2`) :**
    -   Le composant du pavé numérique est amélioré pour ignorer ou bloquer explicitement les touches non numériques (lettres, symboles) sur un clavier physique.
    -   Le comportement est documenté dans le code du composant.

## Notes Techniques

-   **Streaming CSV :** Pour FastAPI, cela peut être implémenté en utilisant une `StreamingResponse` qui génère les lignes du CSV à la volée.
-   **Gestion du clavier :** L'événement `onKeyDown` du composant de saisie peut être utilisé pour filtrer les touches non désirées (`event.preventDefault()`).

## Definition of Done

- [ ] L'export CSV est optimisé pour les gros volumes (si jugé nécessaire après analyse).
- [ ] La saisie au clavier sur le pavé numérique est plus robuste.
- [ ] La story a été validée par le Product Owner.
