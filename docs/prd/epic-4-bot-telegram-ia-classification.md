# Epic 2: Bot Telegram IA & Classification

**Objectif :** Implémenter le cœur du système - le workflow vocal via Telegram avec classification automatique EEE. Les bénévoles peuvent enregistrer des dépôts par audio, l'IA classifie automatiquement, et l'utilisateur valide ou corrige. Délivre la valeur métier principale du projet.

## Story 2.1: Commande /depot et Enregistrement Vocal
As a volunteer at the depot,  
I want to use `/depot` command and send audio recordings,  
so that I can quickly register incoming items without typing.

**Acceptance Criteria:**
1. Commande `/depot` active session d'enregistrement pour utilisateur autorisé
2. Bot accepte messages vocaux (formats supportés : ogg, mp3, wav)
3. Transcription audio vers texte via API (Gemini ou fallback)
4. Sauvegarde audio original + transcription en BDD avec horodatage
5. Timeout session après 5 minutes d'inactivité
6. Gestion erreurs : audio trop long, format non supporté, API indisponible

## Story 2.2: Classification IA EEE Automatique
As a volunteer,  
I want the system to automatically suggest EEE categories from my description,  
so that I don't need to memorize complex classification rules.

**Acceptance Criteria:**
1. Pipeline LangChain + Gemini 2.5 Flash analyse transcription vocale
2. Classification automatique selon catégories EEE-1 à EEE-8
3. Retour classification avec score de confiance (0-100%)
4. Si confiance <70%, proposer 2-3 catégories alternatives
5. Prompt engineering optimisé pour objets ressourcerie (tests réels)
6. Fallback règles locales si API IA indisponible

## Story 2.3: Validation et Correction Humaine
As a volunteer,  
I want to confirm or correct the AI classification,  
so that the data accuracy meets compliance requirements.

**Acceptance Criteria:**
1. Bot présente classification proposée avec boutons inline Valider/Corriger
2. Option "Corriger" affiche liste complète catégories EEE-1 à EEE-8
3. Saisie quantité et poids via clavier inline ou message texte
4. Validation finale enregistre dépôt complet en BDD
5. Journalisation : classification IA originale + correction humaine
6. Statistiques précision IA pour amélioration continue

---
