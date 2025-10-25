# Story b35-p3: Développer le widget "Utilisateurs Récents"

**Statut:** ❌ Annulée - Remplacée par la nouvelle vision du dashboard

## 1. Contexte

Cette story visait à créer un widget "Utilisateurs Récents". Cependant, la proposition de redesign finale a évolué vers une approche de "hubs" de navigation. Le widget n'est donc plus pertinent et est remplacé par la story `b37-p4` qui crée une page de sous-menu pour "Utilisateurs & Groupes".

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **voir un widget sur le dashboard qui me montre les derniers utilisateurs inscrits et me permet de leur assigner un groupe rapidement**, afin de ne pas avoir à naviguer entre plusieurs pages pour cette tâche courante.

## 3. Critères d'Acceptation

1.  Un nouveau composant React pour le widget "Utilisateurs Récents" DOIT être créé.
2.  Ce widget DOIT être placé dans la **Zone 1** du nouveau layout du dashboard admin.
3.  Le widget DOIT afficher une liste des 3 à 5 derniers utilisateurs inscrits.
4.  Pour chaque utilisateur dans la liste, le widget DOIT afficher son nom et un bouton ou un lien "Assigner un groupe".
5.  Cliquer sur "Assigner un groupe" DOIT ouvrir une pop-up (modale) qui permet de sélectionner un ou plusieurs groupes pour cet utilisateur (similaire à la fonctionnalité développée dans `b34-p30`).
6.  La sauvegarde depuis cette modale DOIT mettre à jour les groupes de l'utilisateur et afficher une notification de succès.

## 4. Endpoints à Utiliser

Pour construire ce widget, les endpoints existants suivants devront être utilisés :

-   **Pour la liste des utilisateurs récents :**
    -   `GET /v1/admin/users` : Utiliser cet endpoint en triant les résultats par date de création (`created_at`) pour obtenir les plus récents.
-   **Pour la liste des groupes (dans la modale) :**
    -   `GET /v1/groups/` : Pour peupler le `MultiSelect` d'assignation de groupe.

## 5. Solution Technique Recommandée

-   **Composant à créer :** `frontend/src/components/admin/widgets/RecentUsersWidget.tsx` (par exemple).
-   **API :** Le widget devra appeler les endpoints listés ci-dessus pour récupérer ses données.
-   **Réutilisation :** La modale d'assignation de groupe peut probablement réutiliser des composants ou de la logique déjà développés pour la page de gestion des utilisateurs.

## 6. Prérequis de Test

- **Comptes de test :**
  - **Admin :** `admintest1` / `Test1234!`
- **Actions :**
  - Se connecter en tant qu'admin.
  - Aller sur la page `/admin`.
- **Vérification :**
  - Le widget "Utilisateurs Récents" est visible.
  - Il affiche bien les derniers utilisateurs.
  - Le processus d'assignation de groupe via la modale est fonctionnel.

## 7. Conseils pour l'Agent DEV

- **Utilisation des Outils de Développement :** Utilisez impérativement les DevTools de votre navigateur (F12) pour inspecter les appels API, le rendu du widget et le comportement de la modale. C'est essentiel pour valider le bon fonctionnement de la fonctionnalité.
