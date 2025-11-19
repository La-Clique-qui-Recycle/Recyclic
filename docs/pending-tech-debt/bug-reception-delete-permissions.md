---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:13.440007
original_path: docs/stories/bug-reception-delete-permissions.md
---

# Bug: Permissions Incorrectes sur la Suppression en Réception

**ID:** BUG-RECEPTION-DELETE-PERMS
**Titre:** Correction des Permissions sur les Endpoints de Suppression du Module Réception
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Élevée)

---

## Objectif

**En tant que** Développeur,
**Je veux** que les endpoints de suppression du module de réception soient correctement sécurisés,
**Afin de** garantir que seuls les administrateurs puissent supprimer des données, conformément aux règles de gestion.

## Contexte du Bug

L'investigation de la story `story-b04-p2-securite-suppression-tickets.md` a révélé deux problèmes :
1.  L'endpoint `DELETE /api/v1/reception/lignes/{ligne_id}` autorise tous les utilisateurs (`USER`, `ADMIN`, `SUPER_ADMIN`) à supprimer des lignes, alors qu'il devrait être restreint aux administrateurs.
2.  L'endpoint pour supprimer un ticket entier, `DELETE /api/v1/reception/tickets/{ticket_id}`, est manquant.

## Critères d'Acceptation

1.  La dépendance de sécurité de l'endpoint `DELETE /api/v1/reception/lignes/{ligne_id}` est modifiée pour n'autoriser que les rôles `ADMIN` et `SUPER_ADMIN`.
2.  Un nouvel endpoint `DELETE /api/v1/reception/tickets/{ticket_id}` est créé.
3.  Ce nouvel endpoint est également protégé pour n'être accessible qu'aux rôles `ADMIN` et `SUPER_ADMIN`.
4.  Des tests d'intégration sont ajoutés ou mis à jour pour vérifier que les utilisateurs avec le rôle `USER` reçoivent bien une erreur `403 Forbidden` en tentant d'accéder à ces deux endpoints.
