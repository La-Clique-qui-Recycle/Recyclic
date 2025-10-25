# Story b37-13: Amélioration: Ajouter une option de suppression à l'import CSV des catégories

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Amélioration / Feature

## 1. Contexte

Actuellement, l'import de catégories via un fichier CSV ajoute les nouvelles catégories et met à jour les existantes, mais ne supprime pas les anciennes. Cela peut conduire à une accumulation de catégories obsolètes. L'administrateur a besoin d'un moyen de repartir d'une base propre.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, lorsque j'importe un nouveau fichier de catégories, je veux **avoir l'option de supprimer toutes les catégories existantes avant l'import**, afin de garantir que seules les catégories de mon fichier sont présentes dans le système.

## 3. Critères d'Acceptation

1.  Sur l'interface d'import des catégories, une case à cocher "Supprimer toutes les catégories existantes avant l'import" DOIT être ajoutée.
2.  L'endpoint `POST /categories/import/execute` DOIT être modifié pour accepter un nouveau paramètre booléen, `delete_existing`.
3.  Si `delete_existing` est `true`, le service backend DOIT d'abord supprimer toutes les catégories de la base de données avant d'exécuter l'import.
4.  Une alerte de confirmation DOIT être affichée à l'utilisateur lorsqu'il coche la case, l'informant que l'action est irréversible et qu'elle pourrait avoir un impact sur le mapping avec les éco-organismes.

## 4. Solution Technique Recommandée

-   **Frontend :** Ajouter une `Checkbox` Mantine à l'interface d'import et passer la valeur dans le payload de l'API.
-   **Backend (Endpoint) :** Modifier le schéma Pydantic de la requête pour inclure le champ `delete_existing`.
-   **Backend (Service) :** Dans `CategoryImportService`, avant la boucle d'upsert, ajouter une condition : `if delete_existing: self.db.query(Category).delete()`, suivie d'un `self.db.commit()`.

## 5. Prérequis de Test

- Créer quelques catégories de test.
- Préparer un fichier CSV avec de nouvelles catégories.
- Lancer un import **avec** la case cochée.
- **Vérification :** Seules les catégories du fichier CSV doivent être présentes. Les anciennes catégories de test doivent avoir disparu.
