---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:15.306867
original_path: docs/stories/story-fe-cleanup-registration-form.md
---

# Story: FE - Nettoyage du Formulaire d'Inscription

**User Story**
En tant que nouvel utilisateur,
Je veux un formulaire d'inscription simple et clair ne demandant que les informations essentielles,
Afin de pouvoir m'inscrire rapidement et sans confusion.

**Story Context**

*   **Intégration Système Existant :**
    *   S'intègre avec : La page d'inscription existante et potentiellement son endpoint backend.
    *   Technologie : React, `styled-components`.
*   **Points de contact :**
    *   Modification du fichier `frontend/src/pages/Registration.jsx`.
    *   Vérification de l'endpoint backend `POST /users/registration-requests`.

**Critères d'Acceptation**

1.  Dans le fichier `frontend/src/pages/Registration.jsx`, le label du champ `username` doit être modifié de "Nom d'utilisateur Telegram" à "Identifiant".
2.  Le champ de formulaire pour "Ressourcerie" (`site_id`) doit être complètement supprimé de l'interface (label et champ de sélection).
3.  Le champ de formulaire pour "Notes additionnelles" (`notes`) doit être complètement supprimé de l'interface (label et champ de texte).
4.  L'appel API `GET /sites` et la logique associée pour charger les ressourceries doivent être supprimés du code.
5.  Le formulaire doit continuer à fonctionner et à soumettre les demandes d'inscription avec succès.
6.  L'objet de données envoyé à l'API `POST /users/registration-requests` ne doit plus contenir les clés `site_id` et `notes`.

**Notes Techniques**

*   **Vérification Backend Requise :** Le développeur doit impérativement vérifier si l'endpoint backend `POST /users/registration-requests` accepte les requêtes sans les champs `site_id` et `notes`. Si ces champs sont obligatoires côté backend, une modification mineure sera nécessaire pour les rendre optionnels.
*   **Nettoyage du Code :** En plus de supprimer les éléments JSX, il faudra supprimer l'état `sites`, la fonction `loadSites` et le `useEffect` correspondant dans le composant `Registration.jsx`.

**Dev Agent Record**

- [x] Modifier le label du champ username de "Nom d'utilisateur Telegram" à "Identifiant"
- [x] Supprimer le champ Ressourcerie (site_id) du formulaire
- [x] Supprimer le champ Notes additionnelles (notes) du formulaire
- [x] Supprimer l'appel API GET /sites et la logique associée
- [x] Nettoyer le code en supprimant les états et fonctions inutiles
- [x] Mettre à jour les tests pour refléter les changements
- [x] Valider le fonctionnement complet

**Agent Model Used**: Claude Sonnet 4

**Debug Log References**: Aucune erreur de linting détectée, tous les tests passent (11/11)

**Completion Notes List**:
- Label du champ username modifié de "Nom d'utilisateur Telegram" à "Identifiant"
- Champ Ressourcerie (site_id) complètement supprimé du formulaire
- Champ Notes additionnelles (notes) complètement supprimé du formulaire
- Appel API GET /sites et logique associée supprimés
- États et fonctions inutiles nettoyés (sites, loadSites, Select, TextArea)
- Tests mis à jour pour refléter les changements (11/11 tests passent)
- Validation backend confirmée : l'endpoint accepte les requêtes sans site_id et notes
- Formulaire simplifié ne demandant que les informations essentielles

**File List**:
- `frontend/src/pages/Registration.jsx` - Nettoyage complet du formulaire d'inscription
- `frontend/src/test/pages/Registration.test.tsx` - Tests mis à jour pour les changements

**Change Log**:
- 2025-01-27: Nettoyage du formulaire d'inscription selon les spécifications
- Suppression des champs site_id et notes du formulaire
- Modification du label username pour plus de clarté
- Suppression de l'appel API GET /sites et de la logique associée
- Nettoyage du code en supprimant les composants et états inutiles
- Tests mis à jour et validés (11/11 passent)

**Status**: Ready for Done

**Vérification des Risques et de la Compatibilité**

*   **Risque Principal :** ✅ Résolu. Vérification backend effectuée - l'endpoint accepte les requêtes sans les champs site_id et notes.
*   **Atténuation :** ✅ Confirmée. Le schéma RegistrationRequestCreate définit ces champs comme optionnels.
*   **Rollback :** Annuler les modifications sur le fichier `Registration.jsx`.
