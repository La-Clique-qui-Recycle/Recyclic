# Epic 2 : Cycle d'Inscription Utilisateur

## Objectif de l'Epic

Permettre aux nouveaux bénévoles de s'inscrire sur la plateforme Recyclic via un workflow complet incluant le bot Telegram et l'interface web.

## Description de l'Epic

Cet epic couvre tout le processus d'inscription des utilisateurs, de la première interaction avec le bot Telegram jusqu'à la soumission du formulaire web et la création de la demande d'inscription en base de données.

## Stories

### Story 2.1 : Bot Telegram + Interface Web d'Inscription ✅ TERMINÉE

**Titre** : Workflow complet d'inscription via bot Telegram et interface web.

**Description** : Implémentation du workflow d'inscription complet permettant aux nouveaux utilisateurs de s'inscrire via le bot Telegram et un formulaire web responsive.

**Critères d'Acceptation :**
- [x] Bot Telegram répond aux messages de nouveaux utilisateurs non autorisés
- [x] Bot fournit lien vers formulaire d'inscription web
- [x] Formulaire web collecte nom, prénom, contacts, ressourcerie
- [x] Soumission formulaire crée demande d'inscription en BDD
- [x] Gestion des erreurs (utilisateur déjà inscrit, bot indisponible)
- [x] Interface responsive (mobile-first)
- [x] Validation en temps réel côté client et serveur

**Fonctionnalités Implémentées :**

**Bot Telegram :**
- Handler d'inscription avec messages personnalisés
- Boutons inline pour redirection vers formulaire
- Détection des utilisateurs non autorisés
- Gestion des cas d'erreur (utilisateur déjà inscrit)

**Interface Web :**
- Formulaire React complet avec styled-components
- Validation côté client (champs obligatoires, format email, etc.)
- Chargement dynamique des ressourceries disponibles
- Messages d'erreur contextuels
- Design responsive mobile-first

**API Backend :**
- Endpoints CRUD complets pour les demandes d'inscription
- Validation Pydantic côté serveur
- Gestion des conflits (utilisateur existant, demande en cours)
- Codes de réponse appropriés (201, 400, 409, 500)

**Base de Données :**
- Table `registration_requests` avec tous les champs requis
- Relations avec les tables `sites` et `users`
- Indexes de performance
- Gestion des statuts (pending, approved, rejected)

**Status** : ✅ **TERMINÉE** - Workflow complet fonctionnel et testé.

## Résultats de l'Epic

**Score de Conformité :** 90% ✅

**Travail Accompli :**
- Bot Telegram opérationnel avec gestion des nouveaux utilisateurs
- Interface web d'inscription complète et responsive
- API backend robuste avec validation complète
- Base de données configurée avec tous les schémas
- Tests d'intégration validés

**Points d'Attention :**
- Notifications aux admins : code présent mais pas testé en conditions réelles
- Workflow d'approbation : à implémenter dans l'Epic 3

**Impact sur le Projet :**
- Processus d'onboarding utilisateur complet
- Interface utilisateur moderne et intuitive
- Base solide pour la gestion des utilisateurs
- Workflow prêt pour l'étape d'approbation administrative

## Documents Sources

- `docs/story-1-2-detailed.md`
- `docs/stories/1.2.bot-telegram-inscription.md`
- `bot/src/handlers/registration.py`
- `frontend/src/pages/Registration.jsx`
- `api/src/recyclic_api/api/api/api_v1/endpoints/registration_requests.py`
