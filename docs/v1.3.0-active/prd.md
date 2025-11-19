# RecyClique Brownfield Enhancement PRD

## Version Information
- **Version**: v1.3.0
- **Date**: 2025-11-17
- **Status**: Draft
- **Author**: John (PM)

---

## Intro Project Analysis and Context

### Existing Project Overview

**Analysis Source:** IDE-based fresh analysis (avec référence à la documentation brownfield existante)

**Current Project State:**
RecyClique (précédemment Recyclic) est une application de recyclage multi-service avec architecture Docker comprenant :
- Frontend React/TypeScript (port 4444)
- API FastAPI Python (port 4433)
- Base de données PostgreSQL
- Service Redis
- Bot Telegram (actuellement désactivé)
- Interface de caisse pour gestion des tickets d'entrée/sortie

### Available Documentation Analysis

**Available Documentation:**
- ✅ Tech Stack Documentation (document brownfield existant)
- ✅ Source Tree/Architecture (document brownfield + structure projet)
- ✅ Coding Standards (présents dans les règles du projet)
- ✅ API Documentation (structure API visible)
- ❌ External API Documentation (pas d'APIs externes majeures identifiées)
- ❌ UX/UI Guidelines (nécessitera documentation lors de la refonte)
- ✅ Technical Debt Documentation (mentionnée dans les contraintes)
- ✅ Testing infrastructure (documentée avec comptes de test)

**Note:** Utilisation de l'analyse brownfield existante - pas besoin de ré-analyser complètement.

### Enhancement Scope Definition

#### Enhancement Type
- ✅ Major Feature Modification (refonte interface caisse)
- ✅ UI/UX Overhaul (optimisation UX globale)
- ✅ Bug Fix and Stability Improvements (corrections interface)

#### Enhancement Description
Refonte complète de l'interface caisse pour RecyClique v1.3.0 incluant l'ajout de boutons de don, gestion améliorée des catégories avec cases à cocher, ajout d'ascenseur sur tickets de vente, raccourcis clavier pour saisie rapide, signaux visuels d'étape en cours, remaniement du bloc central, et renommage global de l'application.

#### Impact Assessment
- ✅ Significant Impact (substantial existing code changes) - refonte complète interface caisse
- ✅ Moderate Impact (some existing code changes) - ajustements backend pour les catégories et sauvegarde notes

### Goals and Background Context

#### Goals
- Améliorer significativement l'ergonomie de l'interface caisse pour réduire le temps de saisie des tickets
- Simplifier le processus de dons et recyclage avec des boutons prédéfinis
- Optimiser la navigation dans les tickets longs avec un ascenseur fonctionnel
- Accélérer la saisie via raccourcis clavier intuitifs
- Améliorer la compréhension de l'état du processus avec des signaux visuels clairs
- Renforcer l'identité de marque avec le nouveau nom "RecyClique"
- Assurer la stabilité et fiabilité des sauvegardes automatiques

#### Background Context
Cette version 1.3.0 répond à des retours utilisateurs concrets sur l'utilisation quotidienne de l'interface caisse. Les bénévoles rencontrent des difficultés avec la navigation dans les tickets longs et la saisie répétitive des mêmes types de dons. L'ajout de boutons prédéfinis pour les dons et le recyclage, combiné aux raccourcis clavier, devrait considérablement fluidifier le workflow. La refonte du bloc central et les signaux visuels amélioreront l'expérience utilisateur globale. Le renommage en "RecyClique" marque une évolution de l'identité de marque tout en maintenant la fonctionnalité technique existante.

---

## User Impact Analysis

### Existing Workflow Impact Assessment
**Analyse détaillée de l'impact sur les workflows existants :**

#### Impact sur les Opérateurs de Caisse
- **Temps de formation estimé** : 30-45 minutes par opérateur (formation aux nouveaux boutons et raccourcis)
- **Courbe d'apprentissage** : Adoption progressive des raccourcis clavier (2-3 jours pour fluidité)
- **Changement de workflow** : Simplification des saisies répétitives (dons/recyclage) compensée par apprentissage des nouvelles interactions

#### Impact sur les Administrateurs
- **Configuration catégories** : Nouveau paramétrage des cases à cocher (impact faible, 1h formation)
- **Gestion sauvegarde** : Documentation du système existant (impact nul sur workflow quotidien)

#### Impact sur les Bénévoles
- **Interface entrée** : Modification mineure de l'affichage catégories (adaptation visuelle uniquement)
- **Renommage global** : Changement d'identité marque (communication nécessaire)

### Workflow Continuity Measures
- **Formation progressive** : Sessions de formation par petits groupes
- **Support transition** : Documentation visuelle et guides utilisateur mis à jour
- **Période de transition** : 2 semaines avec support disponible
- **Feedback continu** : Canal de retour pour ajustements post-déploiement

### Risk Mitigation for User Adoption
- **Tests utilisateurs pilotes** : Validation avec 3-5 opérateurs avant déploiement général
- **Documentation multimédia** : Vidéos courtes + guides visuels
- **Support technique renforcé** : Hotline dédiée pendant la première semaine
- **Métriques d'adoption** : Tracking de l'utilisation des nouvelles fonctionnalités

### Expected User Benefits
- **Gain de productivité** : -25% temps de saisie pour les transactions courantes
- **Réduction fatigue** : Moins de répétitions manuelles pour les dons
- **Amélioration précision** : Signaux visuels réduisant les erreurs de saisie
- **Satisfaction utilisateur** : Interface plus moderne et intuitive

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD creation | 2025-11-17 | v1.3.0 | Refonte complète interface caisse et optimisation UX | John (PM) |

---

## Requirements

### Functional Requirements
FR1: L'interface caisse doit afficher 4 boutons prédéfinis (Don 0€, Don -18, Recyclage, Déchèterie) à l'étape de prix, permettant de valider rapidement sans saisie manuelle
FR2: Les catégories doivent inclure une case à cocher pour contrôler l'affichage dans les tickets d'entrée, avec logique automatique pour les catégories principales
FR3: Les tickets de vente doivent implémenter un ascenseur fonctionnel gardant visible le bloc total/prix/bouton "finaliser" en bas d'écran
FR4: Toutes les catégories et sous-catégories doivent afficher leur raccourci clavier (A Z E R T Y U I O P) dans le coin inférieur gauche avec style visuel distinctif
FR5: L'interface doit afficher des signaux visuels clairs (encadrements colorés) indiquant l'étape en cours du processus de saisie
FR6: Le bloc central doit être remanié avec destination + notes + bouton "Ajouter" à droite du pavé numérique réduit
FR7: Toutes les références "Recyclic" dans le code doivent être renommées "RecyClique" de manière cohérente
FR8: Le système de sauvegarde automatique de base de données doit être vérifié, documenté et validé

### Non Functional Requirements
NFR1: L'interface doit maintenir ses performances actuelles avec l'ajout d'ascenseur et boutons supplémentaires
NFR2: Les raccourcis clavier doivent fonctionner de manière fiable sur tous les navigateurs supportés
NFR3: Les signaux visuels doivent être perceptibles dans l'environnement d'utilisation réel (lumière, distance)
NFR4: Le renommage global ne doit pas casser les fonctionnalités existantes
NFR5: La stabilité des sauvegardes automatiques doit être garantie

### Compatibility Requirements
CR1: Toutes les APIs existantes doivent rester compatibles avec les modifications frontend
CR2: Le schéma de base de données existant doit être préservé lors des modifications de catégories
CR3: L'apparence et les interactions UI doivent rester cohérentes avec le design system existant
CR4: Les intégrations avec services externes (Redis, PostgreSQL) doivent être maintenues

---

## User Interface Enhancement Goals

### Integration with Existing UI
Les nouvelles fonctionnalités UI (boutons de don, ascenseur, raccourcis clavier, signaux visuels) doivent s'intégrer harmonieusement avec le design system existant de RecyClique. Les composants utiliseront les mêmes patterns de style, couleurs et typographie que l'interface actuelle, en respectant les guidelines de cohérence visuelle établies.

### Modified/New Screens and Views
- **Interface caisse principale** : Ajout des 4 boutons de prix prédéfinis, remaniement du bloc central
- **Tickets de vente** : Implémentation de l'ascenseur avec bloc inférieur fixe
- **Gestion des catégories** : Ajout des cases à cocher d'affichage
- **Tous les écrans** : Ajout des raccourcis clavier et signaux visuels d'étape

### UI Consistency Requirements
- Maintenir la hiérarchie visuelle existante (couleurs, espacement, typographie)
- Respecter les patterns d'interaction établis (hover states, focus indicators)
- Préserver l'accessibilité existante (contraste, navigation clavier)
- Assurer la cohérence entre desktop et mobile si applicable

---

## Detailed UX Analysis

### User Journey Mapping - Interface Caisse

#### Parcours Opérateur Standard (Avant v1.3.0)
1. **Ouverture session** → Saisie manuelle fond de caisse
2. **Saisie ticket** → Navigation catégories → Saisie manuelle prix → Validation
3. **Gestion longue liste** → Scroll manuel → Perte de visibilité du total
4. **Finalisation** → Calcul mental du total → Impression ticket

#### Parcours Opérateur Optimisé (Après v1.3.0)
1. **Ouverture session** → Fond pré-rempli automatiquement
2. **Saisie ticket** → Boutons prédéfinis (Don/Recyclage) → Raccourcis clavier A-Z
3. **Gestion longue liste** → Ascenseur automatique → Total toujours visible
4. **Finalisation** → Validation visuelle → Impression automatique

### Accessibility Compliance Analysis

#### WCAG 2.1 AA Requirements Coverage
- **Perceivable** : Signaux visuels avec contrast ratio >4.5:1, raccourcis clavier alternatifs
- **Operable** : Navigation clavier complète, cibles tactiles 44px minimum
- **Understandable** : Labels clairs, états visuels distincts, feedback immédiat
- **Robust** : Compatibilité navigateurs modernes, API accessibles

#### Enhanced Accessibility Features
- **Navigation clavier** : Tab order logique, raccourcis intuitifs A-Z
- **Retour visuel** : Encadrements colorés pour états actifs, indicateurs scroll
- **Support multimodal** : Souris, tactile, clavier équivalents
- **Performance** : Temps de chargement <2s, animations fluides 60fps

### Cognitive Load Analysis

#### Interface Complexity Reduction
- **Avant** : 15+ éléments interactifs par écran, navigation complexe
- **Après** : 8-10 éléments maximum, actions groupées logiquement
- **Réduction charge mentale** : Boutons prédéfinis éliminent décisions répétitives

#### Visual Hierarchy Optimization
- **Hiérarchie claire** : Actions principales (boutons prix) vs secondaires (configuration)
- **Groupement logique** : Bloc central réorganisé par fréquence d'usage
- **Feedback immédiat** : États visuels instantanés, validation en temps réel

### Error Prevention and Recovery

#### Proactive Error Prevention
- **Validation temps réel** : Prix invalides détectés avant soumission
- **Contraintes logiques** : Catégories parent/enfant respectées automatiquement
- **Feedback visuel** : États d'erreur clairement identifiés

#### Error Recovery Mechanisms
- **Annulation facile** : Boutons reset pour corrections partielles
- **Sauvegarde automatique** : État préservé pendant les interruptions
- **Reprise intelligente** : Continuation du workflow interrompu

### Mobile/Tablet Optimization

#### Touch-First Design Principles
- **Cibles tactiles** : Minimum 44px, espacement 8px entre éléments
- **Gestes naturels** : Swipe pour scroll, tap pour sélection
- **Orientation adaptative** : Interface fonctionnelle portrait/paysage

#### Performance Mobile Constraints
- **Chargement progressif** : Composants critiques prioritaires
- **Cache intelligent** : Données fréquentes mises en cache local
- **Offline resilience** : Fonctionnalités dégradées gracieusement

---

## Technical Constraints and Integration Requirements

### Existing Technology Stack
**Languages**: TypeScript/JavaScript (Frontend), Python (Backend)
**Frameworks**: React (Frontend), FastAPI (Backend)
**Database**: PostgreSQL
**Infrastructure**: Docker Compose, Redis, Nginx
**External Dependencies**: Bot Telegram (désactivé), services de paiement potentiels

### Integration Approach
**Database Integration Strategy**: Modifications mineures du schéma pour les cases à cocher catégories et champ notes - migrations incrémentales préservant la compatibilité
**API Integration Strategy**: Endpoints existants étendus pour gérer les nouvelles options de prix et catégories - versioning API maintenu
**Frontend Integration Strategy**: Composants React existants étendus avec nouvelles props et state management préservé
**Testing Integration Strategy**: Tests existants mis à jour pour couvrir les nouvelles fonctionnalités sans casser les tests de régression

### Code Organization and Standards
**File Structure Approach**: Respect de la structure existante - nouveaux composants dans dossiers appropriés, logique métier séparée
**Naming Conventions**: Respect des conventions existantes (camelCase, PascalCase selon usage)
**Coding Standards**: Application des règles définies dans le projet (ESLint, Prettier, Black)
**Documentation Standards**: Mise à jour des commentaires et README selon patterns existants

### Deployment and Operations
**Build Process Integration**: Intégration dans le pipeline CI/CD existant avec tests automatisés
**Deployment Strategy**: Déploiement progressif avec feature flags si nécessaire pour minimiser les risques
**Monitoring and Logging**: Utilisation des outils existants, ajout de métriques pour nouvelles fonctionnalités
**Configuration Management**: Variables d'environnement existantes étendues si nécessaire

---

## Rollback Strategy and Feature Flags

### Feature Flag Architecture

#### Core Feature Flags Implementation
```javascript
// Configuration des feature flags
const FEATURE_FLAGS = {
  PRICE_BUTTONS: 'price_buttons_v1_3',
  CATEGORY_CHECKBOXES: 'category_visibility_v1_3',
  SCROLLABLE_TICKETS: 'scrollable_tickets_v1_3',
  KEYBOARD_SHORTCUTS: 'keyboard_shortcuts_v1_3',
  VISUAL_SIGNALS: 'visual_signals_v1_3',
  CENTRAL_BLOCK_REDESIGN: 'central_block_redesign_v1_3',
  RECYCLIQUE_BRAND: 'recyClique_branding_v1_3',
  BACKUP_AUDIT: 'backup_audit_v1_3'
}
```

#### Feature Flag Management
- **Admin Panel Control**: Toggle features via interface d'administration
- **Environment Variables**: Configuration par environnement (dev/staging/prod)
- **Database Persistence**: Flags stockés en base pour persistance
- **Runtime Updates**: Changement sans redémarrage application

### Rollback Procedures

#### Immediate Rollback (< 5 minutes)
```bash
# Rollback Docker complet
docker-compose down
docker-compose pull origin/main  # Version précédente
docker-compose up -d

# Rollback base de données
pg_restore --clean --if-exists /path/to/previous/backup.dump
```

#### Feature-by-Feature Rollback (15-30 minutes)
- **Désactiver flags problématiques** via admin panel
- **Monitor impact** sur métriques utilisateurs
- **Rollback sélectif** si nécessaire (migration inverse)
- **Communication équipe** avec statut détaillé

#### Database Rollback Strategy
- **Sauvegarde automatique** avant chaque déploiement
- **Scripts de rollback** testés pour chaque migration
- **Point de restauration** clairement identifié
- **Validation données** après rollback

### Graduated Deployment Strategy

#### Phase 1: Internal Testing (Jour 1-2)
- **Feature flags désactivés** par défaut
- **Tests internes** avec flags activés sélectivement
- **Monitoring complet** performance et erreurs

#### Phase 2: Pilot Users (Jour 3-5)
- **Groupe pilote** : 3-5 opérateurs de caisse
- **Flags activés progressivement** un par un
- **Feedback quotidien** et métriques détaillées

#### Phase 3: Staged Rollout (Jour 6-10)
- **Déploiement par site** : Un site par jour
- **Monitoring 24/7** pendant la première semaine
- **Support renforcé** disponible immédiatement

#### Phase 4: Full Rollout (Jour 11+)
- **Activation généralisée** après validation pilote
- **Monitoring continu** avec alertes automatiques
- **Support standard** avec documentation complète

### Rollback Triggers and Criteria

#### Automatic Rollback Triggers
- **Error Rate > 5%** : Rollback immédiat si erreurs critiques
- **Performance Degradation > 20%** : Rollback si impact performance
- **User Complaints > 10/jour** : Investigation et rollback si nécessaire

#### Manual Rollback Criteria
- **Business Impact** : Perte de fonctionnalités critiques
- **Data Integrity Issues** : Problèmes de sauvegarde ou corruption
- **Security Vulnerabilities** : Exposition de données sensibles

### Rollback Validation Procedures

#### Pre-Rollback Checklist
- [ ] Identification cause racine du problème
- [ ] Validation sauvegarde base de données récente
- [ ] Communication avec utilisateurs affectés
- [ ] Test rollback procedure en environnement de test

#### Post-Rollback Validation
- [ ] Vérification fonctionnalité interface caisse
- [ ] Test transactions complètes end-to-end
- [ ] Validation données non corrompues
- [ ] Confirmation métriques normales

### Recovery Time Objectives (RTO)

#### Critical Features (RTO < 1h)
- Interface caisse principale non fonctionnelle
- Perte de données transactions
- Erreurs empêchant toute utilisation

#### Important Features (RTO < 4h)
- Problèmes performance significatifs
- Fonctionnalités secondaires défaillantes
- Erreurs affectant majorité utilisateurs

#### Minor Features (RTO < 24h)
- Fonctionnalités cosmétiques cassées
- Problèmes mineurs d'UX
- Dégradations non critiques

### Communication During Rollback

#### Internal Communication
- **Slack/Teams Channel** : Mises à jour temps réel du rollback
- **Status Page** : Page publique avec statut déploiement
- **Email Alerts** : Notification équipe technique + business

#### User Communication
- **In-App Notifications** : Message utilisateur pendant rollback
- **Email Broadcast** : Information utilisateurs affectés
- **Support Hotline** : Numéro dédié pour assistance rollback

### Rollback Testing and Validation

#### Pre-Production Rollback Drills
- **Monthly Testing** : Simulation rollback complet
- **Feature Flag Testing** : Validation toggle individuels
- **Performance Validation** : Métriques avant/après rollback

#### Post-Mortem Process
- **Root Cause Analysis** : Investigation approfondie
- **Documentation Updates** : Procédures améliorées
- **Preventive Measures** : Corrections préventives implémentées

### Risk Assessment and Mitigation
**Technical Risks**: Impact sur les performances avec nouveaux composants UI, compatibilité navigateurs pour raccourcis clavier
**Integration Risks**: Conflits potentiels avec le "Type Duplication Crisis" mentionné, impact sur APIs existantes
**Deployment Risks**: Risque de régression sur l'interface caisse existante pendant le déploiement
**Mitigation Strategies**: Tests d'intégration complets, déploiements progressifs, rollback plan documenté

---

## Integration Touchpoints Analysis

### Frontend-Backend Integration Points

#### API Endpoints Touchpoints
- **Categories API** (`/api/categories`):
  - Touchpoint: Ajout champ `display_in_ticket` boolean
  - Impact: Queries filtrées côté backend, cache invalidation nécessaire
  - Compatibility: Versioning API maintenu, fallback vers ancien comportement

- **Sales API** (`/api/sales`):
  - Touchpoint: Extension pour prix prédéfinis et champ notes
  - Impact: Validation côté backend des nouvelles options de prix
  - Compatibility: Support des anciens formats + nouveaux boutons

- **Settings API** (`/api/settings`):
  - Touchpoint: Configuration cases à cocher catégories
  - Impact: Persistence des préférences utilisateur/admin
  - Compatibility: Valeurs par défaut conservant comportement existant

#### Database Schema Touchpoints
- **Categories Table**:
  - Touchpoint: Colonne `display_in_ticket` (boolean, default true)
  - Migration: Script incrémental, rollback automatique possible
  - Indexes: Optimisation pour queries filtrées par visibilité

- **Sales Table**:
  - Touchpoint: Colonne `price_type` (enum: manual, donation_0, donation_18, recycling, waste)
  - Migration: Valeur par défaut 'manual' pour compatibilité
  - Constraints: Validation côté base des valeurs enum

### Component Integration Touchpoints

#### Shared Component Dependencies
- **CategorySelector Component**:
  - Touchpoints: Props étendues pour cases à cocher, raccourcis clavier
  - Dependencies: State management pour visibilité catégories
  - Integration: Event handlers pour clavier + souris maintenus

- **TicketList Component**:
  - Touchpoints: Scroll container, sticky footer avec total
  - Dependencies: CSS scroll-snap, position sticky cross-browser
  - Integration: ResizeObserver pour adaptation dynamique

- **PriceInput Component**:
  - Touchpoints: Boutons prédéfinis + input manuel alternatif
  - Dependencies: Validation logique prix, feedback visuel
  - Integration: State partagé entre boutons et input

#### State Management Touchpoints
- **Redux/Zustand Store**:
  - Touchpoints: Nouveaux slices pour catégories visibility, UI state
  - Integration: Actions pour toggle catégories, update scroll state
  - Compatibility: Migration selectors existants préservée

### External System Touchpoints

#### Browser API Integration
- **KeyboardEvent API**:
  - Touchpoint: Event listeners globaux pour raccourcis A-Z
  - Conflict Resolution: Prévention conflits avec inputs texte existants
  - Fallback: Navigation tab standard si raccourcis désactivés

- **IntersectionObserver API**:
  - Touchpoint: Détection visibilité éléments pour signaux visuels
  - Performance: Throttling pour éviter surcharge CPU
  - Polyfill: Support navigateurs legacy maintenu

#### Third-party Library Touchpoints
- **React Query/TanStack Query**:
  - Touchpoints: Cache invalidation pour catégories modifiées
  - Integration: Optimistic updates pour UI responsiveness
  - Compatibility: Queries existantes non affectées

### Cross-Feature Integration Points

#### Feature Flag Dependencies
- **Category Checkboxes** ↔ **Ticket Display**:
  - Touchpoint: Filtrage temps réel des catégories affichées
  - State Flow: Admin setting → API → Frontend filter → UI update

- **Price Buttons** ↔ **Notes Field**:
  - Touchpoint: Activation automatique du champ notes
  - Validation: Required pour certains types de prix (dons)

- **Keyboard Shortcuts** ↔ **Accessibility**:
  - Touchpoint: ARIA labels dynamiques pour raccourcis
  - Compliance: WCAG guidelines pour navigation clavier

#### Data Flow Integration
- **User Input** → **Validation** → **API** → **Database** → **UI Update**
- **Admin Config** → **Settings API** → **Local Storage** → **Component Props**
- **Scroll Events** → **State Update** → **Sticky Positioning** → **Visual Feedback**

### Integration Testing Touchpoints

#### Critical Integration Test Scenarios
1. **Category Toggle → Ticket Display**: Vérification filtrage temps réel
2. **Price Button → Notes Field**: Activation/validation automatique
3. **Keyboard Shortcut → Category Selection**: Navigation fluide
4. **Scroll → Total Visibility**: Positionnement sticky maintenu

#### End-to-End Integration Flows
- **Complete Sale Flow**: Category selection → Price setting → Notes → Finalize
- **Admin Configuration**: Checkbox toggle → Save → UI refresh → Verification
- **Error Recovery**: Invalid input → Visual feedback → Correction → Success

---

## Epic and Story Structure

**Epic Structure Decision**: Single comprehensive epic
**Rationale**: Les 8 points fonctionnels sont hautement interconnectés (interface caisse, catégories, UX) et nécessitent une coordination étroite pour maintenir la cohérence de l'expérience utilisateur. Un epic unique minimise les risques d'incohérence entre les modifications.

**Epic Goal**: Refonte complète de l'interface caisse RecyClique v1.3.0 pour améliorer l'ergonomie et l'efficacité opérationnelle tout en préservant la stabilité du système existant.

**Integration Requirements**: Toutes les modifications doivent maintenir la compatibilité backward avec l'architecture existante, les APIs actuelles, et l'expérience utilisateur établie. Chaque changement doit être testé pour son impact sur les fonctionnalités existantes.

---

## Epic 1: Refonte complète de l'interface caisse et optimisation UX globale

**Epic Goal**: Transformer l'interface caisse de RecyClique v1.3.0 pour améliorer significativement l'ergonomie et l'efficacité opérationnelle, tout en préservant la stabilité et compatibilité du système existant.

**Integration Requirements**: Toutes les modifications doivent maintenir la compatibilité backward avec l'architecture existante, les APIs actuelles, et l'expérience utilisateur établie. Chaque story doit inclure des vérifications explicites que les fonctionnalités existantes restent intactes.

### Story 1.1: Implémentation des boutons de prix prédéfinis
As a caisse operator, I want predefined price buttons (Don 0€, Don -18, Recyclage, Déchèterie) so that I can quickly select common transaction types without manual input.

**Acceptance Criteria**
1.1.1: Four buttons are displayed at the price step with clear labels
1.1.2: Clicking a button automatically sets the price and enables the notes field
1.1.3: The notes field is saved to database when transaction is completed
1.1.4: Manual price input remains available as fallback option

**Integration Verification**
IV1.1.1: Existing price calculation logic remains unchanged
IV1.1.2: Database schema supports the new notes field without migration conflicts
IV1.1.3: API endpoints handle both button-selected and manually-entered prices

### Story 1.2: Gestion des catégories avec cases à cocher d'affichage
As a caisse administrator, I want checkboxes to control category display in entry tickets so that I can customize which categories appear for different types of users.

**Acceptance Criteria**
1.2.1: Categories display includes checkbox for ticket visibility control
1.2.2: If no subcategories of a main category are displayed, selecting the main category is sufficient
1.2.3: Category selection logic automatically adapts to visibility settings
1.2.4: Changes are persisted and applied immediately

**Integration Verification**
IV1.2.1: Existing category hierarchy and relationships are preserved
IV1.2.2: Database queries for categories include visibility filtering without performance impact
IV1.2.3: Existing ticket creation workflows continue to function with modified category display

### Story 1.3: Ascenseur fonctionnel sur les tickets de vente
As a caisse operator, I want a scrollable sales ticket list with fixed bottom summary so that I can review all items while keeping total and finalize button always visible.

**Acceptance Criteria**
1.3.1: Sales ticket list displays scrollable area when content exceeds viewport
1.3.2: Bottom summary block (total items, total price, finalize button) remains fixed and visible
1.3.3: Scrolling behavior is smooth and responsive
1.3.4: Visual indicators show when content is scrollable

**Integration Verification**
IV1.3.1: Existing ticket display logic is preserved for tickets that fit in viewport
IV1.3.2: Performance impact is minimal (no more than 5% degradation)
IV1.3.3: Mobile/tablet responsiveness is maintained

### Story 1.4: Raccourcis clavier pour saisie rapide
As a caisse operator, I want keyboard shortcuts (A Z E R T Y U I O P) displayed on category buttons so that I can perform rapid data entry without mouse interaction.

**Acceptance Criteria**
1.4.1: Keyboard shortcuts A-Z are displayed on category and subcategory buttons
1.4.2: Shortcuts are visually distinct but not intrusive (bottom-left corner styling)
1.4.3: Pressing shortcut keys triggers the corresponding button action
1.4.4: Shortcuts work regardless of keyboard case (upper/lower)

**Integration Verification**
IV1.4.1: Existing mouse/touch interactions remain unchanged
IV1.4.2: Keyboard shortcuts don't interfere with other input fields
IV1.4.3: Accessibility features (screen readers, keyboard navigation) are preserved

### Story 1.5: Signaux visuels d'étape en cours
As a caisse operator, I want clear visual indicators showing current process step so that I can easily understand where I am in the transaction flow.

**Acceptance Criteria**
1.5.1: Category selection displays colored border when active
1.5.2: Weight input displays colored border during entry
1.5.3: Validation step displays colored border when confirming
1.5.4: Visual states are clearly distinguishable and intuitive

**Integration Verification**
IV1.5.1: Color scheme integrates with existing design system
IV1.5.2: Visual indicators don't interfere with existing UI elements
IV1.5.3: Color choices maintain accessibility standards (contrast ratios)

### Story 1.6: Remaniement du bloc central
As a caisse operator, I want a reorganized central block with destination/notes/button positioned right of numeric keypad so that I can efficiently complete transactions in a logical layout.

**Acceptance Criteria**
1.6.1: Numeric keypad is slightly reduced in width
1.6.2: Destination selector, notes field, and "Add Item" button are positioned to the right
1.6.3: Layout remains functional on different screen sizes
1.6.4: Information hierarchy is clear and logical

**Integration Verification**
IV1.6.1: Existing input validation logic remains intact
IV1.6.2: Touch targets meet minimum size requirements
IV1.6.3: Responsive behavior adapts properly to screen size changes

### Story 1.7: Renommage global RecyClique
As a system administrator, I want all "Recyclic" references changed to "RecyClique" throughout the codebase so that the application reflects the current brand identity.

**Acceptance Criteria**
1.7.1: All user-facing text references are updated to "RecyClique"
1.7.2: Configuration files and documentation reflect the new name
1.7.3: No functional code references are broken by the renaming
1.7.4: Brand consistency is maintained across all interfaces

**Integration Verification**
IV1.7.1: Database references and API endpoints remain functional
IV1.7.2: Build and deployment processes continue to work
IV1.7.3: External integrations (if any) are not affected

### Story 1.8: Audit et documentation du système de sauvegarde
As a system administrator, I want verified and documented automatic database backup mechanisms so that data integrity is guaranteed and recovery procedures are clear.

**Acceptance Criteria**
1.8.1: Automatic backup mechanisms are identified and documented
1.8.2: Backup frequency and retention policies are defined
1.8.3: Recovery procedures are documented and tested
1.8.4: Monitoring and alerting for backup failures is implemented

**Integration Verification**
IV1.8.1: Existing backup processes (if any) continue to function
IV1.8.2: New documentation is integrated into existing knowledge base
IV1.8.3: Backup verification processes don't impact system performance

---

## Testing and Validation Tools

### Comptes de Test pour Validation

| Rôle | Identifiant | Mot de passe | Permissions |
|------|-------------|--------------|-------------|
| Super Admin | `superadmintest1` | `Test1234!` | Accès complet |
| Admin | `admintest1` | `Test1234!` | Gestion admin |
| Utilisateur | `usertest1` | `Test1234!` | Fonctionnalités de base |

### Environnements de Test
- **Frontend :** `http://localhost:4444`
- **API :** `http://localhost:4433`
- **Outils :** DevTools (F12) pour inspection API et debugging

### Instructions pour les Tests Browser
- Utiliser **DevTools du navigateur** (F12) pour inspecter les appels API
- Vérifier les **requêtes réseau** dans l'onglet "Network"
- Consulter la **console** pour les erreurs JavaScript
- Tester avec **différents comptes** selon les rôles requis

---

## Comprehensive Regression Testing Strategy

### Interface Caisse Regression Test Suite

#### Core Functionality Tests
**Test Case: TC-CAISSE-001 - Session Opening**
- **Pré-conditions**: Interface caisse accessible, utilisateur authentifié
- **Étapes**:
  1. Accéder à l'interface caisse
  2. Ouvrir une nouvelle session
  3. Saisir fond de caisse initial
- **Validations**:
  - Session créée avec timestamp correct
  - Fond de caisse enregistré en base
  - Interface vente accessible
- **Post-conditions**: Session active, métriques logging OK

**Test Case: TC-CAISSE-002 - Basic Sale Transaction**
- **Pré-conditions**: Session caisse ouverte
- **Étapes**:
  1. Sélectionner catégorie EEE
  2. Saisir quantité et prix
  3. Finaliser la vente
- **Validations**:
  - Transaction enregistrée en base
  - Ticket généré correctement
  - Totaux mis à jour
- **Post-conditions**: Vente complète, données persistées

**Test Case: TC-CAISSE-003 - Session Closing**
- **Pré-conditions**: Session ouverte avec transactions
- **Étapes**:
  1. Accéder fermeture session
  2. Saisir décompte physique
  3. Valider rapprochement
- **Validations**:
  - Écart calculé correctement
  - Rapport généré et archivé
  - Session marquée fermée
- **Post-conditions**: Session terminée, données finales sauvegardées

#### New Feature Regression Tests

**Test Case: TC-NEW-001 - Price Buttons Functionality**
- **Pré-conditions**: Session ouverte, interface avec boutons prix
- **Étapes**:
  1. Cliquer bouton "Don 0€"
  2. Vérifier activation champ notes
  3. Saisir note et finaliser
- **Validations**:
  - Prix défini automatiquement
  - Champ notes obligatoire activé
  - Transaction complète avec note sauvegardée
- **Compatibility Check**: Input manuel toujours disponible

**Test Case: TC-NEW-002 - Category Visibility Controls**
- **Pré-conditions**: Accès admin catégories
- **Étapes**:
  1. Désactiver case à cocher catégorie
  2. Sauvegarder configuration
  3. Vérifier non-affichage en caisse
- **Validations**:
  - Catégorie masquée en interface caisse
  - Configuration persistée
  - Logique parent/enfant préservée
- **Compatibility Check**: Anciennes configurations toujours valides

**Test Case: TC-NEW-003 - Scrollable Ticket List**
- **Pré-conditions**: Ticket avec 10+ lignes
- **Étapes**:
  1. Ajouter items jusqu'à dépassement écran
  2. Scroller dans la liste
  3. Vérifier visibilité bloc total
- **Validations**:
  - Scroll fluide sans lag
  - Bloc total toujours visible
  - Performance maintenue
- **Compatibility Check**: Tickets courts fonctionnent normalement

**Test Case: TC-NEW-004 - Keyboard Shortcuts**
- **Pré-conditions**: Interface caisse active
- **Étapes**:
  1. Presser raccourci "A" (première catégorie)
  2. Vérifier sélection automatique
  3. Tester raccourcis numériques
- **Validations**:
  - Sélection correcte via clavier
  - Focus approprié maintenu
  - Pas d'interférence avec inputs texte
- **Compatibility Check**: Navigation souris préservée

**Test Case: TC-NEW-005 - Visual Step Signals**
- **Pré-conditions**: Processus vente commencé
- **Étapes**:
  1. Sélectionner catégorie
  2. Vérifier encadrement coloré
  3. Passer à étape prix
  4. Vérifier changement signal
- **Validations**:
  - Signaux visuels clairs et distincts
  - États cohérents avec progression
  - Accessibilité contrast maintenu
- **Compatibility Check**: Interface fonctionnelle sans signaux

#### Performance Regression Tests

**Test Case: TC-PERF-001 - Interface Load Time**
- **Métriques cibles**:
  - First Paint: < 1.5s
  - Time to Interactive: < 2.0s
  - Lighthouse Performance Score: > 85
- **Test Conditions**: Cache cleared, connexion standard
- **Regression Threshold**: +10% max vs baseline

**Test Case: TC-PERF-002 - Transaction Processing**
- **Métriques cibles**:
  - Transaction complète: < 500ms
  - API response time: < 200ms
  - Database query time: < 100ms
- **Load Testing**: 10 transactions simultanées
- **Regression Threshold**: +20% max vs baseline

#### Cross-Browser Compatibility Tests

**Supported Browsers Matrix:**
| Browser | Version | Priority | Test Coverage |
|---------|---------|----------|---------------|
| Chrome | Latest 2 versions | Critical | Full regression |
| Firefox | Latest 2 versions | Critical | Full regression |
| Safari | Latest 2 versions | Important | Core functionality |
| Edge | Latest 2 versions | Important | Core functionality |

**Test Case: TC-BROWSER-001 - Feature Parity**
- **Validation**: Toutes fonctionnalités opérationnelles sur chaque browser
- **Focus**: Raccourcis clavier, scroll, signaux visuels
- **Reporting**: Screenshots diff pour validation visuelle

#### Mobile/Tablet Regression Tests

**Test Case: TC-MOBILE-001 - Touch Interface**
- **Device Coverage**: iPad, Android tablets, phones
- **Validations**:
  - Touch targets 44px minimum
  - Swipe gestures fonctionnels
  - Responsive layout maintained
- **Performance**: Smooth 60fps interactions

#### API Integration Regression Tests

**Test Case: TC-API-001 - Endpoint Compatibility**
- **Coverage**: Tous endpoints existants + nouveaux
- **Validations**:
  - Response formats unchanged
  - Error handling preserved
  - Authentication maintained
- **Load Testing**: 50 concurrent users

#### Database Migration Regression Tests

**Test Case: TC-DB-001 - Schema Compatibility**
- **Validations**:
  - Migrations réversibles
  - Données existantes préservées
  - Foreign keys intactes
  - Indexes optimisés
- **Rollback Testing**: Migration inverse testée

### Automated Test Coverage

#### Unit Test Requirements
- **Coverage Target**: > 90% nouvelles fonctionnalités
- **Critical Paths**: Tous composants UI, logique métier
- **Mock Strategy**: API responses, database interactions

#### Integration Test Requirements
- **API Contracts**: Tous endpoints testés
- **Component Interactions**: Props/state flow validé
- **Database Operations**: CRUD operations complètes

#### End-to-End Test Requirements
- **Critical User Journeys**:
  - Session complète caisse (ouverture → ventes → fermeture)
  - Configuration admin → application interface
  - Processus erreur → récupération
- **Cross-Browser Execution**: CI/CD pipeline

### Test Execution Strategy

#### Pre-Deployment Testing
- **Daily**: Unit tests automatiques
- **Weekly**: Integration tests complets
- **Pre-Release**: Full regression suite

#### Post-Deployment Monitoring
- **Real User Monitoring**: Performance, erreurs en production
- **Automated Alerts**: Seuils définis pour rollback automatique
- **A/B Testing**: Comparaison feature flags on/off

### Test Data Management

#### Test Environment Setup
- **Database Seeding**: Données représentatives production
- **User Accounts**: Comptes test par rôle (admin, operator, volunteer)
- **Configuration**: Paramètres réalistes par environnement

#### Data Cleanup Procedures
- **Post-Test**: Reset database state
- **Isolation**: Tests parallèles sans interférence
- **Audit Trail**: Logging modifications test data

### Success Criteria and Exit Criteria

#### Test Execution Success Criteria
- **Zero Critical Bugs** en production
- **< 5% Error Rate** acceptable
- **100% Test Coverage** nouvelles fonctionnalités
- **Performance Baseline** maintenu ou amélioré

#### Deployment Exit Criteria
- [ ] Tous tests automatisés passant
- [ ] Tests manuels critiques validés
- [ ] Performance benchmarks respectés
- [ ] Revue sécurité complétée
- [ ] Approbation PO obtenue

*Document généré automatiquement via BMAD™ Core - Template: brownfield-prd-template-v2*
