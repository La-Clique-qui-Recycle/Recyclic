# Epic 1: Refonte complète de l'interface caisse et optimisation UX globale

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
