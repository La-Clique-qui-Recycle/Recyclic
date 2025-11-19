# Epic 4: Bot Telegram IA & Classification

**Objectif :** Implémenter le cœur du système - le workflow vocal via Telegram avec classification automatique EEE. Les bénévoles peuvent enregistrer des dépôts par audio, l'IA classifie automatiquement, et l'utilisateur valide ou corrige. Délivre la valeur métier principale du projet.

## Story 4.1: Commande /depot et Enregistrement Vocal
As a volunteer at the depot,  
I want to use `/depot` command and send audio recordings,  
so that I can quickly register incoming items without typing.

**Acceptance Criteria:**
1. [x] Commande `/depot` active session d'enregistrement pour utilisateur autorisé
2. [x] Bot accepte messages vocaux (formats supportés : ogg, mp3, wav)
3. [x] L'audio est sauvegardé dans un stockage de fichiers
4. [x] Le chemin vers le fichier audio est enregistré en BDD avec un statut `pending_audio`
5. [x] Timeout session après 5 minutes d'inactivité
6. [x] Gestion erreurs : audio trop long, format non supporté, API indisponible

## Story 4.2: Classification IA EEE Automatique
As a volunteer,  
I want the system to automatically suggest EEE categories from my description,  
so that I don't need to memorize complex classification rules.

**Acceptance Criteria:**
1. [x] Pipeline LangChain + Gemini 2.5 Flash analyse transcription vocale
2. [x] Classification automatique selon catégories EEE-1 à EEE-8
3. [x] Retour classification avec score de confiance (0-100%)
4. [x] Si confiance <70%, proposer 2-3 catégories alternatives
5. [x] Prompt engineering optimisé pour objets ressourcerie (tests réels)
6. [x] Fallback règles locales si API IA indisponible

## Story 4.3: Validation et Correction Humaine
As a volunteer,  
I want to confirm or correct the AI classification,  
so that the data accuracy meets compliance requirements.

**Acceptance Criteria:**
1. [x] Bot présente classification proposée avec boutons inline Valider/Corriger
2. [x] Option "Corriger" affiche liste complète catégories EEE-1 à EEE-8
3. [x] Saisie quantité et poids via clavier inline ou message texte
4. [x] Validation finale enregistre dépôt complet en BDD
5. [x] Journalisation : classification IA originale + correction humaine
6. [x] Statistiques précision IA pour amélioration continue

---
