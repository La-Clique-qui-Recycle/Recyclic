# Story b34-p34: Amélioration UX: Masquer les colonnes vides dans les rapports de réception

**Statut:** ❌ Annulée - Problème mal compris / Nécessite un diagnostic

## 1. Contexte

L'audit UX révisé de Sally (`b34-p27`) avait identifié que les colonnes "Catégorie" et "Notes" dans les rapports de réception (`/admin/reception-reports`) étaient systématiquement vides ou contenaient des valeurs par défaut non informatives. Cependant, une vérification par le PO a soulevé la question de savoir si ces colonnes sont réellement vides ou si les données ne sont pas correctement affichées.

Cette story est donc annulée car le problème nécessite d'abord un diagnostic pour comprendre pourquoi les données ne s'affichent pas, avant de décider de masquer les colonnes.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux que **les rapports de réception n'affichent pas de colonnes vides ou non pertinentes**, afin de me concentrer sur les informations utiles et d'avoir une vue d'ensemble plus claire.

## 3. Critères d'Acceptation

1.  Dans le tableau des rapports de réception (`/admin/reception-reports`), la colonne "Catégorie" DOIT être masquée si toutes ses cellules sont vides pour la période affichée.
2.  La colonne "Notes" DOIT être masquée si toutes ses cellules contiennent la valeur par défaut "-" pour la période affichée.
3.  Si des données pertinentes apparaissent dans ces colonnes (par exemple, une catégorie est renseignée ou une note est ajoutée), la colonne DOIT être affichée.
4.  L'agent DOIT vérifier si d'autres colonnes dans d'autres rapports sont également systématiquement vides et appliquer la même logique de masquage conditionnel.

## 4. Solution Technique Recommandée

-   **Composant à modifier :** `frontend/src/pages/Admin/ReceptionReports.tsx` (et potentiellement d'autres composants de rapport).
-   **Logique :** Avant de rendre le tableau, vérifier les données pour chaque colonne. Si une colonne est entièrement vide ou contient uniquement des valeurs par défaut non informatives, ne pas la rendre.

## 5. Prérequis de Test

- Se connecter en tant qu'admin (`admintest1`).
- Aller sur `/admin/reception-reports`.
- **Vérification :**
    - Si aucune catégorie ou note n'a été enregistrée pour les tickets de réception, les colonnes "Catégorie" et "Notes" ne doivent pas apparaître.
    - Si des catégories ou notes sont présentes, les colonnes doivent apparaître et afficher les données.
