# Story (Développement): Refonte UI du Workflow de Saisie de la Caisse (Mode Kiosque)

**ID:** STORY-B12-P6
**Titre:** Refonte UI du Workflow de Saisie de la Caisse (Mode Kiosque)
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** implémenter le nouveau design de l'interface de saisie de la caisse en mode "Kiosque" plein écran,  
**Afin de** fournir une expérience utilisateur compacte, cohérente et adaptée à l'utilisation tactile, tout en préservant la logique métier existante.

## Contexte

Cette story implémente le design défini par l'agent UX dans le document de spécifications `docs/frontend-spec/spec-cash-register-refactor.md`. L'objectif est de résoudre les problèmes de layout et d'organisation de la page de caisse (`/cash-register/sale`) en la transformant en une interface plein écran optimisée.

## Critères d'Acceptation

1.  **Layout Général (Mode Kiosque) :**
    -   Le header principal de l'application (`frontend/src/components/Header.jsx`) est masqué sur la page de la caisse (`/cash-register/sale`).
    -   Un header de session fin et discret est affiché en haut de l'écran, inspiré du `SessionHeader` de la Réception, contenant le nom du caissier et le bouton "Fermer la Caisse".
    -   L'ensemble de l'interface s'adapte dynamiquement à la hauteur de la fenêtre du navigateur pour éliminer tout besoin de scroll.

2.  **Structure de la Vue de Saisie (2 Colonnes) :**
    -   La page `frontend/src/pages/CashRegister/Sale.tsx` est refondue pour utiliser une structure à 2 colonnes (inspirée de `LeftPanel` et `RightPanel`).
    -   **Colonne de Gauche :** Contient un nouveau composant `Numpad` unifié et réutilisable (`frontend/src/components/ui/Numpad.tsx`) pour toutes les étapes de saisie numérique (Poids, Quantité, Prix). Ce pavé est fixe et sa taille s'adapte à la hauteur de l'écran.
    -   **Colonne de Droite :** Affiche dynamiquement le contenu de l'étape en cours (Catégorie, Sous-catégorie, Poids, Quantité, Prix), orchestré par le `SaleWizard`.

3.  **Contenu par Étape (Colonne de Droite) :**
    -   **Étape "POIDS" :** Affiche la liste des pesées additionnées, le bouton `+ Ajouter une pesée`, et le bouton "Valider le poids total".
    -   **Étape "QUANTITÉ" :** Affiche le pré-calcul `quantité x prix` et le bouton "Valider la quantité".
    -   **Étape "PRIX" :** Affiche un rappel de la fourchette de prix et le bouton "Valider le prix".

4.  **Préservation de la Logique Métier :**
    -   Le workflow séquentiel (Catégorie -> Sous-catégorie -> Poids -> Quantité -> Prix) est préservé.
    -   Le focus automatique sur les champs de saisie à chaque étape est maintenu.
    -   Les raccourcis clavier (`Entrée` pour valider, `+` pour ajouter une pesée) fonctionnent comme avant.
    -   La logique d'addition des pesées pour un même article est conservée (réutilisation de `weightMask.ts`).

## Références

-   **Document de Spécifications UX (Source de Vérité) :** `docs/frontend-spec/spec-cash-register-refactor.md`
-   **Composant de Référence pour le Layout :** `frontend/src/pages/Reception/TicketForm.tsx` (pour l'implémentation des panneaux redimensionnables et du responsive).
-   **Utilitaire de Saisie de Poids :** `frontend/src/utils/weightMask.ts` (pour la logique de saisie et de formatage du poids).

## Notes Techniques

-   **Fichiers à modifier :** `frontend/src/pages/CashRegister/Sale.tsx` (pour le layout principal), `frontend/src/components/business/SaleWizard.tsx` (pour orchestrer les étapes), et les composants spécifiques à chaque étape (Poids, Quantité, Prix).
-   **Composant Numpad :** Créer un nouveau composant `frontend/src/components/ui/Numpad.tsx` qui sera réutilisable.
-   **Adaptation Verticale :** Utiliser Flexbox ou CSS Grid avec des unités `vh` ou `fr` pour l'adaptation à la hauteur.
-   **Gestion d'État :** Le `SaleWizard` devra gérer l'état de l'étape actuelle et les données collectées à chaque étape.

## Definition of Done

- [x] Le composant `Numpad` unifié est créé et prêt à l'utilisation.
- [x] Le composant `CashSessionHeader` est créé pour le mode kiosque.
- [x] Le header principal est masqué sur la page de caisse.
- [ ] Le nouveau layout en mode Kiosque est implémenté.
- [ ] Le contenu de chaque étape est affiché dynamiquement.
- [ ] La logique métier existante est préservée et fonctionnelle.
- [ ] La story a été validée par le Product Owner.

---

## PO Review

**Date**: 2025-09-22  
**Relecteur PO**: Sarah (Product Owner)

### Décision
**PARTIELLEMENT COMPLÉTÉE / DÉCOUPÉE**

### Raison
Le travail d'infrastructure (création du `Numpad` et du `CashSessionHeader`, activation du mode Kiosque) a été réalisé avec succès. Cependant, l'intégration complète du nouveau layout et l'adaptation du `SaleWizard` représentent une complexité trop importante pour une seule story. Conformément à la recommandation de l'agent DEV, cette story est considérée comme partiellement complétée et a été découpée en trois nouvelles stories pour une livraison incrémentale et sûre.

### Prochaines Étapes
Les trois nouvelles stories suivantes ont été créées pour finaliser cette refonte :
1.  `story-b12-p6-1-refonte-layout-sale.md`
2.  `story-b12-p6-2-adaptation-salewizard.md`
3.  `story-b12-p6-3-tests-non-regression-caisse.md`

---

## État d'Avancement (Implémentation Partielle)

### ✅ Composants d'Infrastructure Créés

**1. Composant Numpad Unifié** (`frontend/src/components/ui/Numpad.tsx`)
- Pavé numérique réutilisable pour toutes les étapes (Poids, Quantité, Prix)
- Design cohérent avec touches 0-9, point décimal, effacer et backspace
- Adaptation responsive pour mobile/tablette
- Gestion d'affichage d'erreurs intégrée
- Personnalisable (unité, placeholder, avec/sans décimale)

**2. Header de Session** (`frontend/src/components/business/CashSessionHeader.tsx`)
- Header minimaliste pour mode kiosque
- Affiche le nom du caissier et l'ID de session
- Bouton "Fermer la Caisse" intégré
- Responsive mobile

**3. Configuration Mode Kiosque** (`frontend/src/App.jsx`)
- Route `/cash-register/sale` ajoutée aux routes kiosque
- Header principal automatiquement masqué sur cette page
- Layout adapté (padding à 0, height 100vh)

### ⚠️ Travaux Restants (Recommandations)

**Cette story nécessite une refonte architecturale majeure qui impacte ~10 composants.** Pour éviter les régressions et préserver la logique métier complexe (pesées multiples, calculs, validations), il est recommandé de découper en stories séparées :

#### Story Suivante 1 : Refonte Layout Sale.tsx
- Restructurer `Sale.tsx` en 2 colonnes (Numpad à gauche, Contenu dynamique à droite)
- Implémenter l'adaptation verticale (vh/fr units)
- Intégrer le `CashSessionHeader` au lieu du `PageLayout`
- Préserver l'état et les props du `SaleWizard`

#### Story Suivante 2 : Adaptation SaleWizard
- Séparer la logique d'orchestration de la présentation
- Créer des composants d'étapes spécialisés (WeightStep, QuantityStep, PriceStep)
- Intégrer le composant `Numpad` dans chaque étape
- Conserver tous les raccourcis clavier et le focus automatique

#### Story Suivante 3 : Tests et Validation
- Tests d'intégration du nouveau layout
- Validation des raccourcis clavier (Entrée, +, etc.)
- Tests de non-régression sur la logique métier
- Validation UX/Product Owner

### Dev Agent Record

#### Agent Model Used
- dev (James)

#### Tasks / Subtasks Checkboxes
- [x] Analyser l'architecture actuelle et identifier les composants à modifier
- [x] Créer le composant Numpad unifié réutilisable
- [x] Créer le header de session fin et discret
- [x] Masquer le header principal sur la page de caisse
- [ ] Refondre le layout de Sale.tsx en 2 colonnes avec adaptation verticale (Reporter en story séparée)
- [ ] Adapter SaleWizard pour orchestrer les étapes avec le nouveau layout (Reporter en story séparée)
- [ ] Implémenter l'étape Poids avec le nouveau design (Reporter en story séparée)
- [ ] Implémenter l'étape Quantité avec le nouveau design (Reporter en story séparée)
- [ ] Implémenter l'étape Prix avec le nouveau design (Reporter en story séparée)

#### File List (Fichiers Créés/Modifiés)
**Créés:**
- `frontend/src/components/ui/Numpad.tsx` - Pavé numérique unifié réutilisable
- `frontend/src/components/business/CashSessionHeader.tsx` - Header de session mode kiosque

**Modifiés:**
- `frontend/src/App.jsx` - Ajout route `/cash-register/sale` en mode kiosque

#### Change Log
- **Infrastructure UI créée** : Composants Numpad et CashSessionHeader prêts à l'emploi
- **Mode Kiosque activé** : Header principal masqué sur page de caisse, layout adapté
- **Scope réduit** : Implémentation partielle pour éviter régressions, suite à découper en stories séparées

#### Debug Log References
- N/A

#### Completion Notes
**Implémentation partielle stratégique** : Les composants d'infrastructure sont créés et testés (pas de lint errors), mais l'intégration complète nécessite une refonte architecturale majeure qui risquerait de casser la logique métier existante (pesées multiples, calculs, validations). Recommandation de découper en 3 stories séparées pour une livraison incrémentale et sûre.

**Prochaines étapes prioritaires:**
1. Créer story "Refonte Layout Sale.tsx" (layout 2 colonnes)
2. Créer story "Adaptation SaleWizard" (intégration Numpad)
3. Créer story "Tests et Validation" (non-régression)
