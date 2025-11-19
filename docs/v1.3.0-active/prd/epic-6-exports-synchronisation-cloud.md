# Epic 4: Exports & Synchronisation Cloud

**Objectif :** Assurer la conformité réglementaire avec exports automatiques Ecologic, synchronisation cloud temps réel, et dashboard admin complet. Délivre la compliance obligatoire et les outils de pilotage pour les responsables.

## Story 4.1: Exports CSV Format Ecologic
As an association manager,  
I want automatic Ecologic-compliant CSV exports,  
so that regulatory reporting is effortless and always accurate.

**Acceptance Criteria:**
1. Génération automatique exports CSV agrégés par catégorie EEE-1 à EEE-8
2. Format strict Ecologic avec validation schéma avant export
3. Exports programmables (quotidien, hebdomadaire, mensuel, trimestriel)
4. Inclusion données dépôts + ventes avec calculs de flux
5. Archivage local exports avec horodatage et versioning
6. Validation test format avec échantillon Ecologic réel

## Story 4.2: Synchronisation Cloud Automatique
As an association manager,  
I want automatic cloud synchronization with Infomaniak kDrive,  
so that data is safely backed up and accessible to partners.

**Acceptance Criteria:**
1. **Setup Infomaniak kDrive :**
   - Création compte Infomaniak kDrive (action utilisateur)
   - Génération app password WebDAV depuis interface Infomaniak
   - Test connexion WebDAV avec credentials utilisateur
   - Configuration structure dossiers (exports/, backups/, audio/, logs/)
2. Upload automatique Infomaniak kDrive via WebDAV
3. Queue de retry avec backoff exponentiel en cas d'échec
4. Notifications Telegram admins en cas d'échec sync >24h
5. Dashboard statut synchronisation (dernière sync, statut, erreurs)
6. Configuration multi-comptes kDrive par ressourcerie

## Story 4.3: Dashboard Admin & Gestion Multi-Caisses
As an admin,  
I want a comprehensive admin dashboard with multi-register management,  
so that I can monitor operations and configure system settings.

**Acceptance Criteria:**
1. Vue d'ensemble temps réel : caisses ouvertes/fermées, totaux jour
2. Gestion des seuils d'alerte écart caisse (configurable par caisse)
3. Historique des sessions caisse avec détails opérateurs
4. Configuration multi-sites et personnalisation (couleurs, logo, seuils)
5. Gestion utilisateurs : whitelist, rôles, permissions
6. Logs système et audit trail complets avec filtres

## Story 4.4: Documentation Utilisateur & Formation
As a resource center manager,  
I want comprehensive user documentation and training materials,  
so that my team can use the system autonomously and efficiently.

**Acceptance Criteria:**
1. **Guide utilisateur Bot Telegram :**
   - Commandes disponibles (/depot, /help, /status)
   - Workflow enregistrement vocal avec captures écran
   - Gestion erreurs et validation/correction classifications
2. **Manuel interface caisse :**
   - Ouverture/fermeture session avec contrôles caisse
   - Workflow vente 3 modes (Catégorie → Quantité → Prix)
   - Gestion erreurs et déverrouillages admin
3. **Guide admin dashboard :**
   - Configuration multi-sites et personnalisation
   - Gestion utilisateurs et whitelist Telegram
   - Exports et synchronisation cloud
4. **Troubleshooting et FAQ :**
   - Résolution problèmes courants (mode offline, sync échecs)
   - Contact support et maintenance
5. **Matériels de formation :**
   - Checklist formation new user (2h max)
   - Vidéos courtes workflow essentiels

## Story 4.5: Monitoring & Notifications
As an admin,  
I want proactive monitoring with intelligent notifications,  
so that I'm alerted to issues before they impact operations.

**Acceptance Criteria:**
1. Monitoring uptime API + bot Telegram avec alertes auto
2. Détection anomalies : écarts caisse répétés, échecs sync, erreurs IA
3. Notifications Telegram configurables par type d'événement
4. Dashboard santé système (performance IA, taux d'erreur, usage)
5. Rapports automatiques hebdomadaires (KPIs, statistiques usage)
6. Système de maintenance préventive avec recommandations

---
