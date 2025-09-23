# Story (Bug): Correction Finale de la Persistance du Profil

**ID:** STORY-BUG-PROFILE-PERSISTENCE-FINAL
**Titre:** Correction Finale de la Persistance des Modifications de Profil
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Draft

---

## User Story

**En tant qu'** administrateur,
**Je veux** que les modifications du profil d'un utilisateur soient sauvegardées de manière permanente,
**Afin que** les données du système soient fiables et cohérentes.

## Acceptance Criteria

1.  Quand un administrateur modifie un profil (ex: prénom) et sauvegarde, le changement DOIT être persisté en base de données.
2.  Après une actualisation de la page ou une nouvelle navigation vers la liste des utilisateurs, les nouvelles informations DOIVENT être affichées.

## Dev Notes

- Le fix précédent était insuffisant. Le bug de persistance demeure.
- L'investigation doit se concentrer à nouveau sur le endpoint backend `PUT /api/v1/users/{id}`.
- La cause la plus probable est un problème de gestion de la session de base de données (ex: `db.commit()` manquant ou mal placé).
