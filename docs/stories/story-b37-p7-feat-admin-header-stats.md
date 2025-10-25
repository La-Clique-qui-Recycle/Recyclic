# Story b37-p7: Feature: Ajouter les stats globales dans le header de l'admin

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Feature / Frontend

## 1. Contexte

La proposition de redesign finale du dashboard admin inclut l'affichage de statistiques globales directement dans le header de la section administration, pour fournir un aperçu immédiat de l'activité, quelle que soit la page admin consultée.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir les indicateurs clés de l'activité (CA, Poids) directement dans le header de la section admin**, afin d'avoir toujours sous les yeux l'état actuel du système.

## 3. Critères d'Acceptation

1.  Le composant du header de l'administration (`AdminLayout.jsx` ou un composant enfant) DOIT être modifié.
2.  Le header DOIT afficher les informations suivantes :
    *   `CA` : Le chiffre d'affaires total (depuis le début).
    *   `Poids` : Le poids total reçu (depuis le début).
3.  Ces données DOIVENT être récupérées via les endpoints API existants (ex: `/v1/cash-sessions/stats/summary` et `/v1/stats/reception/summary` sans filtre de date).
4.  Les notifications (`🔔`) et le menu utilisateur (`👤`) DOIVENT rester présents.

## 4. Solution Technique Recommandée

-   **Composant à modifier :** `frontend/src/components/AdminLayout.jsx`.
-   **API :** Utiliser les endpoints existants pour récupérer les statistiques globales.

## 5. Prérequis de Test

- Se connecter en tant qu'admin (`admintest1`).
- Naviguer dans les différentes pages de la section `/admin`.
- **Vérification :**
    - Le header de la section admin affiche bien le CA total et le Poids total.
    - Ces informations restent visibles sur toutes les pages de l'administration.
