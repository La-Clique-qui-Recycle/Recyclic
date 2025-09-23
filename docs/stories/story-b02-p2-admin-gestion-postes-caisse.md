# Story (Admin): Gestion des Postes de Caisse

**ID:** STORY-B02-P2
**Titre:** Gestion des Postes de Caisse (Admin)
**Epic:** Finalisation de la Gestion Multi-Caisse

---

## User Story

**En tant qu'** Administrateur,  
**Je veux** une interface pour créer et gérer les postes de caisse physiques de ma ressourcerie,  
**Afin de** pouvoir configurer le système pour qu'il corresponde à mon organisation et permettre l'ouverture de sessions de caisse distinctes.

## Contexte d'Intégration

- **Problème :** Le concept de "Poste de Caisse" n'a pas d'interface de gestion, ce qui empêche la mise en place du workflow multi-caisse.
- **Solution :** Créer une nouvelle page dans le panneau d'administration dédiée à la gestion (CRUD - Create, Read, Update, Delete) de ces postes.

## Critères d'Acceptation

1.  Un nouveau lien/onglet "Postes de Caisse" est visible dans la navigation du panneau d'administration.
2.  En cliquant sur ce lien, j'accède à une page qui liste les postes de caisse déjà créés (avec au minimum leur nom).
3.  La page contient un bouton "Créer un poste de caisse".
4.  Le formulaire de création permet de définir au minimum un "Nom" pour le poste (ex: "Caisse Principale", "Caisse Atelier", "Caisse Mobile Événement").
5.  Je peux modifier le nom d'un poste de caisse existant.
6.  Je peux supprimer un poste de caisse (avec une demande de confirmation).
7.  Cette interface communique avec les endpoints de l'API définis dans la story `STORY-B02-P1` pour effectuer ces opérations.

## Notes Techniques

- Cette story dépend de la story `STORY-B02-P1` qui doit fournir les endpoints API nécessaires.
- Le design de cette nouvelle page d'administration doit rester cohérent avec celui de la page de gestion des utilisateurs.

## Definition of Done

- [ ] L'interface CRUD complète pour les postes de caisse est fonctionnelle.
- [ ] Les modifications sont bien sauvegardées en base de données via l'API.
- [ ] La story a été validée par le Product Owner.
