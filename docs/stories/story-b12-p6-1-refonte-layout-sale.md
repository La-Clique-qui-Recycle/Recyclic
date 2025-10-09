# Story (Développement): Refonte du Layout de la Page de Vente (Sale.tsx)

**ID:** STORY-B12-P6-1
**Titre:** Refonte du Layout de la Page de Vente (Sale.tsx)
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** restructurer la page `Sale.tsx` en un layout à 2 colonnes et intégrer le `CashSessionHeader`,  
**Afin de** préparer l'intégration du `SaleWizard` dans la nouvelle interface en mode Kiosque.

## Contexte

Cette story est la première étape du découpage de la story `STORY-B12-P6`. Elle se concentre sur la mise en place de la structure visuelle principale de la page de vente, en utilisant les composants d'infrastructure déjà créés.

## Critères d'Acceptation

1.  La page `frontend/src/pages/CashRegister/Sale.tsx` est restructurée pour utiliser un layout à 2 colonnes :
    -   **Colonne de Gauche :** Est réservée pour le `Numpad` (qui sera intégré dans la story suivante).
    -   **Colonne de Droite :** Est réservée pour le contenu dynamique du `SaleWizard`.
2.  Le `CashSessionHeader` (`frontend/src/components/business/CashSessionHeader.tsx`) est intégré en haut de la page, remplaçant le header principal de l'application.
3.  Le layout s'adapte dynamiquement à la hauteur de la fenêtre du navigateur pour éliminer tout besoin de scroll.
4.  Le layout est responsive et s'adapte correctement sur les écrans plus petits (ex: une seule colonne sur mobile).

## Références

-   **Document de Spécifications UX :** `docs/frontend-spec/spec-cash-register-refactor.md`
-   **Composants d'Infrastructure :** `frontend/src/components/ui/Numpad.tsx`, `frontend/src/components/business/CashSessionHeader.tsx` (déjà créés dans `STORY-B12-P6`).
-   **Composant de Référence pour le Layout :** `frontend/src/pages/Reception/TicketForm.tsx` (pour l'implémentation des panneaux redimensionnables et du responsive).

## Notes Techniques

-   **Fichiers à modifier :** `frontend/src/pages/CashRegister/Sale.tsx`.
-   Utiliser CSS Grid ou Flexbox pour implémenter la structure en 2 colonnes.
-   S'assurer que le `PageLayout` n'est plus utilisé sur cette page, ou qu'il est configuré pour ne pas afficher le header principal.

## Definition of Done

- [x] Le layout à 2 colonnes est implémenté sur `Sale.tsx`.
- [x] Le `CashSessionHeader` est intégré.
- [x] Le layout est responsive et s'adapte à la hauteur de la fenêtre.
- [x] La story a été validée par le Product Owner.

---

## Dev Agent Record

### Tasks Completed

- [x] Créer le layout Kiosk avec KioskContainer (mode plein écran, 100vh)
- [x] Intégrer le CashSessionHeader en haut de la page
- [x] Créer le layout à 2 colonnes (gauche: Numpad placeholder, droite: SaleWizard)
- [x] Adapter le layout responsive (mobile: 1 colonne, desktop: 2 colonnes)
- [x] Supprimer/remplacer PageLayout pour éliminer le header principal
- [x] Ajouter tests unitaires pour le nouveau layout
- [x] Mettre à jour le fichier de setup des tests pour inclure l'icône User

### File List

#### Modified Files
- `frontend/src/pages/CashRegister/Sale.tsx` - Refonte complète du layout en mode Kiosk avec 2 colonnes
- `frontend/src/pages/CashRegister/__tests__/Sale.test.tsx` - Ajout de tests pour le nouveau layout avec CashSessionHeader
- `frontend/src/test/setup.ts` - Ajout de l'icône User au mock lucide-react

### Change Log

- **2025-10-08** - Refonte du layout Sale.tsx en mode Kiosk
  - Implémentation du KioskContainer avec layout 100vh sans scroll
  - Intégration du CashSessionHeader avec nom du caissier et bouton de fermeture de session
  - Création d'un layout à 2 colonnes : gauche (placeholder Numpad) et droite (SaleWizard + Ticket)
  - Layout responsive : 2 colonnes sur desktop, 1 colonne empilée sur mobile (< 768px)
  - Suppression du PageLayout pour éliminer le header principal de l'application
  - Ajout du useAuthStore pour récupérer les informations du caissier
  - Mise à jour des tests avec mock du authStore et tests du nouveau layout

### Completion Notes

**Implémentation réussie du nouveau layout Kiosk** :
- Layout à 2 colonnes fonctionnel avec placeholder pour le Numpad (prêt pour intégration dans story suivante)
- CashSessionHeader intégré avec affichage du nom complet du caissier (first_name + last_name) ou username en fallback
- Adaptation responsive : mobile affiche les colonnes empilées verticalement
- Adaptation hauteur : utilisation de 100vh et calc(100vh - 50px) pour éliminer le scroll
- Tests unitaires mis à jour pour valider le nouveau layout

**Prochaine étape** : Intégration du composant Numpad dans la colonne de gauche (story suivante)

## QA Results

**Gate:** PASS

**Rationale (résumé):**
- Layout Kiosk 2 colonnes implémenté avec KioskContainer (100vh, overflow hidden)
- CashSessionHeader intégré avec nom du caissier et bouton fermeture
- Design responsive : 2 colonnes desktop, 1 colonne mobile (< 768px)
- Adaptation hauteur : 100vh avec calc(100vh - 50px) pour éliminer le scroll
- Tests unitaires complets pour le nouveau layout

**Evidence:**
- **Layout Kiosk:** `KioskContainer` avec `height: 100vh`, `MainLayout` avec `display: flex`
- **2 colonnes:** `LeftColumn` (flex: 1) pour Numpad placeholder, `RightColumn` (flex: 2) pour SaleWizard + Ticket
- **CashSessionHeader:** Composant avec nom caissier (first_name + last_name), session ID, bouton fermeture
- **Responsive:** Media query `@media (max-width: 768px)` pour mobile (colonnes empilées)
- **Hauteur adaptative:** `max-height: calc(100vh - 50px)` pour éliminer le scroll
- **Tests:** 15 tests unitaires couvrant layout, navigation, workflow de vente

**Détails techniques:**
- **AC1:** Layout 2 colonnes ✅ (KioskContainer + MainLayout avec flex)
- **AC2:** CashSessionHeader intégré ✅ (remplace header principal, nom caissier affiché)
- **AC3:** Adaptation hauteur ✅ (100vh, calc(100vh - 50px), overflow hidden)
- **AC4:** Responsive ✅ (media query mobile, colonnes empilées)

**Status:** **PASS** - Tous les critères d'acceptation respectés, layout Kiosk fonctionnel et prêt pour intégration Numpad.
