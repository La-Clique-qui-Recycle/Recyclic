---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.846041
original_path: docs/stories/story-b18-p2-frontend-interface-import-csv.md
---

# Story (Frontend): Interface d'Import avec Prévisualisation et Validation

**ID:** STORY-B18-P2
**Titre:** Interface d'Import avec Prévisualisation et Validation
**Epic:** Module d'Import de Données Manuelles
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** administrateur,  
**Je veux** une interface claire et guidée pour uploader des fichiers CSV, prévisualiser leur contenu, et confirmer leur import,  
**Afin de** pouvoir intégrer des données manuelles dans le système de manière simple et sécurisée.

## Contexte

Cette story crée l'interface utilisateur pour le module d'import. Elle doit guider l'utilisateur à travers le processus d'upload, de validation et de confirmation, en consommant les endpoints de l'API créés dans la story `STORY-B18-P2`.

## Critères d'Acceptation

1.  Une nouvelle page `/admin/import` est créée, accessible via le menu d'administration.
2.  La page contient deux sections distinctes : "Importer des Réceptions" et "Importer des Ventes".
3.  Chaque section contient :
    -   Un lien pour **télécharger le modèle CSV** correspondant (via les endpoints `GET /api/v1/import/templates/...`).
    -   Une zone de **drag-and-drop** pour uploader le fichier CSV rempli.
4.  Après l'upload d'un fichier, l'interface appelle l'endpoint `.../analyze` et affiche le **rapport de prévisualisation** :
    -   Un récapitulatif intelligent (nombre de lignes, période, etc.).
    -   Un tableau affichant un échantillon des premières lignes.
    -   Une liste claire des erreurs de validation, s'il y en a.
5.  Si le rapport d'analyse ne contient aucune erreur, un bouton **"Confirmer et Importer"** est affiché.
6.  Un clic sur ce bouton appelle l'endpoint `.../execute` et affiche une notification de succès ou d'échec pour l'import final.

## Notes Techniques

-   **Dépendance :** Cette story dépend de la story `STORY-B18-P2` (Backend).
-   **Gestion d'état :** Utiliser un store (Zustand) ou un hook React Query pour gérer les différentes étapes du workflow d'import (upload, analyse, confirmation).

## Definition of Done

- [ ] La page d'import est fonctionnelle avec ses deux sections.
- [ ] Le téléchargement des modèles CSV fonctionne.
- [ ] Le workflow d'upload, d'analyse et de prévisualisation est fonctionnel.
- [ ] L'import final peut être déclenché après une analyse réussie.
- [ ] La story a été validée par le Product Owner.
