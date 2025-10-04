# UI/UX Specification: Réorganisation du Layout de Saisie de Ticket (Version 2.0 - "Kiosk Mode")

**Version:** 2.0
**Date:** 2025-10-01
**Auteur:** Sally (UX Expert) & User
**Story de Référence:** `story-b09-p1-ux-optimisation-saisie-ticket.md`

---

## 1. Problème à Résoudre

L'interface actuelle souffre de multiples problèmes de layout : perte d'espace vertical à cause du header principal, scroll nécessaire pour accéder aux contrôles, mauvaise gestion de l'espace dans les colonnes, et un comportement de panneau rétractable buggé. L'objectif est de refondre entièrement l'interface pour une expérience "plein écran" de type kiosque, sans aucun scroll.

---

## 2. Solution de Layout : Le "Kiosk Mode"

L'interface passe en mode "plein écran" dès l'entrée dans la saisie de ticket. Le header principal de l'application est supprimé.

### 2.1. Nouveau Header de Session

- **Position :** Collé en haut de la fenêtre.
- **Composition :** Une barre fine et compacte contenant :
    - À gauche : Le numéro du ticket (ex: "Ticket #3a631d62") et un bouton "Retour".
    - À droite : Le bouton d'action principal "Clôturer le ticket".

### 2.2. Structure Principale : 2 Colonnes Fixes + 1 Panneau Superposé

L'espace sous le nouveau header est divisé en deux colonnes principales visibles en permanence. La troisième colonne (le ticket) s'affiche par-dessus.

- **Colonne de Gauche (Largeur fixe : ~300px) : Sélection de la Catégorie**
    - **Contenu :** La grille des boutons de catégories. La largeur fixe garantit que le texte ne déborde plus.

- **Colonne Centrale (Largeur flexible) : Zone de Saisie Active**
    - **Rôle :** Le point focal de l'interaction, optimisé pour un gain de place vertical.
    - **Layout Interne :**
        - **Partie Droite de la Colonne :** Conçue comme une calculatrice. Un grand champ d'affichage pour le **Poids** est situé au-dessus du **Pavé numérique**.
        - **Partie Gauche de la Colonne :** Utilise l'espace libéré à côté du bloc "calculatrice". Contient, de haut en bas :
            1. Le menu déroulant **Destination**.
            2. Le champ **Notes** (redimensionnable verticalement par l'utilisateur).
            3. Le bouton de validation **"Ajouter l'objet"**.
    - **Alignement :** La hauteur totale du bloc de gauche (Destination, Notes, Bouton) doit être égale à celle du bloc de droite (Afficheur Poids, Pavé Numérique).

- **Panneau Latéral Droit (Superposé) : Le Ticket en Cours**
    - **Comportement :** Ce panneau est un "Overlay" ou "Drawer". Il n'est pas visible par défaut.
    - **Déclencheur :** Un bouton/onglet vertical est fixé sur le bord droit de l'écran (ex: "Voir le Ticket (3)").
    - **Action d'Ouverture :** Au clic, le panneau glisse depuis la droite et se superpose par-dessus la colonne centrale. Le reste de l'interface peut être légèrement assombri pour focaliser l'attention.
    - **Contenu :** La liste des objets déjà ajoutés, avec les options "Modifier"/"Supprimer".
    - **Action de Fermeture :** Un clic sur une icône "X" dans le panneau ou en dehors du panneau le fait disparaître.

---

## 3. Instructions pour le Développement

1.  **Supprimer le Header Principal :** Dans la vue de saisie de ticket, ne pas rendre le header de l'application.
2.  **Implémenter le Nouveau Header de Session :** Créer la nouvelle barre de navigation supérieure, fine et compacte.
3.  **Construire le Layout Principal :** Utiliser une grille à 2 colonnes (Gauche et Centre). La colonne de gauche doit avoir une largeur fixe.
4.  **Optimiser la Colonne Centrale :** Réorganiser les composants de saisie pour suivre le layout "calculatrice + contrôles à gauche" décrit ci-dessus. Assurer l'alignement vertical des deux blocs.
5.  **Implémenter le Panneau "Overlay" :** Développer le panneau du ticket en cours comme un "Drawer" qui s'affiche par-dessus l'interface. Il ne doit plus "pousser" le layout.
6.  **Vérifier la Responsivité :** S'assurer que ce nouveau layout reste fonctionnel et s'adapte proprement sur différentes tailles d'écrans, en particulier la transition vers une vue mobile si nécessaire.
