# Requirements

## Functional Requirements

**FR1:** Le bot Telegram doit permettre l'enregistrement vocal via commande `/depot` avec transcription automatique  
**FR2:** Le système IA (LangChain + Gemini 2.5 Flash) doit classifier automatiquement les objets selon les catégories EEE-1 à EEE-8  
**FR3:** L'utilisateur doit pouvoir confirmer ou corriger la classification proposée par l'IA  
**FR4:** L'interface caisse web doit permettre la saisie de vente avec sélection obligatoire de catégorie EEE  
**FR5:** L'interface caisse doit enregistrer le poids (kg) et prix (€) pour chaque transaction  
**FR6:** Le système doit gérer les types de paiement (espèces/CB) avec totaux journaliers temps réel  
**FR7:** Le système doit générer automatiquement les exports CSV format Ecologic par catégorie EEE  
**FR8:** Le système doit synchroniser automatiquement avec Infomaniak kDrive via WebDAV  
**FR9:** Le système doit sauvegarder automatiquement sur Infomaniak kDrive  
**FR10:** Le bot doit envoyer des notifications Telegram en cas d'échec de synchronisation  
**FR11:** Le système doit maintenir des comptes admin qui peuvent autoriser de nouveaux utilisateurs  
**FR12:** Toutes les actions utilisateur doivent être journalisées pour audit  
**FR13:** L'interface caisse doit être responsive (tablette/smartphone)  
**FR14:** Le système doit supporter la configuration par site (single-tenant par installation)  
**FR15:** Le bot doit fournir un lien d'inscription web quand un nouvel utilisateur l'contacte  
**FR16:** Le formulaire d'inscription doit collecter nom et contacts et notifier tous les admins  
**FR17:** L'admin qui valide doit notifier les autres admins de la validation  
**FR18:** Le système doit permettre l'ouverture/fermeture de sessions caisse  
**FR19:** L'ouverture de session doit proposer une invite pré-remplie (lecture calendrier)  
**FR20:** L'identification opérateur doit se faire via liste déroulante ergonomique ou mot de passe selon config admin  
**FR21:** Le système doit permettre la saisie catégorie, nombre, prix unitaire, poids pour chaque vente  
**FR22:** Le système doit prévoir la vente au poids selon catégories (fonctionnalité future)  
**FR23:** Le workflow d'encaissement doit être configurable par préférences utilisateur (post-MVP)  
**FR24:** Interface caisse doit avoir 3 modes séquentiels auto-follow (Catégorie → Quantité → Prix unitaire)  
**FR25:** Affichage ticket temps réel avec total cumulé  
**FR26:** Possibilité d'édition des lignes saisies  
**FR27:** Déverrouillage erreurs nécessitant validation admin  
**FR28:** Catégories avec sous-catégories déroulantes si besoin  
**FR29:** Journalisation complète temps réel (connexions, changements caisse, saisies, erreurs, déblocages)  
**FR30:** Sauvegarde BDD temps réel de chaque action utilisateur  
**FR31:** Interface accessible via navigateur local (localhost)  
**FR32:** Raccourcis clavier configurables (ex: Tab pour changer mode saisie)  
**FR33:** Support souris + clavier sur interface tactile  
**FR34:** Gestion fond de caisse initial à l'ouverture avec saisie montant  
**FR35:** Sélection mode de paiement par transaction (Espèces, Chèques optionnel)  
**FR36:** Calcul solde théorique temps réel (fond + encaissements)  
**FR37:** Fermeture caisse avec décompte physique et rapprochement théorique/réel  
**FR38:** Détection et signalement écarts de caisse  
**FR39:** Préparation fond de caisse jour suivant  
**FR40:** Impression tickets ouverture/fermeture caisse  
**FR41:** Journalisation complète des mouvements de caisse pour audit fiscal  
**FR42:** Gestion remises en banque (Post-MVP)  
**FR43:** Seuil d'alerte écart caisse configurable dans préférences admin  
**FR44:** Support multi-caisses simultanées par ressourcerie  

## Non-Functional Requirements

**NFR1:** Le temps de réponse de classification IA doit être <3 secondes en moyenne  
**NFR2:** Le système doit avoir >99% de disponibilité (uptime)  
**NFR3:** Les exports automatiques doivent avoir >99% de taux de succès  
**NFR4:** L'interface caisse doit se charger en <2 secondes  
**NFR5:** Le système doit supporter 5+ utilisateurs simultanés par site  
**NFR6:** Le mode offline doit permettre la synchronisation différée lors de reconnexion  
**NFR7:** Les données sensibles doivent être chiffrées en base  
**NFR8:** Les sauvegardes automatiques doivent être chiffrées  
**NFR9:** Le système doit fonctionner sur VPS avec coûts cloud <50€/mois/site  
**NFR10:** L'interface doit être compatible navigateurs modernes (Chrome/Firefox/Safari 2 dernières versions)  
**NFR11:** Le système doit supporter différents providers IA (Groq, Ollama local, OpenAI) en plus de Gemini (fallback optionnel)  
**NFR12:** Déploiement full Docker (conteneurisation complète)  
**NFR13:** Le système doit fonctionner en mode offline avec synchronisation automatique lors de la reconnexion  
**NFR14:** Indicateur visuel discret (rouge) en mode offline  
**NFR15:** Bot Telegram indisponible pendant coupures réseau (comportement normal)  
**NFR16:** Support PWA pour fonctionnement offline sur tablettes Android/iPad  
**NFR17:** Le système doit sauvegarder automatiquement l'état de session et restaurer après redémarrage/veille prolongée  
**NFR18:** Interface PWA installable sur tablettes (sans passage par stores)  
**NFR19:** Support déploiement serveur local via Docker ou Python (fallback machines anciennes)  

---
