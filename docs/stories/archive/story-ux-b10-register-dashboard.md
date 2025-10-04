# Story (Amélioration UX): Dashboard de Sélection des Caisses

**ID:** STORY-UX-B10-REGISTER-DASHBOARD
**Titre:** Création d'un Dashboard de Sélection des Caisses
**Epic:** Refonte du Workflow de Caisse
**Priorité:** P1 (Élevée)
**Statut:** Done

---

## User Story

**En tant que** Caissier,
**Je veux** voir un tableau de bord de toutes les caisses disponibles avec leur statut (Ouverte/Fermée),
**Afin de** pouvoir démarrer ou reprendre mon travail rapidement et sans ambiguïté.

## Acceptance Criteria

1.  La route principale `/caisse` affiche maintenant ce nouveau "Dashboard de Sélection des Caisses".
2.  Le dashboard affiche une "carte" ou un bouton pour chaque poste de caisse existant.
3.  Chaque carte de caisse affiche clairement son nom et son statut (ex: un badge "Ouverte" en vert, "Fermée" en gris).
4.  Un clic sur une caisse **"Fermée"** redirige vers le formulaire d'ouverture de session pour cette caisse spécifique.
5.  Un clic sur une caisse **"Ouverte"** reprend directement la session et redirige vers l'interface de vente, sans passer par le formulaire d'ouverture.

## Tasks / Subtasks

**Backend:**
- [x] **Endpoint :** Créer un nouvel endpoint `GET /api/v1/cash-registers/status` qui retourne la liste de tous les postes de caisse avec leur nom, leur ID, et leur statut de session actuel (`is_open`).

**Frontend:**
- [x] **Route :** S'assurer que la route `/caisse` pointe vers le nouveau composant dashboard.
- [x] **Composant Dashboard :** Créer un nouveau composant `CashRegisterDashboard.tsx` qui appelle le nouvel endpoint et affiche la liste des caisses.
- [x] **Composant Carte :** Créer un composant `RegisterCard.tsx` qui prend les informations d'une caisse en props et affiche son nom et son statut avec un badge de couleur.
- [x] **Logique de Navigation :** Implémenter la logique `onClick` sur `RegisterCard.tsx` qui :
    - Si `is_open` est `false`, navigue vers le formulaire d'ouverture de session en passant l'ID de la caisse.
    - Si `is_open` est `true`, appelle une action du store pour reprendre la session et navigue vers l'interface de vente.

## Dev Notes

-   Cette story remplace la précédente (`story-ux-b10-resume-session.md`) avec une approche UX bien supérieure.
-   Le nouvel endpoint backend est la clé pour permettre au frontend d'afficher les bonnes informations.

## Definition of Done

- [x] Le dashboard de sélection des caisses est fonctionnel.
- [x] L'utilisateur peut ouvrir ou reprendre une session de manière fluide et contextuelle.
- [x] La story a été validée par un agent QA.