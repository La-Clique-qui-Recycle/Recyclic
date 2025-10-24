# Story b34-p28: Bug: Diagnostiquer la page blanche de la gestion des groupes

**Statut:** ✅ Terminé et Validé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Bloquant

## 1. Contexte

L'audit UX de Sally a rapporté que la page de gestion des groupes (`/admin/groups`) est "cassée" et n'affiche "0 éléments d'interface". Cependant, une analyse du code frontend (`GroupsReal.tsx`) montre que le composant est complet et fonctionnel.

L'hypothèse est que la page apparaît vide car l'un des appels API nécessaires à son initialisation (`listGroups`, `listPermissions`, ou `getUsers`) échoue, empêchant le rendu du tableau et des autres éléments.

## 2. Objectif

**Diagnostiquer de manière définitive la cause de la page blanche** en identifiant la ou les requêtes API qui échouent lors du chargement de la page `/admin/groups`.

## 3. Procédure de Diagnostic Impérative

1.  **Utiliser les Outils de Développement :** L'agent DOIT ouvrir les "DevTools" (F12) avant de commencer.

2.  **Analyser l'Onglet "Réseau" (Network) :**
    *   L'agent DOIT se placer sur l'onglet "Réseau".
    *   L'agent DOIT naviguer vers la page `/admin/groups`.
    *   L'agent DOIT analyser la liste des requêtes effectuées lors du chargement de la page.
    *   L'agent DOIT répondre précisément aux questions suivantes dans son rapport :
        - Quelle(s) est (sont) la ou les requêtes qui échouent (statut autre que 200) ? Les candidats probables sont des appels à `/v1/groups/`, `/v1/permissions/`, ou `/v1/users/`.
        - Quel est le code de statut exact de l'erreur (ex: 404, 500, 403) ?
        - Quel est le message d'erreur exact retourné dans le corps de la réponse de l'API pour la requête qui échoue ?

3.  **Analyser l'Onglet "Console" :**
    *   L'agent DOIT vérifier s'il y a des erreurs dans la console qui donnent des informations supplémentaires sur l'échec de la requête.

## 4. Critères d'Acceptation

- [ ] Un rapport de diagnostic clair est fourni, identifiant la requête API exacte qui échoue.
- [ ] Le rapport DOIT inclure le code de statut et le message d'erreur complet de la réponse de l'API.
- [ ] Sur la base de ces informations, l'agent DOIT proposer une hypothèse sur la cause racine du bug dans le backend.

## 5. Outils et Prérequis

- **Accès :** Utiliser le compte SuperAdmin (`superadmintest1` / `Test1234!`) pour s'assurer que le problème n'est pas lié à un manque de permissions.
