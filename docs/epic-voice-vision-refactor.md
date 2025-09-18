## Epic Title

Refonte et Amélioration Avancée du Service de Reconnaissance Vocale et Visuelle - Amélioration Brownfield

## Epic Goal

Remplacer l'actuel service de transcription audio (Google Speech-to-Text) par le modèle `gemini-2.5-flash-lite` pour l'audio et l'image, avec un fallback OpenRouter/Whisper/LLM, afin d'aligner la solution technique avec les choix stratégiques du projet, d'optimiser le pipeline audio-vers-sortie structurée, et d'introduire des capacités d'analyse visuelle et de recherche agentique.

## Epic Description

**Existing System Context:**

- Current relevant functionality: Transcription audio via Google Speech-to-Text, classification via Google Gemini (utilisant LangChain).
- Technology stack: Python, LangChain, Google Cloud Speech-to-Text, Google Gemini API.
- Integration points: Le service de classification (`api/src/recyclic_api/services/classification_service.py`) et les endpoints associés.

**Enhancement Details:**

- What's being added/changed:
    - Transition de Google Speech-to-Text vers l'entrée audio directe du modèle `gemini-2.5-flash-lite` pour la transcription et la génération de sortie structurée.
    - Implémentation d'un mécanisme de gestion des limites de débit pour `gemini-2.5-flash-lite` (15 RPM, 250 000 TPM, 1000 RPD).
    - Mécanisme de fallback robuste utilisant OpenRouter (Whisper pour le Speech-to-Text, et un LLM séparé comme GPT-5 mini pour la classification) si les 1000 RPD de Gemini sont dépassées ou si Gemini n'est pas joignable.
    - Intégration de la capacité d'analyse d'images de `gemini-2.5-flash-lite` via Telegram.
    - Activation de l'option de recherche Google (500 RPD) dans `gemini-2.5-flash-lite` pour les requêtes agentiques.
    - Développement d'un compteur RPD visible dans le dashboard admin.
    - Utilisation des capacités agentiques de LangChain pour orchestrer les appels à Gemini (audio, image, recherche) et gérer les limites de débit.

- How it integrates: Le service `classification_service.py` sera refactorisé pour utiliser la nouvelle solution primaire et le mécanisme de fallback pour le traitement audio/visuel. Les capacités agentiques de LangChain seront au cœur de cette orchestration.
- Success criteria: `gemini-2.5-flash-lite` traite l'audio et l'image directement pour produire une sortie structurée. Le fallback OpenRouter/Whisper/LLM fonctionne correctement. Les limites de débit sont gérées automatiquement. L'option de recherche Google est activable. Un compteur RPD est visible. Les anciennes dépendances Google STT sont supprimées. Une analyse des coûts est effectuée. La documentation est mise à jour.

## Stories

1.  **Story 1: Intégration Primaire `gemini-2.5-flash-lite` Audio & Visuel avec Gestion des Limites**
    *   **Objectif :** Intégrer `gemini-2.5-flash-lite` comme moteur principal pour l'analyse audio et visuelle, en respectant ses limites de débit.
    *   **Description :** Effectuer un Proof of Concept pour confirmer l'API exacte de `gemini-2.5-flash-lite` pour l'entrée audio et image. Affiner l'ingénierie des prompts pour permettre à Gemini de générer une sortie structurée directement à partir de l'audio ou de l'image. Remplacer l'intégration actuelle de Google Speech-to-Text par cette nouvelle approche Gemini. Implémenter un mécanisme de pause/timer pour gérer les 15 RPM et 250 000 TPM.

2.  **Story 2: Implémentation du Fallback OpenRouter et Compteur RPD**
    *   **Objectif :** Assurer la robustesse du système avec un mécanisme de repli fiable et une visibilité sur l'utilisation.
    *   **Description :** Mettre en place le mécanisme de fallback via OpenRouter (Whisper pour la transcription audio, LLM comme GPT-5 mini pour la classification) qui s'active si les 1000 RPD de `gemini-2.5-flash-lite` sont dépassées ou si Gemini n'est pas joignable. Développer un compteur de RPD pour `gemini-2.5-flash-lite` et l'intégrer dans le dashboard admin.

3.  **Story 3: Capacités Agentiques LangChain et Recherche Google**
    *   **Objectif :** Exploiter les capacités agentiques de LangChain pour des interactions avancées et la recherche d'informations.
    *   **Description :** Activer et intégrer l'option de recherche Google (500 RPD) de `gemini-2.5-flash-lite` via LangChain. Développer des agents LangChain capables d'utiliser l'analyse d'images et la recherche Google pour répondre à des requêtes complexes (ex: photographier un objet et rechercher sa documentation). Étudier les capacités de LangChain pour compter les tokens, réduire les appels et gérer les temporisations pour les requêtes agentiques.

4.  **Story 4: Nettoyage, Coûts et Documentation**
    *   **Objectif :** Finaliser l'intégration, optimiser les coûts et maintenir la documentation à jour.
    *   **Description :** Réaliser une analyse détaillée des coûts pour les solutions primaire (Gemini) et de fallback (OpenRouter/Whisper/LLM) en fonction des volumes d'utilisation prévus. Supprimer toutes les dépendances et le code obsolètes liés à Google Speech-to-Text. Mettre à jour l'architecture et la documentation des services pour refléter cette nouvelle approche.

## Compatibility Requirements

-   Les APIs existantes (pour le service de classification) doivent rester fonctionnelles.
-   Aucune régression ne doit être introduite dans la fonctionnalité de classification existante.
-   L'impact sur les performances doit être minimal ou amélioré.

## Risk Mitigation

-   **Primary Risk:** Complexité de l'intégration des nouvelles APIs audio/visuelles de Gemini, gestion précise des limites de débit, et garantie d'un fallback transparent.
-   **Mitigation:** Implémentation par phases (primaire puis fallback), tests unitaires et d'intégration approfondis, documentation détaillée des processus et des mécanismes de gestion des limites.
-   **Rollback Plan:** Possibilité de revenir à l'implémentation précédente basée sur Google Speech-to-Text en cas de problèmes majeurs.

## Definition of Done

-   Toutes les stories sont complétées avec leurs critères d'acceptation respectés.
-   Le traitement audio/visuel primaire (`gemini-2.5-flash-lite`) et le fallback (OpenRouter/Whisper/LLM) sont entièrement fonctionnels.
-   Les limites de débit de Gemini sont gérées automatiquement et efficacement.
-   L'option de recherche Google est activable et fonctionnelle.
-   Le compteur RPD est visible dans le dashboard admin.
-   L'analyse d'images via Telegram est fonctionnelle.
-   L'analyse des coûts est revue et validée.
-   Les anciennes dépendances Google Speech-to-Text sont supprimées.
-   La documentation (architecture, services) est mise à jour.
-   Aucune régression n'est observée sur les fonctionnalités existantes.

---

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

-   This is an enhancement to an existing system running Python, LangChain, Google Gemini.
-   Integration points: `api/src/recyclic_api/services/classification_service.py` et l'intégration Telegram.
-   Existing patterns to follow: Utilisation de LangChain pour la classification et l'orchestration agentique.
-   Critical compatibility requirements: Maintien de la fonctionnalité de classification existante, des performances, et gestion stricte des limites de débit des APIs.
-   Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering une refonte stratégique et une extension des capacités du service de reconnaissance vocale et visuelle."

---
