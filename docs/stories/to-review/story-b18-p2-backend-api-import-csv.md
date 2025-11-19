---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.824083
original_path: docs/stories/story-b18-p2-backend-api-import-csv.md
---

# Story (Backend): API d'Analyse et d'Import de Fichiers CSV

**ID:** STORY-B18-P2
**Titre:** API d'Analyse et d'Import de Fichiers CSV (Réception et Ventes)
**Epic:** Module d'Import de Données Manuelles
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Développeur Backend,  
**Je veux** créer des endpoints API sécurisés et robustes pour analyser, valider, et importer des données depuis des fichiers CSV,  
**Afin de** permettre l'intégration des données de réception et de vente saisies manuellement.

## Contexte

Cette story est la fondation technique du module d'import. Elle doit gérer deux formats de CSV distincts (réception et ventes) et implémenter un workflow en deux temps (analyse puis exécution) pour garantir la sécurité et l'intégrité des données.

## Critères d'Acceptation

1.  **Endpoints d'Analyse :**
    -   `POST /api/v1/import/reception/analyze` : Accepte un fichier CSV, le valide par rapport aux en-têtes (`date,categorie,poids_kg,destination,notes`), vérifie la cohérence des données (formats, existence des catégories), et retourne un rapport de prévisualisation (récapitulatif, échantillon, erreurs).
    -   `POST /api/v1/import/sales/analyze` : Fait de même pour les ventes, en validant par rapport aux en-têtes (`date,categorie,quantite,poids_kg,prix_total,methode_paiement`).

2.  **Normalisation des Données :**
    -   Lors de l'analyse, la colonne `poids_kg` est automatiquement "nettoyée" avant validation : les virgules sont remplacées par des points, et tous les caractères non numériques (sauf le point) sont supprimés.

3.  **Endpoints d'Exécution :**
    -   `POST /api/v1/import/reception/execute` : Accepte un "ID de session d'import" (généré par l'étape d'analyse) et exécute l'écriture transactionnelle des données de réception en base.
    -   `POST /api/v1/import/sales/execute` : Fait de même pour les données de ventes.

4.  **Modèles de CSV :**
    -   Deux endpoints `GET /api/v1/import/templates/reception` et `GET /api/v1/import/templates/sales` permettent de télécharger les fichiers CSV modèles avec les bons en-têtes.

5.  **Sécurité et Robustesse :**
    -   Tous les endpoints sont protégés et accessibles uniquement par les rôles `ADMIN` et `SUPER_ADMIN`.
    -   L'import final (`execute`) est transactionnel : tout ou rien.

## Notes Techniques

-   **Validation :** Utiliser la bibliothèque `csv` de Python pour le parsing et Pydantic pour la validation de chaque ligne.
-   **Normalisation du Poids :** Avant de valider le champ `poids_kg`, appliquer une fonction de nettoyage qui remplace la virgule par un point et supprime les caractères non pertinents (espaces, apostrophes, etc.).
-   **Gestion d'état :** Le backend doit stocker temporairement le fichier validé entre l'étape `analyze` et `execute`, par exemple en le sauvegardant sur le disque avec un ID unique et une durée de vie limitée.

## Definition of Done

- [ ] Les 4 endpoints d'import (analyze/execute pour réception/ventes) sont fonctionnels et sécurisés.
- [ ] Les 2 endpoints pour télécharger les modèles sont fonctionnels.
- [ ] La validation des données, y compris la normalisation du poids, est robuste et l'import est transactionnel.
- [ ] La story a été validée par le Product Owner.
