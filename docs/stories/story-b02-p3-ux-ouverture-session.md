# Story (UX/UI): Refonte de l'Écran d'Ouverture de Session

**ID:** STORY-B02-P3
**Titre:** Refonte de l'Écran d'Ouverture de Session de Caisse
**Epic:** Finalisation de la Gestion Multi-Caisse

---

## User Story

**En tant qu'** utilisateur autorisé (user, admin),  
**Je veux** un écran d'ouverture de session de caisse clair et fonctionnel,  
**Afin de** pouvoir démarrer une session de travail sans erreur et en m'assurant que le bon poste de caisse et le bon opérateur sont assignés.

## Contexte d'Intégration

- **Problème :** L'écran actuel est bugué (champ "fond de caisse" inutilisable) et incomplet (il ne permet pas de choisir un poste de caisse).
- **Solution :** Refondre l'écran pour intégrer le nouveau workflow multi-caisse et corriger les bugs d'interface.

## Critères d'Acceptation

1.  L'écran d'ouverture de session contient maintenant **deux** listes déroulantes :
    - Une liste "Poste de Caisse" qui affiche les postes disponibles (via l'endpoint `GET /api/cash-registers`).
    - Une liste "Opérateur Responsable" qui affiche les utilisateurs pouvant opérer la caisse (via l'endpoint `GET /api/users/active-operators`).
2.  Le bug du champ "Fond de caisse initial" est corrigé : le "0" par défaut peut être effacé et n'interfère plus avec la saisie.
3.  Le champ "Fond de caisse initial" est amélioré pour une saisie monétaire (il accepte les décimales et affiche le montant dans un format approprié, ex: `150.50`).
4.  Le bouton "Ouvrir la session" appelle le nouvel endpoint `POST /api/cash-sessions` avec les ID du poste et de l'opérateur sélectionnés, ainsi que le montant.
5.  En cas de succès, l'utilisateur est redirigé vers l'interface principale de la caisse pour cette session.
6.  Les messages d'erreur de l'API (ex: "Ce poste de caisse est déjà ouvert") sont affichés clairement à l'utilisateur.

## Notes Techniques

- Cette story dépend de la story `STORY-B02-P1` qui doit fournir les endpoints API nécessaires.
- Un état de chargement ("loading spinner") doit être affiché pendant que les listes se chargent.

## Definition of Done

- [ ] Le nouvel écran d'ouverture de session est pleinement fonctionnel.
- [ ] Les bugs de saisie et de formatage sont corrigés.
- [ ] L'ouverture de session fonctionne et redirige l'utilisateur.
- [ ] La story a été validée par le Product Owner.
