# Story (UX/UI): Changement d'Opérateur en Cours de Session

**ID:** STORY-B02-P4
**Titre:** Changement d'Opérateur en Cours de Session
**Epic:** Finalisation de la Gestion Multi-Caisse

---

## User Story

**En tant qu'** opérateur de caisse,  
**Je veux** pouvoir changer l'opérateur actif au cours d'une session de caisse déjà ouverte,  
**Afin qu'** un collègue puisse prendre ma relève de manière fluide et traçable, sans avoir à fermer et rouvrir la caisse.

## Contexte d'Intégration

- **Problème :** Il n'existe actuellement aucun moyen de changer la personne responsable d'une caisse une fois la session ouverte, ce qui ne correspond pas à la réalité du travail en équipe dans une ressourcerie.
- **Solution :** Ajouter une fonctionnalité discrète mais accessible pour permettre ce changement.

## Critères d'Acceptation

1.  Un bouton ou une icône "Changer d'opérateur" est présent sur l'interface principale de la caisse (par exemple, à côté du nom de l'opérateur actuellement affiché).
2.  Un clic sur ce bouton ouvre une modale ou un menu simple.
3.  Cette modale affiche la liste des opérateurs actifs (en utilisant l'endpoint `GET /api/users/active-operators`).
4.  Après sélection d'un nouvel opérateur et confirmation, le nom de l'opérateur affiché sur l'interface principale de la caisse est mis à jour.
5.  Un appel API est fait pour enregistrer ce changement d'opérateur, afin d'assurer la traçabilité des actions pour l'audit.
6.  Le nouvel opérateur peut immédiatement commencer à enregistrer des ventes dans la même session.

## Notes Techniques

- Cette story nécessite un nouvel endpoint API (ex: `PATCH /api/cash-sessions/{id}/operator`) pour enregistrer le changement.
- La modification doit être simple et rapide pour ne pas interrompre le flux de vente.

## Definition of Done

- [ ] Le changement d'opérateur est fonctionnel depuis l'interface de caisse.
- [ ] Le changement est correctement enregistré en base de données.
- [ ] La story a été validée par le Product Owner.
