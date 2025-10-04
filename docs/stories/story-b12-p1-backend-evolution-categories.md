# Story (Backend): Évolution du Modèle de Catégories pour les Prix et les Images

**ID:** STORY-B12-P1
**Titre:** Évolution du Modèle de Catégories pour les Prix et les Images
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Backend,  
**Je veux** étendre le modèle de données `Category` et l'API associée pour inclure la gestion des prix, des informations textuelles et des images,  
**Afin de** fournir la structure de données nécessaire au nouveau workflow de caisse.

## Contexte

Le modèle `Category` existant supporte déjà la hiérarchie (parent/enfant), mais il doit être enrichi pour stocker des informations de prix et des métadonnées supplémentaires. Cette story est le prérequis technique pour tout l'epic.

## Critères d'Acceptation

1.  Le modèle de données `Category` dans `api/src/recyclic_api/models/category.py` est mis à jour pour inclure les nouveaux champs suivants :
    -   `prix_mini: Numeric(10, 2)` (nullable)
    -   `prix_maxi: Numeric(10, 2)` (nullable)
    -   `info: Text` (nullable)
    -   `image_url: String(255)` (nullable)
2.  Les endpoints de l'API `POST /api/v1/categories` et `PUT /api/v1/categories/{id}` sont mis à jour pour permettre la création et la modification de ces nouveaux champs.
3.  Une logique de validation est ajoutée dans le service ou l'API pour s'assurer que les champs `prix_mini` et `prix_maxi` ne peuvent être définis que pour les sous-catégories (c'est-à-dire, lorsque `parent_id` n'est pas nul).
4.  Les schémas Pydantic sont mis à jour pour refléter ces nouveaux champs.
5.  Les tests d'intégration pour l'API des catégories sont mis à jour pour couvrir la création et la modification de ces nouveaux champs, y compris la logique de validation des prix sur les sous-catégories.

## Notes Techniques

-   **Modèle de Données :** Utiliser le type `Numeric` de SQLAlchemy pour les prix afin de garantir la précision.
-   **Validation :** La validation de la présence des prix uniquement sur les sous-catégories est un point clé. Elle doit être implémentée dans la couche service pour garantir la propreté de la logique métier.

## Definition of Done

- [ ] Le modèle de base de données est mis à jour et la migration est créée.
- [ ] L'API permet de gérer les nouveaux champs.
- [ ] La logique de validation des prix sur les sous-catégories est fonctionnelle.
- [ ] Les tests sont mis à jour et passent.
- [ ] La story a été validée par le Product Owner.
