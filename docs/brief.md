# Project Brief: Recyclic

**Author:** Analyst (Mary)  
**Date:** 2025-09-09  
**Version:** 2.0 - Finalized Technical Specifications

## Executive Summary

**Recyclic** est une solution open source complète de gestion pour ressourceries, conçue spécifiquement pour les associations de réemploi. Le système intègre un bot Telegram intelligent avec IA pour l'enregistrement vocal des dépôts, une interface de caisse responsive, et des exports automatisés vers les partenaires réglementaires (Ecologic). La solution vise à remplacer les processus manuels actuels (Excel, papier) par un workflow numérique simple et conforme.

**Valeur clé :** Simplification drastique des tâches administratives tout en assurant la conformité réglementaire et la traçabilité des flux de déchets d'équipements électriques et électroniques (EEE).

## Problem Statement

### Current State & Pain Points

Les ressourceries françaises font face à des défis opérationnels critiques :

- **Processus manuels chronophages** : Saisie papier/Excel pour dépôts et ventes, ressaisie multiple des mêmes données
- **Non-conformité réglementaire** : Difficultés à produire les rapports Ecologic obligatoires, risque de sanctions
- **Solutions inadaptées** : ERP existants (GDR) trop complexes et coûteux pour des associations gérées par des bénévoles
- **Perte de données** : Fichiers Excel corrompus, synchronisation manuelle défaillante
- **Surcharge administrative** : Temps précieux détourné de la mission sociale de réemploi

### Impact & Urgency

- **Temps perdu** : 2-3h/jour de saisie administrative par structure
- **Risque financier** : Amendes potentielles pour non-conformité Ecologic
- **Frein au développement** : Impossibilité de croître sans outils adaptés
- **Découragement bénévoles** : Tâches répétitives nuisent à l'engagement

### Why Existing Solutions Fall Short

- **GDR** : Interface complexe, coût prohibitif (>200€/mois), formation longue
- **ERP génériques** : Surdimensionnés, pas de spécificités EEE intégrées
- **Solutions propriétaires** : Vendor lock-in, pas d'adaptabilité associative

## Proposed Solution

### Core Concept

**Recyclic** propose une approche révolutionnaire basée sur l'**intelligence artificielle conversationnelle** et la **simplicité d'usage**. Le système orchestre trois composants principaux :

1. **Bot Telegram IA** : Enregistrement vocal instantané des dépôts avec classification automatique EEE
2. **Interface caisse web** : Vente simplifiée avec catégories obligatoires et exports temps réel
3. **Moteur de synchronisation** : Exports automatiques vers partenaires (Ecologic, Infomaniak, Google Sheets)

### Key Differentiators

- **Technologie LangChain + Gemini 2.5 Flash** : Pipeline vocal→classification en une seule API call
- **Conception associative native** : Adapté aux compétences et contraintes des bénévoles
- **Open source & modulaire** : Évolution communautaire, pas de vendor lock-in
- **Déploiement flexible** : VPS, serveur local, ou cloud selon besoins
- **Conformité by design** : Exports Ecologic intégrés dès le MVP

### Why This Solution Will Succeed

- **Adoption naturelle** : Telegram déjà utilisé, vocal plus rapide que saisie
- **Validation terrain** : Co-conçu avec ressourceries actives
- **Stack moderne et stable** : FastAPI + LangChain + SQLite/Postgres
- **Communauté cible** : Mouvement open source aligné avec valeurs associatives

## Target Users

### Primary User Segment: Opérateurs de terrain (Bénévoles/Salariés)

**Profile :**
- Âge : 35-65 ans, compétences numériques variables
- Contexte : Travail en flux, environnement parfois bruyant
- Équipement : Smartphone personnel, tablette/PC partagé

**Current Behaviors :**
- Saisie manuelle sur feuilles volantes puis ressaisie Excel
- Utilisation basique de WhatsApp/Telegram personnel
- Pesée manuelle avec balance analogique

**Needs & Pain Points :**
- **Rapidité** : Dépôt saisi en <15 secondes pendant affluence
- **Simplicité** : Pas de formation complexe nécessaire
- **Fiabilité** : Pas de perte de données en cas de problème technique

**Goals :**
- Se concentrer sur l'accueil et le conseil aux déposants
- Éviter les erreurs de saisie répétitives
- Contribuer efficacement à la mission associative

### Secondary User Segment: Responsables associatifs

**Profile :**
- Présidents, trésoriers, coordinateurs salariés
- Responsabilité juridique et financière
- Compétences bureautiques moyennes à bonnes

**Current Behaviors :**
- Consolidation manuelle des données pour rapports
- Export Excel vers comptabilité
- Communication par email avec partenaires

**Needs & Pain Points :**
- **Conformité réglementaire** assurée sans expertise technique
- **Visibilité temps réel** sur les flux et performances
- **Rapports automatisés** pour assemblées générales

**Goals :**
- Sécuriser juridiquement l'association
- Optimiser les ressources humaines bénévoles
- Démontrer l'impact environnemental aux financeurs

## Goals & Success Metrics

### Business Objectives
- **Adoption rapide** : >80% des dépôts saisis via Recyclic dès 2 semaines de déploiement
- **Conformité réglementaire** : 100% des exports Ecologic acceptés sans retraitement
- **Économie de temps** : Réduction de 70% du temps administratif (de 3h à <1h/jour)
- **Croissance du réemploi** : Capacité d'augmenter les volumes traités sans surcharge administrative

### User Success Metrics
- **Vitesse de saisie** : Dépôt enregistré en <15 secondes (vs 2-3 minutes actuellement)
- **Facilité de vente** : Transaction complète en <5 clics
- **Précision des données** : <5% d'erreurs de classification (vs 15-20% manuel)
- **Satisfaction utilisateur** : >85% des opérateurs jugent l'outil "simple à utiliser"

### Key Performance Indicators (KPIs)
- **Taux d'adoption** : % de dépôts saisis via bot vs total (objectif >80%)
- **Temps de réponse système** : <2 secondes pour classification IA
- **Disponibilité** : >99% uptime du système central
- **Synchronisation cloud** : >99% de succès des exports automatiques
- **Support technique** : <1 demande/semaine/site après formation initiale

## MVP Scope

### Core Features (Must Have)

- **Bot Telegram avec IA conversationnelle :**
  - Commande `/depot` avec enregistrement vocal
  - Classification automatique EEE-1 à EEE-8 via Gemini 2.5 Flash + LangChain
  - Validation humaine obligatoire (confirmation/correction)
  - Whitelist des utilisateurs autorisés
  - Journalisation complète des actions

- **Interface de caisse web responsive :**
  - Sélection obligatoire catégorie EEE (1-8)
  - Saisie poids (kg) et prix (€)
  - Gestion paiement espèces/CB
  - Totaux journaliers temps réel
  - Compatible tablette/smartphone

- **Base de données centralisée :**
  - SQLite pour démarrage, migration Postgres transparente
  - Schémas `deposits`, `sales`, `categories`, `sites`
  - Horodatage et traçabilité complète

- **Exports et synchronisation :**
  - CSV format Ecologic (agrégation par catégorie EEE)
  - Upload automatique vers Infomaniak kDrive (WebDAV)
  - Synchronisation Google Sheets temps réel
  - Notifications Telegram en cas d'échec

- **Architecture technique :**
  - Backend FastAPI (Python) avec LangChain
  - Déploiement Docker Compose
  - Mode offline avec synchronisation différée
  - Configuration multi-sites

### Out of Scope for MVP
- Étiquettes QR codes / codes-barres
- Connexion balances automatiques (USB/réseau)
- Gestion bénévoles, adhérents, cotisations
- Module multimédia (musique, annonces)
- API publique pour sites web
- Interface mobile native (PWA suffisante)
- Gestion des dons financiers
- Rapports avancés et analytics

### MVP Success Criteria

**Fonctionnel :**
- Une ressourcerie pilote utilise le système en production pendant 1 mois
- Export Ecologic trimestriel généré et accepté sans modification
- 50+ dépôts traités via bot avec <10% de corrections manuelles

**Technique :**
- Système stable sur VPS avec <1% de downtime
- Temps de réponse IA <3 secondes en moyenne
- Sauvegarde automatique et restauration testées

**Utilisateur :**
- Formation de l'équipe effectuée en <2h
- Autonomie complète après 1 semaine d'usage
- Retours utilisateurs positifs (questionnaire satisfaction)

## Post-MVP Vision

### Phase 2 Features
- **Étiquettes intelligentes** : QR codes liant dépôt → vente avec historique complet
- **Balances connectées** : Pesée automatique USB/réseau
- **Gestion communauté** : Module bénévoles, adhérents, dons avec CRM intégré
- **API publique** : Exposition données anonymisées pour sites web (objets stars, statistiques)
- **Multi-sites avancé** : Administration centralisée, consolidation inter-sites

### Long-term Vision (1-2 ans)
- **Poste de tri assisté IA** : Reconnaissance visuelle automatique (caméra + pré-classification)
- **Recommandation prix intelligente** : IA de pricing basée sur données marché
- **Écosystème intégré** : Module multimédia, gestion événements, communication
- **Plateforme territoriale** : Interconnexion ressourceries d'une région
- **Analytics avancées** : Tableaux de bord décisionnels, prédictions de flux

### Expansion Opportunities
- **Autres filières REP** : Extension au-delà d'Ecologic (textile, mobilier, jouets)
- **Collectivités locales** : Intégration déchèteries municipales
- **Réseaux nationaux** : Déploiement Emmaüs, Envie, etc.
- **Export international** : Adaptation réglementations européennes
- **Marketplace solidaire** : Plateforme de vente en ligne inter-ressourceries

## Technical Considerations

### Platform Requirements
- **Target Platforms :** 
  - Web responsive (tablettes Android/iPad, PC Windows/Linux/Mac)
  - Bot Telegram (natif mobile iOS/Android)
  - Serveur Linux (Ubuntu 22.04 LTS recommandé)
- **Browser Support :** Chrome/Firefox/Safari modernes (2 dernières versions)
- **Performance Requirements :** 
  - <2s chargement interface caisse
  - <3s classification IA vocale
  - Support 5+ utilisateurs simultanés par site

### Technology Preferences
- **Frontend :** SPA légère (Svelte recommandé) ou HTMX pour simplicité
- **Backend :** FastAPI (Python 3.11+) avec LangChain pour orchestration IA
- **Database :** SQLite (développement/petits sites) → PostgreSQL (production/multi-sites)
- **Bot Framework :** python-telegram-bot avec intégration LangChain
- **IA/ML :** Gemini 2.5 Flash API (transcription + classification), fallback règles locales
- **Hosting/Infrastructure :** Docker Compose, compatible VPS/serveur local

### Architecture Considerations
- **Repository Structure :** Monorepo avec services séparés (api/, bot/, frontend/, docs/)
- **Service Architecture :** 
  - Microservices légers communicant via API REST
  - Queue Redis pour tâches asynchrones (exports, notifications)
  - Reverse proxy Nginx pour routage et SSL
- **Integration Requirements :**
  - Telegram Bot API
  - Google Sheets API v4
  - Infomaniak kDrive WebDAV
  - Gemini AI API avec gestion quotas
- **Security/Compliance :**
  - RBAC simple (admin/opérateur/lecture)
  - Chiffrement données sensibles
  - Logs audit complets pour conformité
  - Sauvegarde automatique chiffrée

## Constraints & Assumptions

### Constraints
- **Budget :** Projet bénévole/associatif, coûts cloud minimisés (<50€/mois/site)
- **Timeline :** MVP fonctionnel en 3-4 semaines de développement
- **Resources :** 1 développeur full-stack, support communauté open source
- **Technical :** 
  - Connexions internet parfois limitées (ADSL rural)
  - Matériel hétérogène (tablettes anciennes, PC récupérés)
  - Pas de budget formation approfondie

### Key Assumptions
- Les ressourceries partenaires acceptent d'utiliser Telegram professionnel
- API Gemini 2.5 Flash reste gratuite/accessible pour volumes MVP
- Équipes disposent d'au moins 1 smartphone/tablette par poste
- Connexion internet suffisante pour sync quotidienne (même si débit limité)
- Bénévoles motivés pour changement de processus si gain évident
- Réglementation Ecologic stable pendant développement MVP

## Risks & Open Questions

### Key Risks
- **IA Classification imprécise :** Gemini peut mal classifier objets atypiques → Mitigation : validation humaine obligatoire + règles fallback locales
- **Adoption résistante :** Bénévoles réfractaires au changement → Mitigation : formation ludique + démonstration gains de temps
- **Dépendance API externe :** Quotas Gemini dépassés → Mitigation : règles de classification locales + modèle LLM auto-hébergé
- **Complexité réglementaire :** Évolution formats Ecologic → Mitigation : architecture modulaire exports + veille réglementaire
- **Maintenance technique :** Compétences limitées après déploiement → Mitigation : documentation exhaustive + formation admin local

### Open Questions
- Format exact CSV Ecologic 2025 ? (vérification auprès partenaire)
- Volumétrie réelle par site pour dimensionnement serveur ?
- Niveau de personnalisation nécessaire par ressourcerie ?
- Intégration comptabilité existante (Sage, Ciel) prioritaire ?
- Modèle économique pérenne pour maintenance long terme ?

### Areas Needing Further Research
- Benchmark précis solutions existantes (GDR, concurrents)
- Test utilisabilité interface avec panel bénévoles représentatifs
- Validation technique LangChain + Gemini sur cas réels
- Étude faisabilité hébergement mutualisé inter-ressourceries
- Analyse juridique responsabilités données personnelles

## Appendices

### A. Research Summary

**Market Research :**
- 150+ ressourceries en France avec besoins similaires
- Croissance 15% annual du secteur réemploi
- Obligations réglementaires renforcées (loi AGEC)

**Technical Feasibility :**
- LangChain + Gemini 2.5 Flash validé pour transcription+classification
- FastAPI proven pour API rapides et documentation auto
- Docker Compose standard pour déploiements associatifs

**User Validation :**
- 3 ressourceries partenaires confirment besoins terrain
- Tests informels bot Telegram très positifs
- Interface caisse responsive validée sur tablettes existantes

### B. Stakeholder Input

**Partenaire Ecologic :** Confirmation format CSV, ouverture API future  
**Ressourceries pilotes :** Priorité absolue simplicité d'usage  
**Développeurs communauté :** Intérêt fort pour contribution open source  

### C. References

- [Réglementation Ecologic](https://www.ecologic-france.com)
- [Loi AGEC réemploi](https://www.legifrance.gouv.fr)
- [Documentation LangChain](https://langchain.readthedocs.io)
- [Gemini AI API](https://ai.google.dev/gemini-api/docs)

## Next Steps

### Immediate Actions

1. **Validation finale partenaires** : Confirmer format exports Ecologic Q4 2025
2. **Setup environnement dev** : Repository GitHub + Docker Compose + CI/CD
3. **Architecture détaillée** : Passage au Project Manager pour PRD technique
4. **Ressourcerie pilote** : Sélection site test + planning déploiement
5. **Prototype IA** : POC LangChain + Gemini classification EEE

### PM Handoff

Ce Project Brief fournit le contexte complet pour **Recyclic**. L'analyse est finalisée avec les spécifications techniques validées (FastAPI + LangChain + Gemini 2.5 Flash). 

**Prochaine étape :** Le Project Manager doit démarrer en **'PRD Generation Mode'**, réviser ce brief en détail et travailler avec l'utilisateur pour créer le PRD section par section selon le template, en demandant clarifications nécessaires et suggérant améliorations.

**Focus PM :** Architecture technique détaillée, planification sprints MVP, setup environnement de développement.