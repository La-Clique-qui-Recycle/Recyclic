# Story b35-p1: Mettre en place le layout du nouveau dashboard admin

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Tâche Technique / Feature

## 1. Contexte

C'est la première étape de la refonte de la page d'accueil de l'administration, basée sur la proposition de redesign de Sally. L'objectif est de remplacer l'actuelle page (un simple hub de liens) par une nouvelle structure de page prête à accueillir les futurs widgets.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir une nouvelle page d'accueil admin avec une structure en zones distinctes**, afin de préparer le terrain pour une interface plus claire et mieux organisée.

## 3. Critères d'Acceptation

1.  Le contenu actuel du composant `DashboardHomePage.jsx` DOIT être supprimé.
2.  Le composant DOIT être réorganisé pour afficher une grille ou un layout en 3 zones distinctes, comme décrit dans la proposition de redesign :
    *   **Zone 1 :** Actions prioritaires / Statistiques quotidiennes.
    *   **Zone 2 :** Navigation principale.
    *   **Zone 3 :** Administration Super-Admin.
3.  Pour cette story, ces zones peuvent être des conteneurs vides avec un titre simple (ex: `<h2>Zone 2 : Navigation principale</h2>`).
4.  La **Zone 2 (Navigation principale)** DOIT être immédiatement peuplée avec les 6 boutons des fonctions opérationnelles quotidiennes, qui étaient auparavant sur la page.
5.  La **Zone 3 (Administration Super-Admin)** DOIT être visible uniquement pour les utilisateurs ayant le rôle `super-admin`.

## 4. Référence Visuelle

L'agencement des zones DOIT suivre la structure conceptuelle détaillée suivante :

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER - STATUT GLOBAL                    │
│  🔔 Notifications | 💰 CA: XXX€ | ⚖️ Poids: XXXkg | 👤 Connecté │
├─────────────────────────────────────────────────────────────┤
│  ZONE 1: STATISTIQUES QUOTIDIENNES                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 💰 CA DU    │ │ ⚖️ POIDS     │ │ 📋 TICKETS  │           │
│  │   JOUR      │ │   REÇU      │ │   CRÉÉS     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  ZONE 2: NAVIGATION PRINCIPALE (QUOTIDIEN)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 👥 UTILISATEURS │ 📊 RAPPORTS  │ 🏷️ CATÉGORIES │       │
│  │   & GROUPES  │   & EXPORTS  │   & TARIFS   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 💰 SESSIONS │ 🔧 PARAMÈTRES │ 📋 AUDIT &   │           │
│  │   DE CAISSE │   & CONFIG    │   LOGS       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  ZONE 3: ADMINISTRATION SUPER-ADMIN (Rétractable)          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 🏪 SITES &  │ 🔧 PARAMÈTRES │ 📋 AUDIT &   │           │
│  │   CAISSES   │   AVANCÉS     │   LOGS       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 5. Solution Technique Recommandée

-   **Composant à modifier :** `frontend/src/pages/Admin/DashboardHomePage.jsx`.
-   **Librairie de layout :** Utiliser les composants de layout de Mantine (`Grid`, `Stack`, `Group`) pour créer la structure en zones.
-   **Logique de rôle :** Utiliser le hook `useAuthStore` pour récupérer le rôle de l'utilisateur et afficher/masquer conditionnellement la Zone 3.

## 5. Prérequis de Test

- **Comptes de test :**
  - **Admin :** `admintest1` / `Test1234!`
  - **Super-Admin :** `superadmintest1` / `Test1234!`
- **Actions :**
  - Se connecter avec le compte **admin**.
  - **Vérification :** La nouvelle page `/admin` doit s'afficher avec les Zones 1 et 2 visibles, et la Zone 3 masquée.
  - Se connecter avec le compte **super-admin**.
  - **Vérification :** La nouvelle page `/admin` doit s'afficher avec les trois zones visibles.

## 6. Conseils pour l'Agent DEV

- **Utilisation des Outils de Développement :** Utilisez impérativement les DevTools de votre navigateur (F12) pour inspecter le rendu des composants, vérifier les props et vous assurer que la logique d'affichage conditionnel des zones fonctionne comme attendu.
