# Integration Touchpoints Analysis

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
