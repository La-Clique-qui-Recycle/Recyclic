# Recyclic UI/UX Specification

**Author:** Sally (UX Expert)  
**Date:** 2025-09-09  
**Version:** 1.0  
**Status:** Ready for Development

---

## Introduction

Cette spécification définit l'expérience utilisateur, l'architecture d'information, les flux utilisateur et les spécifications de design visuel pour l'interface caisse de Recyclic. Elle sert de fondation pour le design visuel et le développement frontend, garantissant une expérience cohérente et centrée utilisateur.

## Overall UX Goals & Principles

### Target User Personas

**Opérateur de Terrain (Bénévole):**
- Âge : 35-65 ans, compétences numériques variables
- Contexte : Travail en flux, environnement parfois bruyant, tablette partagée
- Besoins : Rapidité (<15 sec/dépôt), simplicité absolue, pas de formation complexe

**Responsable Caisse:**
- Profil : Coordinateur/bénévole expérimenté
- Responsabilités : Sessions, contrôles, validation admin
- Besoins : Sécurité, rapprochement caisse, gestion erreurs

### Usability Goals

- **Facilité d'apprentissage :** Opérationnel en <10 minutes
- **Efficacité d'usage :** Vente en <5 clics, workflow 3 modes fluide
- **Prévention d'erreurs :** Validation admin pour actions critiques
- **Mémorabilité :** Interface intuitive même usage sporadique

### Design Principles

1. **Clarté avant tout** - Gros boutons, textes lisibles, actions évidentes
2. **Workflow guidé** - 3 modes séquentiels avec retour possible
3. **Robustesse tactile** - Tablette first, compatible clavier/souris
4. **Feedback immédiat** - Réponse visuelle à chaque action
5. **Persistance totale** - Zéro perte de données

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-09 | 1.0 | Spécification initiale interface caisse | Sally (UX Expert) |

## Information Architecture (IA)

### Site Map / Screen Inventory

```mermaid
graph TD
    A[Session Fermée] --> B[Ouverture Session]
    B --> C[Interface Caisse Principale]
    C --> D[Mode Catégorie]
    C --> E[Mode Quantité]
    C --> F[Mode Prix]
    D --> E --> F
    F --> D
    C --> G[Ticket Temps Réel]
    C --> H[Fermeture Session]
    G --> I[Validation Vente]
    H --> J[Contrôle Caisse]
    C --> K[Admin Panel]
    K --> L[Déverrouillage Erreurs]
```

### Navigation Structure

**Navigation Principale :** Modes 3-boutons visuels (Catégorie/Quantité/Prix) avec état actif/inactif clair

**Navigation Secondaire :** Pavé numérique intégré, boutons retour/annulation

**Breadcrumb Strategy :** État de session visible en permanence (Opérateur, Heure ouverture, Total jour)

## User Flows

### Flow 1: Vente Standard (3 Modes Séquentiels)

**User Goal:** Enregistrer une vente rapidement avec classification EEE correcte

**Entry Points:** Interface caisse après ouverture session

**Success Criteria:** Vente enregistrée en <5 clics, ticket généré

#### Flow Diagram

```mermaid
graph TD
    A[Interface Caisse] --> B{Mode Auto-Follow?}
    B -->|Oui| C[Mode Catégorie Actif]
    B -->|Non| D[Sélection Mode Manuel]
    C --> E[Sélection EEE-1 à EEE-8]
    E --> F[Auto-passage Mode Quantité]
    F --> G[Saisie Quantité]
    G --> H[Auto-passage Mode Prix]
    H --> I[Saisie Prix Unitaire]
    I --> J[Ligne Ajoutée au Ticket]
    J --> K{Autre Article?}
    K -->|Oui| C
    K -->|Non| L[Validation Vente]
    L --> M[Sélection Paiement]
    M --> N[Ticket Final]
```

#### Edge Cases & Error Handling

- **Retour arrière :** Bouton Back disponible à chaque étape, sauvegarde automatique
- **Correction ligne :** Édition libre avant validation, admin requis après
- **Session timeout :** Sauvegarde locale, restauration automatique
- **Mode offline :** Indicateur rouge discret, sync différée

#### Notes

**Workflow flexible :** Auto-follow par défaut mais navigation libre autorisée. Timeout 15min avec sauvegarde draft.

### Flow 2: Ouverture/Fermeture Session

**User Goal:** Contrôler la caisse physique de façon fiable

**Entry Points:** Application au démarrage

**Success Criteria:** Session ouverte avec fond initial, fermeture avec rapprochement

#### Flow Diagram

```mermaid
graph TD
    A[App Démarrage] --> B[Sélection Opérateur]
    B --> C[Saisie Fond Caisse]
    C --> D[Interface Caisse Active]
    D --> E[... Ventes ...]
    E --> F[Fermeture Session]
    F --> G[Calcul Solde Théorique]
    G --> H[Saisie Décompte Réel]
    H --> I{Écart > Seuil?}
    I -->|Non| J[Fermeture OK]
    I -->|Oui| K[Commentaire Obligatoire]
    K --> L[Validation Admin]
    L --> J
```

## Key Screen Layouts

### Écran 1: Interface Caisse Principale

**Purpose:** Hub central pour toutes les ventes avec workflow 3 modes

**Key Elements:**
- 3 boutons modes (33% largeur chacun) avec état visuel clair
- Zone catégories EEE-1 à EEE-8 (couleurs + icônes)
- Pavé numérique intégré grande taille
- Colonne ticket temps réel (33% droite)
- Barre status session (opérateur, heure, total)

**Interaction Notes:** Touch-first, mais raccourcis clavier (Tab, flèches). Auto-follow paramétrable.

### Écran 2: Ouverture Session

**Purpose:** Initialisation sécurisée de la session de caisse

**Key Elements:**
- Sélection opérateur (dropdown large)
- Saisie fond caisse (pavé numérique proéminent)
- Pré-remplissage intelligent (historique/calendrier)
- Validation avec génération ticket ouverture

**Interaction Notes:** Focus automatique sur saisie fond, validation obligatoire.

### Écran 3: Validation Admin

**Purpose:** Déverrouillage sécurisé pour actions critiques

**Key Elements:**
- Saisie PIN/mot de passe
- Description claire de l'action à valider
- Boutons Autoriser/Annuler contrastés

**Interaction Notes:** Modal overlay, timeout auto si pas d'action.

## Component Library / Design System

**Design System Approach:** Système simple et cohérent, components tactile-first

### Core Components

#### Bouton Mode (Catégorie/Quantité/Prix)
**Purpose:** Navigation principale entre les 3 modes de saisie
**Variants:** Actif (coloré + bordure), Inactif (gris), Disabled
**States:** Default, Hover, Active, Pressed
**Usage:** Largeur 33%, hauteur minimum 80px, texte 18px+

#### Bouton Catégorie EEE
**Purpose:** Sélection des 8 catégories Ecologic
**Variants:** EEE-1 à EEE-8 avec couleurs distinctes
**States:** Default, Selected, Hover
**Usage:** Grid 2x4, icônes + labels courts, sous-catégories déroulantes

#### Pavé Numérique
**Purpose:** Saisie quantité/prix optimisée tactile
**Variants:** Standard, Avec virgule décimale
**States:** Chiffres actifs, Backspace, Validation
**Usage:** Grandes touches (60px min), feedback haptic si disponible

#### Ticket Temps Réel
**Purpose:** Affichage dynamique de la vente en cours
**Variants:** Ligne standard, Ligne modifiable, Total
**States:** Normal, Edition, Validé
**Usage:** Colonne fixe droite, scroll si nécessaire

## Branding & Style Guide

### Visual Identity
**Brand Guidelines:** Système de personnalisation par ressourcerie (logo, couleurs, nom)

### Color Palette

| Color Type | Hex Code | Usage |
|------------|----------|--------|
| Primary | #8B4513 | Boutons principaux, modes actifs |
| Secondary | #CD853F | Boutons secondaires, navigation |
| Accent | #DDA0DD | Éléments interactifs, focus |
| Success | #228B22 | Validations, confirmations |
| Warning | #FF8C00 | Alertes, seuils dépassés |
| Error | #DC143C | Erreurs, actions critiques |
| Neutral | #696969 | Textes, bordures, désactivé |

### Typography

#### Font Families
- **Primary:** System fonts (Segoe UI, SF Pro, Roboto)
- **Secondary:** Sans-serif fallback
- **Monospace:** Courier New (prix, quantités)

#### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 24px | Bold | 1.2 |
| H2 | 20px | Semi-bold | 1.3 |
| H3 | 18px | Medium | 1.4 |
| Body | 16px | Regular | 1.5 |
| Button | 18px | Medium | 1.2 |
| Small | 14px | Regular | 1.4 |

### Iconography
**Icon Library:** Feather Icons ou similaire (simple, cohérent)
**Usage Guidelines:** 24px minimum, contraste suffisant, labels texte accompagnant

### Spacing & Layout
**Grid System:** CSS Grid 12 colonnes responsive
**Spacing Scale:** 8px base (8, 16, 24, 32, 48, 64px)

## Accessibility Requirements

### Compliance Target
**Standard:** WCAG 2.1 AA (niveau praticable pour associations)

### Key Requirements

**Visual:**
- Color contrast ratios: 4.5:1 minimum pour texte
- Focus indicators: bordure 3px contrastée visible
- Text sizing: 16px minimum, zoom 200% supporté

**Interaction:**
- Keyboard navigation: Tab, flèches, Entrée, Échap
- Screen reader support: labels appropriés, rôles ARIA
- Touch targets: 44px minimum, espacés 8px+

**Content:**
- Alternative text: icônes avec labels texte
- Heading structure: hiérarchie logique H1-H3
- Form labels: explicites, liés aux champs

### Testing Strategy
Tests manuels focus clavier + lecteur d'écran basique (NVDA gratuit)

## Responsiveness Strategy

### Breakpoints

| Breakpoint | Min Width | Max Width | Target Devices |
|------------|-----------|-----------|----------------|
| Mobile | 320px | 767px | Smartphones (usage limité) |
| Tablet | 768px | 1023px | iPad, Android tablets (priorité) |
| Desktop | 1024px | 1439px | PC, Mac (usage occasionnel) |
| Wide | 1440px | - | Grands écrans (rare) |

### Adaptation Patterns

**Layout Changes:** Interface caisse optimisée 768px+, mobile en mode lecture seule

**Navigation Changes:** Modes 3-boutons horizontal tablette, vertical si nécessaire mobile

**Content Priority:** Ticket temps réel masquable sur petits écrans

**Interaction Changes:** Touch-first toujours, hover états pour souris disponible

## Animation & Micro-interactions

### Motion Principles
Animations subtiles et fonctionnelles uniquement. Pas de fioritures.

### Key Animations
- **Mode switching:** Transition fade 200ms ease-in-out
- **Button feedback:** Scale 0.95 pendant press (100ms)
- **Ticket updates:** Slide-in nouvelle ligne (300ms ease-out)
- **Error states:** Shake 300ms pour validation échouée

## Performance Considerations

### Performance Goals
- **Page Load:** <2 secondes sur connexion ADSL
- **Interaction Response:** <100ms pour actions locales
- **Animation FPS:** 60fps stable ou pas d'animation

### Design Strategies
PWA avec cache agressif, images optimisées, CSS/JS minifiés. Mode offline robuste.

## Next Steps

### Immediate Actions
1. Validation stakeholders (responsables ressourceries)
2. Création wireframes détaillés dans Figma/Sketch
3. Tests utilisabilité avec panel bénévoles
4. Handoff vers Design Architect pour spécifications techniques

### Design Handoff Checklist
- [x] All user flows documented
- [x] Component inventory complete  
- [x] Accessibility requirements defined
- [x] Responsive strategy clear
- [x] Brand guidelines incorporated
- [x] Performance goals established

---

*🎨 Créé par Sally, UX Expert - Recyclic Frontend Specification v1.0*