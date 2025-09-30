# Epic: MVP Réception V1 - Brownfield Enhancement

## Epic Goal
L'objectif de cet Epic est de développer un premier prototype fonctionnel (MVP) pour le processus de réception des dépôts. Il doit permettre à un bénévole d'enregistrer les objets entrants via une interface web simple, en se basant sur un nouveau système de catégories robuste et évolutif.

## Epic Description

**Existing System Context:**
- **Current relevant functionality:** Le système actuel possède une logique de catégories rigide (Enums Python, chaînes de caractères) utilisée pour les ventes et les dépôts via un bot Telegram. Cette logique est fragmentée et non évolutive.
- **Technology stack:** React (Frontend), FastAPI/Python (Backend), PostgreSQL (DB).
- **Integration points:** Cet Epic va introduire de nouvelles tables dans la base de données et de nouvelles routes API. Il n'interférera pas directement avec la logique de caisse existante dans un premier temps, mais la remplacera à terme.

**Enhancement Details:**
- **What's being added/changed:** Un nouveau module de réception complet, incluant un modèle de données hiérarchique pour les catégories, les API nécessaires, et une interface utilisateur dédiée pour la saisie des dépôts.
- **How it integrates:** Les nouvelles tables et API fonctionneront en parallèle de l'ancien système. Le frontend appellera exclusivement ces nouvelles API pour le module de réception.
- **Success criteria:** Un bénévole peut ouvrir un poste, créer un ticket, y ajouter des lignes avec poids et catégorie (parmi les 14 L1), et clôturer le ticket. Les données doivent être correctement enregistrées dans les nouvelles tables de la base de données.

## Stories

1.  **Story 1: DB - Création du Schéma de Réception.** Créer les nouvelles tables (`dom_category`, `ticket_depot`, etc.) et les modèles SQLAlchemy correspondants, ainsi que le script de seeding pour les 14 catégories L1.
2.  **Story 2: BE - API de Gestion des Postes et Tickets.** Développer les endpoints API pour ouvrir/fermer un poste de réception et pour créer/clôturer un ticket de dépôt.
3.  **Story 3: BE - API de Gestion des Lignes de Dépôt.** Développer les endpoints API pour ajouter, modifier ou supprimer des lignes (catégorie, poids) à un ticket.
4.  **Story 4: FE - Écran d'Accueil et de Gestion de Poste.** Créer l'interface utilisateur permettant à un bénévole d'ouvrir ou de voir l'état de son poste de réception.
5.  **Story 5: FE - Écran de Saisie de Ticket.** Créer l'interface principale permettant d'ajouter des lignes (via une grille de sélection des 14 catégories L1 et une saisie de poids) et de visualiser le contenu d'un ticket.

## Compatibility Requirements
- [X] Existing APIs remain unchanged (les nouvelles API sont des ajouts).
- [X] Database schema changes are backward compatible (les nouvelles tables n'affectent pas les anciennes).
- [X] UI changes follow existing patterns.
- [X] Performance impact is minimal.

## Risk Mitigation
- **Primary Risk:** Créer une divergence technique entre le nouveau système de réception et l'ancien système de caisse.
- **Mitigation:** Ce risque est accepté. Il sera résolu dans un Epic futur dédié à la refonte de la caisse, qui migrera vers ce nouveau modèle de données unifié.
- **Rollback Plan:** Désactiver les nouvelles routes API et masquer les liens vers la nouvelle interface de réception. Les migrations de base de données peuvent être annulées via `alembic downgrade`.

## Definition of Done
- [ ] Toutes les stories listées sont terminées et leurs critères d'acceptation sont remplis.
- [ ] Le workflow complet (ouverture de poste -> création ticket -> ajout de lignes -> clôture) est fonctionnel et testable.
- [ ] Les données sont persistées correctement dans la nouvelle structure de base de données.
- [ ] Aucune régression n'est détectée sur les fonctionnalités existantes (connexion, administration, etc.).
