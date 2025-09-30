# Roadmap pour la Réception V2 et au-delà

Ce document sert de backlog pour les fonctionnalités futures liées au module de réception, à prioriser après le déploiement du MVP V1.

## Logique de Catégories Avancée

- **[P2] Mapping avec les Éco-organismes :**
  - Créer les tables `ref_partner`, `ext_category`, `map_category`.
  - Développer une interface d'administration pour gérer le mapping entre les catégories internes (`dom_category`) et les catégories des partenaires (Ecologic, Ecomaison, etc.).
  - Générer des exports conformes aux formats des partenaires.

- **[P3] Gestion Hiérarchique Complète :**
  - Permettre aux administrateurs de créer et gérer des catégories L2/L3.
  - Potentiellement utiliser un LLM pour aider à la normalisation des libellés et à la suggestion d'icônes lors de la création.

## Interface et Saisie Améliorée

- **[P2] Saisie Vocale via l'Interface Web :**
  - Intégrer un bouton "micro" dans l'écran de saisie des lignes.
  - Utiliser un service de transcription pour convertir la voix en texte (ex: "aspirateur 5kg, lot de vaisselle 2kg").
  - Parser le texte pour créer automatiquement plusieurs lignes de dépôt.

- **[P3] Assistance par IA à la Saisie :**
  - Utiliser la caméra du téléphone/PC pour prendre une photo d'un objet.
  - Envoyer l'image à un service d'analyse (modèle multimodal) pour suggérer automatiquement la catégorie, un titre, et potentiellement des attributs ou des risques.
  - L'utilisateur valide ou corrige la suggestion (workflow "Human-in-the-Loop").

## Intégrations Externes et Bot

- **[P3] Balances Connectées :**
  - Étudier la faisabilité d'une intégration avec des balances connectées (USB/BLE) pour remplir automatiquement le champ "poids".

- **[P4] Réévaluation du Bot Telegram :**
  - Analyser si le workflow de saisie via le bot Telegram est toujours pertinent une fois l'application web en place et mature.
  - Si oui, refactorer le bot pour qu'il utilise les nouvelles API et le nouveau modèle de données.
