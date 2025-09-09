# Component Library / Design System

**Design System Approach:** Système simple et cohérent, components tactile-first

## Core Components

### Bouton Mode (Catégorie/Quantité/Prix)
**Purpose:** Navigation principale entre les 3 modes de saisie
**Variants:** Actif (coloré + bordure), Inactif (gris), Disabled
**States:** Default, Hover, Active, Pressed
**Usage:** Largeur 33%, hauteur minimum 80px, texte 18px+

### Bouton Catégorie EEE
**Purpose:** Sélection des 8 catégories Ecologic
**Variants:** EEE-1 à EEE-8 avec couleurs distinctes
**States:** Default, Selected, Hover
**Usage:** Grid 2x4, icônes + labels courts, sous-catégories déroulantes

### Pavé Numérique
**Purpose:** Saisie quantité/prix optimisée tactile
**Variants:** Standard, Avec virgule décimale
**States:** Chiffres actifs, Backspace, Validation
**Usage:** Grandes touches (60px min), feedback haptic si disponible

### Ticket Temps Réel
**Purpose:** Affichage dynamique de la vente en cours
**Variants:** Ligne standard, Ligne modifiable, Total
**States:** Normal, Edition, Validé
**Usage:** Colonne fixe droite, scroll si nécessaire
