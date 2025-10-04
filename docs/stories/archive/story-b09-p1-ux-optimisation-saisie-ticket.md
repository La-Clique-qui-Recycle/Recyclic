# Story (UX Design): Optimisation de l'Interface de Saisie de Ticket pour une Expérience Plein Écran

**ID:** STORY-B09-P1
**Titre:** Optimisation de l'Interface de Saisie de Ticket pour une Expérience Plein Écran
**Epic:** Module de Réception
**Priorité:** P1 (Élevée)

---

## Objectif

**En tant qu'** Agent UX,  
**Je veux** optimiser le design de la page de saisie de ticket pour qu'elle tienne sur un seul écran sans scroll et qu'elle offre une expérience immersive de type "kiosque",  
**Afin de** maximiser l'efficacité et le confort de l'utilisateur lors de la saisie.

## Contexte

Le layout actuel en 3 colonnes est une bonne base, mais l'interface souffre encore de problèmes d'espace (scroll nécessaire) et de distractions (menu principal visible). Cette story vise à finaliser le design pour qu'il soit parfaitement adapté à un usage sur tablette et desktop, en se concentrant sur l'optimisation de l'espace.

## Critères d'Acceptation

1.  Une nouvelle proposition de design (wireframe ou spécification détaillée) est fournie pour la page de saisie de ticket.
2.  **Expérience Plein Écran :** Le design doit inclure la suppression du header/menu de navigation principal une fois que l'utilisateur est dans l'interface de saisie. Un bouton discret "Quitter la session" doit être le seul moyen de sortir de cette vue.
3.  **Optimisation de l'Espace :** Le nouveau design doit permettre à tous les contrôles essentiels (catégories, zone de saisie, pavé numérique, ticket en cours) d'être visibles sans scroll sur une résolution de tablette standard (ex: 1024x768).
4.  **Responsivité Fine :** La spécification doit décrire comment les éléments (y compris la taille des polices et des boutons du pavé numérique) se redimensionnent de manière fluide pour s'adapter à différentes tailles d'écran, du format tablette au grand écran de bureau.

## Pistes de Réflexion pour l'Agent UX

-   **Header de Session :** Remplacer le header principal par un bandeau de session plus fin, contenant uniquement les informations essentielles (nom de l'opérateur, ID du ticket) et le bouton "Quitter".
-   **Dimensionnement Relatif :** Utiliser des unités relatives (%, vw, vh) pour le dimensionnement des colonnes et des polices afin d'assurer une mise à l'échelle harmonieuse.
-   **Pavé Numérique Adaptatif :** Les touches du pavé numérique pourraient-elles légèrement réduire leur taille sur des écrans plus petits pour préserver l'espace ?

## Livrables Attendus

-   Une mise à jour du document de spécifications `docs/frontend-spec/fix-reception-layout-saisie.md` avec les nouvelles règles de design, qui servira de base pour la story de développement.

## Definition of Done

- [ ] Une proposition de design optimisé a été fournie.
- [ ] La proposition inclut la gestion de l'expérience "plein écran" et la responsivité fine.
- [ ] La proposition a été validée par le Product Owner.
