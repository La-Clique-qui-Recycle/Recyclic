# Epic: Module d'Import de Données Manuelles

**ID:** EPIC-IMPORT
**Titre:** Module d'Import de Données Manuelles (CSV et IA)
**Statut:** Défini
**Priorité:** P2 (Élevée)

---

## 1. Objectif de l'Epic

Fournir un moyen robuste et efficace pour intégrer dans Recyclic les données saisies manuellement sur papier (cahiers de réception et de caisse). L'objectif est de combler le fossé entre les opérations offline et le système numérique, en garantissant l'intégrité et la complétude des données.

## 2. Description

Cet epic se déroule en deux phases stratégiques :

-   **Phase 1 (MVP) : Import par Fichier CSV.** Mettre en place un système d'import de fichiers CSV structurés, avec un workflow de validation par l'utilisateur. C'est la fondation technique et la solution à court terme.
-   **Phase 2 (Vision à Long Terme) : Import par IA.** Faire évoluer le module pour permettre l'upload de photos/scans des cahiers, avec une reconnaissance de caractères (OCR) et une structuration des données par une IA (Gemini), suivie d'une validation par l'utilisateur.

Cette story se concentre sur la **Phase 1**.

## 3. Stories de l'Epic (Phase 1)

1.  **Story 1 (Backend) :** API d'Analyse et d'Import de Fichiers CSV.
2.  **Story 2 (Frontend) :** Interface d'Import avec Prévisualisation et Validation.

## 4. Definition of Done (pour l'Epic - Phase 1)

- [ ] Les 2 stories de la Phase 1 sont terminées et validées.
- [ ] Un administrateur peut télécharger des modèles CSV, uploader des fichiers remplis, prévisualiser les données, et les importer de manière sécurisée dans la base de données.
