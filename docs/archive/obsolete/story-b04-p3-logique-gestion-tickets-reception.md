# Story (Fonctionnalité): Amélioration de la Logique de Gestion des Tickets de Réception

**ID:** STORY-B04-P3
**Titre:** Amélioration de la Logique de Gestion des Tickets de Réception
**Epic:** Module de Réception
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant qu'** utilisateur,  
**Je veux** pouvoir modifier un ticket de réception tant qu'il est ouvert, et que les tickets fermés soient non-modifiables,  
**Afin de** pouvoir corriger les erreurs de saisie récentes tout en garantissant l'intégrité des archives.

## Contexte

Suite à l'implémentation de l'historique des tickets, nous devons clarifier la politique de modification. Cette story implémente la règle métier qui autorise la modification des tickets "ouverts" et verrouille les tickets "fermés".

## Critères d'Acceptation

### Partie Frontend

1.  Dans la liste des tickets récents, un clic sur un ticket avec le statut **"Fermé"** redirige vers une vue en **lecture seule** des détails du ticket.
2.  Dans la liste des tickets récents, un clic sur un ticket avec le statut **"Ouvert"** redirige vers l'**interface de saisie** de ce ticket, permettant de reprendre le travail.
3.  Dans l'interface de saisie d'un ticket ouvert, les fonctionnalités d'ajout, de modification et de suppression de lignes sont disponibles (en respectant les restrictions de rôle pour la suppression, définies dans la story `STORY-B04-P2`).
4.  L'interface de saisie d'un ticket ouvert contient un bouton "Fermer le ticket". Un clic sur ce bouton change le statut du ticket à "Fermé" et redirige l'utilisateur vers la vue en lecture seule de ce ticket.

### Partie Backend

5.  Les endpoints de l'API pour la modification et la suppression de lignes de ticket (ex: `PUT /api/v1/reception/lignes/{id}`, `DELETE /api/v1/reception/lignes/{id}`) doivent vérifier que le ticket parent est bien "ouvert". Si le ticket est "fermé", l'API doit retourner une erreur `403 Forbidden`.
6.  Un nouvel endpoint est créé (ex: `POST /api/v1/reception/tickets/{id}/close`) pour permettre de fermer un ticket.

## Notes Techniques

-   Cette story s'appuie sur les fonctionnalités développées dans `STORY-B04-P1` (Historique des Tickets) et `STORY-B04-P2` (Sécurité des Suppressions).
-   La distinction entre la vue en lecture seule et la vue d'édition est un point clé de l'implémentation frontend.

## Definition of Done

- [x] Les tickets ouverts sont modifiables.
- [x] Les tickets fermés sont en lecture seule.
- [x] La logique de fermeture d'un ticket est implémentée.
- [x] Les protections backend sont en place.
- [x] La story a été validée par le Product Owner.

## Implémentation Réalisée

### Backend
- **API Endpoints modifiés** : Les endpoints `PUT /api/v1/reception/lignes/{id}` et `DELETE /api/v1/reception/lignes/{id}` retournent maintenant `403 Forbidden` au lieu de `409 Conflict` pour les tickets fermés
- **Endpoint de fermeture** : `POST /api/v1/reception/tickets/{id}/close` existant et fonctionnel
- **Validation des schémas** : Ajout du champ `dom_category_label` dans les réponses des endpoints de création et mise à jour des lignes

### Frontend
- **Navigation conditionnelle** : 
  - Tickets fermés → `/reception/ticket/{id}/view` (vue lecture seule)
  - Tickets ouverts → `/reception/ticket/{id}` (interface d'édition)
- **Interface d'édition complète** : Ajout, modification et suppression de lignes pour tickets ouverts
- **Bouton de fermeture** : "Fermer le ticket" avec redirection vers le module de réception
- **Synchronisation des données** : Rechargement automatique des données après modifications
- **Gestion des tickets existants** : Utilisation de l'API pour les tickets chargés par ID
- **Gestion des nouveaux tickets** : Utilisation du contexte pour les tickets en cours de création

### Améliorations Cosmétiques
- **Affichage utilisateur** : Prénom affiché au lieu de "Utilisateur" dans le header
- **Interface compacte** : Bouton "Créer un nouveau ticket" plus compact pour voir la liste des tickets
- **Navigation améliorée** : Redirection vers `/reception` après fermeture d'un ticket

## Statut
**✅ TERMINÉE** - Tous les critères d'acceptation ont été implémentés et testés avec succès.
