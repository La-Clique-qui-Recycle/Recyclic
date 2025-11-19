# Story (Fonctionnalité): Historique des Tickets de Réception

**ID:** STORY-B04-P1
**Titre:** Historique et Consultation des Tickets de Réception
**Epic:** Module de Réception
**Priorité:** P1 (Élevée)

---

## Objectif

**En tant qu'** utilisateur,  
**Je veux** pouvoir consulter la liste des tickets de réception récents et accéder à leurs détails,  
**Afin de** pouvoir suivre l'historique des réceptions et, si nécessaire, vérifier ou modifier un ticket après sa création.

## Contexte

Actuellement, une fois qu'un ticket de réception est fermé, il n'y a aucun moyen de le retrouver depuis l'interface. Cette story vise à ajouter un historique des tickets pour améliorer la traçabilité et la gestion des réceptions.

## Critères d'Acceptation

### Partie Frontend

1.  Sur la page d'accueil du module de réception (là où se trouve le bouton "Ouvrir un ticket"), une nouvelle section "Tickets Récents" est ajoutée.
2.  Cette section affiche une liste des derniers tickets de réception, avec des informations clés (ex: date, opérateur, nombre d'articles, statut).
3.  Un clic sur un ticket dans la liste redirige l'utilisateur vers une vue détaillée de ce ticket, affichant toutes les lignes et informations enregistrées.
4.  (Optionnel, à discuter) La vue détaillée d'un ticket permet son édition, potentiellement restreinte par le rôle de l'utilisateur.

### Partie Backend

5.  Un nouvel endpoint API est créé (ex: `GET /api/v1/reception/tickets`) pour lister les tickets de réception, avec des options de pagination et de filtrage.
6.  Un endpoint existant ou un nouvel endpoint (ex: `GET /api/v1/reception/tickets/{id}`) permet de récupérer les détails complets d'un ticket spécifique.

## Notes Techniques

-   La liste des tickets récents pourrait être paginée pour éviter de charger trop de données d'un coup.
-   La question de l'édition d'un ticket fermé doit être discutée : est-ce autorisé ? Si oui, pour qui ? Et quelles sont les implications (ex: re-calcul de statistiques) ?

## Definition of Done

- [ ] La liste des tickets récents est affichée sur la page de réception.
- [ ] Il est possible de consulter les détails d'un ticket passé.
- [ ] Les endpoints API nécessaires sont créés et fonctionnels.
- [ ] La story a été validée par le Product Owner.
