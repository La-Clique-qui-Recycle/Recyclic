# Story (Raffinements): Support Clavier Étendu pour la Saisie du Poids en Réception

**ID:** STORY-B20-P2
**Titre:** Support Clavier Étendu pour la Saisie du Poids en Réception
**Epic:** Module de Réception
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant qu'** utilisateur,  
**Je veux** pouvoir utiliser les touches de la rangée supérieure de mon clavier AZERTY pour saisir des chiffres dans le champ de poids du module de Réception,  
**Afin de** bénéficier de la même ergonomie et de la même rapidité de saisie que dans le module de Caisse.

## Contexte

La story `STORY-B19-P1` a introduit le support du clavier AZERTY pour la saisie des chiffres dans le module de Caisse. Cette story vise à appliquer la même amélioration au module de Réception pour garantir une expérience utilisateur cohérente à travers toute l'application.

## Critères d'Acceptation

1.  Dans l'interface de saisie du module de Réception (`TicketForm.tsx`), la saisie de chiffres dans le champ de poids via le clavier physique est améliorée pour accepter les touches suivantes d'un clavier AZERTY :
    -   `&` pour `1`
    -   `é` pour `2`
    -   `"` pour `3`
    -   `'` pour `4`
    -   `(` pour `5`
    -   `-` pour `6`
    -   `è` pour `7`
    -   `_` pour `8`
    -   `ç` pour `9`
    -   `à` pour `0`
2.  Le support existant pour le pavé numérique, les touches `.` et `,`, `Backspace` et `Delete` est maintenu.

## Notes Techniques

-   **Fichiers à modifier :** Principalement `frontend/src/pages/Reception/TicketForm.tsx` et potentiellement l'utilitaire `frontend/src/utils/weightMask.ts`.
-   **Réutilisation du Code :** L'agent DEV doit s'inspirer de la logique implémentée pour le module de Caisse (story `STORY-B19-P1`) pour ne pas réinventer la roue.

## Definition of Done

- [x] Le support du clavier AZERTY est complet pour la saisie du poids en Réception.
- [ ] La story a été validée par le Product Owner.

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Analyse de l'implémentation existante dans le module de Caisse
- Réutilisation de la fonction `handleAZERTYWeightKey` du fichier `weightMask.ts`
- Modification de la fonction `onKeyDown` dans `TicketForm.tsx`

### Completion Notes List
1. **Import ajouté** : Ajout de l'import `handleAZERTYWeightKey` dans `frontend/src/pages/Reception/TicketForm.tsx`
2. **Fonction modifiée** : Remplacement de `handleWeightKey` par `handleAZERTYWeightKey` dans la fonction `onKeyDown`
3. **Support complet** : Le support clavier AZERTY est maintenant identique entre les modules de Caisse et de Réception

### File List
- `frontend/src/pages/Reception/TicketForm.tsx` - Modifié pour utiliser `handleAZERTYWeightKey`

### Change Log
- **2025-10-08** : Ajout du support clavier AZERTY pour la saisie du poids dans le module de Réception
  - Import de `handleAZERTYWeightKey` depuis `weightMask.ts`
  - Modification de la fonction `onKeyDown` pour utiliser la gestion AZERTY
  - Maintien de la compatibilité avec les touches existantes (pavé numérique, Backspace, Delete, etc.)

### Status
Ready for Review

## QA Results

**Gate:** PASS

**Rationale (résumé):**
- Support clavier AZERTY: implémentation correcte dans TicketForm.tsx avec réutilisation de `handleAZERTYWeightKey` depuis `weightMask.ts`
- Cohérence: même logique que le module de Caisse (STORY-B19-P1), garantissant une expérience utilisateur uniforme
- Maintien compatibilité: support existant pour pavé numérique, touches spéciales (Backspace, Delete, ., ,) préservé
- Mapping complet: toutes les touches AZERTY de la rangée supérieure supportées (&→1, é→2, "→3, '→4, (→5, -→6, è→7, _→8, ç→9, à→0)

**Evidence:**
- **Import ajouté**: `frontend/src/pages/Reception/TicketForm.tsx` (ligne 13) - import de `handleAZERTYWeightKey`
- **Fonction modifiée**: `onKeyDown` (lignes 956-959) - utilisation de `handleAZERTYWeightKey` au lieu de `handleWeightKey`
- **Réutilisation**: même fonction que le module de Caisse (`MultipleWeightEntry.tsx` ligne 394)
- **Source**: `frontend/src/utils/weightMask.ts` (ligne 128) - fonction centralisée et testée

**Must-test validés:**
- ✅ Support AZERTY: toutes les touches de la rangée supérieure fonctionnent (& é " ' ( - è _ ç à)
- ✅ Compatibilité: pavé numérique, Backspace, Delete, point décimal maintenus
- ✅ Cohérence: comportement identique entre modules Caisse et Réception
- ✅ Réutilisation: code partagé via `weightMask.ts`, pas de duplication

**Conseils techniques validés:**
- Réutilisation intelligente de la fonction existante `handleAZERTYWeightKey`
- Maintien de la compatibilité avec les touches existantes
- Code centralisé dans `weightMask.ts` pour éviter la duplication
- Expérience utilisateur cohérente entre les modules

**Décision:** Gate PASS - Support clavier AZERTY complet et cohérent, réutilisation efficace du code existant.
