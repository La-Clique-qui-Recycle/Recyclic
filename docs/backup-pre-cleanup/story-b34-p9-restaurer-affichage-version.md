# Story b34-p9: Restaurer l'affichage dynamique de la version

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Une régression a été introduite dans le composant `AdminLayout.jsx`. La logique qui récupérait dynamiquement la version de l'application depuis l'API a été remplacée par une valeur codée en dur (`1.0.0`), rendant impossible de savoir quelle version du code est réellement déployée.

**Information critique :** La logique fonctionnelle et correcte existe toujours sur la branche `main`.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir le numéro de version et le SHA de commit corrects** de l'application, afin de savoir précisément quelle version du code est déployée.

## 3. Critères d'Acceptation

1.  **Instruction principale :** Le code nécessaire pour cette fonctionnalité est déjà écrit et fonctionnel sur la branche `main`. La tâche consiste à **copier-coller** la logique pertinente depuis la version de `main` vers la branche actuelle.
2.  **Fichiers à inspecter sur `main` :**
    -   `frontend/src/components/AdminLayout.jsx` (pour la logique `useEffect` et l'affichage).
    -   `frontend/src/services/healthService.ts` (ou un nom similaire, pour la fonction d'appel API).
3.  **Fichiers à modifier sur la branche actuelle :**
    -   Le `useEffect` dans `frontend/src/components/AdminLayout.jsx` DOIT être restauré pour appeler le service de version.
    -   La valeur codée en dur `'Version: 1.0.0'` DOIT être supprimée.
    -   Le service (`healthService.ts` ou équivalent) DOIT être créé ou mis à jour en copiant le code de la branche `main`.
4.  **Résultat final :** L'interface doit afficher la version et le SHA du commit dynamiquement, récupérés depuis l'endpoint `/v1/health/version`.
5.  Un fallback gracieux (ex: afficher "Version indisponible") DOIT être en place si l'appel API échoue.

## 4. Prérequis de Test

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (pour accéder à l'interface d'administration)

## 5. Conseils pour l'Agent DEV

- **Ne réinventez pas la roue :** La solution existe déjà. Utilisez `git show main:path/to/file.js` pour voir le contenu d'un fichier sur la branche `main` sans changer de branche, puis copiez le code nécessaire.
- Le travail est uniquement sur le **frontend**.
