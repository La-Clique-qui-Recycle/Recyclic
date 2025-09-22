# Proposition de Changement de Sprint : Raffinements Post-Développement (Lot 1)

**Date:** 2025-09-22
**Auteur:** Sarah (Product Owner)
**Statut:** En attente de validation

---

## 1. Résumé de l'Analyse

### 1.1. Problème Initial
Une série de 7 points de raffinement et de bugs a été identifiée lors d'une revue du parcours "Super-Administrateur" après la phase de développement initiale.

### 1.2. Impact Analysé
Les problèmes identifiés affectent principalement l'expérience utilisateur (UX) du panneau d'administration et rendent le flux critique d'inscription de nouveaux utilisateurs via Telegram non fonctionnel. Ces points ne modifient pas fondamentalement les epics du projet mais représentent un ensemble de bugs, de fonctionnalités manquantes et d'écarts par rapport à l'intention du PRD et de l'architecture.

### 1.3. Voie à Suivre Recommandée
**Ajustement Direct / Intégration.** Tous les points seront traités en créant de nouvelles tâches de développement pour corriger l'implémentation et mettre à jour la documentation associée afin de garantir la cohérence.

---

## 2. Plan d'Action Détaillé

| ID | Problème | Plan d'Action Proposé | Artefacts à Mettre à Jour |
|----|----------|-----------------------|---------------------------|
| 1 | **Navigation Inefficace (Admin):** Clic sur une icône "œil" requis pour voir les détails. | Modifier le composant de la liste des utilisateurs pour que le clic sur n'importe quelle partie de la ligne déclenche l'affichage du panneau de détails. | `docs/front-end-spec.md` (section à ajouter) |
| 2 | **Changement de Rôle (Admin):** Les badges de rôle dans la liste sont cliquables. | Rendre les badges de rôle non interactifs (texte simple). Le changement de rôle doit se faire uniquement via le panneau de détails de l'utilisateur. | `docs/front-end-spec.md` (section à ajouter) |
| 3 | **Colonne "Actions" Redondante (Admin):** La colonne est inutile et prête à confusion. | Supprimer complètement la colonne "Actions". Déplacer la fonctionnalité "Supprimer" vers le panneau de détails et la renommer "Désactiver". | `docs/front-end-spec.md` (section à ajouter) |
| 4 | **Statut Utilisateur Incomplet (Admin):** Manque les statuts "actif/inactif". | Aligner l'implémentation sur l'exigence `FR46` du PRD. Afficher un statut clair "Actif" / "Inactif" dans la liste. L'action "Désactiver" (du point #3) modifiera ce statut. | `docs/front-end-spec.md` (section à ajouter) |
| 5 | **Lien Inscription Telegram:** Le bot envoie une URL en texte brut (comportement normal sans HTTPS). | Confirmer le comportement (bouton = HTTPS requis). Accepter le lien texte pour le moment. Tâche dépriorisée. | - |
| 6 | **Accès Privé au Formulaire:** Les nouveaux utilisateurs sont redirigés vers la page de login. | Modifier la configuration du routage (côté Nginx ou applicatif) pour que la route `/inscription` soit publiquement accessible sans authentification. | `docs/architecture/architecture.md` |
| 7 | **Bug Onglet "Historique":** Erreur JS `sn.getUserHistory is not a function`. | Déboguer le code frontend de l'onglet "Historique". Identifier et corriger l'appel de fonction pour récupérer et afficher correctement l'historique de l'utilisateur depuis l'API. | - |

---

## 3. Prochaines Étapes

1.  **Validation :** Le Product Owner (vous) valide cette proposition.
2.  **Création des Tâches :** Les points ci-dessus seront transformés en tâches ou stories de développement distinctes.
3.  **Implémentation :** L'équipe de développement prend en charge la réalisation des tâches.
4.  **Mise à jour de la documentation :** Les documents `front-end-spec.md` et `architecture.md` sont mis à jour pour refléter les changements.

