# User Flows

## Flow 1: Vente Standard (3 Modes Séquentiels)

**User Goal:** Enregistrer une vente rapidement avec classification EEE correcte

**Entry Points:** Interface caisse après ouverture session

**Success Criteria:** Vente enregistrée en <5 clics, ticket généré

### Flow Diagram

```mermaid
graph TD
    A[Interface Caisse] --> B{Mode Auto-Follow?}
    B -->|Oui| C[Mode Catégorie Actif]
    B -->|Non| D[Sélection Mode Manuel]
    C --> E[Sélection EEE-1 à EEE-8]
    E --> F[Auto-passage Mode Quantité]
    F --> G[Saisie Quantité]
    G --> H[Auto-passage Mode Prix]
    H --> I[Saisie Prix Unitaire]
    I --> J[Ligne Ajoutée au Ticket]
    J --> K{Autre Article?}
    K -->|Oui| C
    K -->|Non| L[Validation Vente]
    L --> M[Sélection Paiement]
    M --> N[Ticket Final]
```

### Edge Cases & Error Handling

- **Retour arrière :** Bouton Back disponible à chaque étape, sauvegarde automatique
- **Correction ligne :** Édition libre avant validation, admin requis après
- **Session timeout :** Sauvegarde locale, restauration automatique
- **Mode offline :** Indicateur rouge discret, sync différée

### Notes

**Workflow flexible :** Auto-follow par défaut mais navigation libre autorisée. Timeout 15min avec sauvegarde draft.

## Flow 2: Ouverture/Fermeture Session

**User Goal:** Contrôler la caisse physique de façon fiable

**Entry Points:** Application au démarrage

**Success Criteria:** Session ouverte avec fond initial, fermeture avec rapprochement

### Flow Diagram

```mermaid
graph TD
    A[App Démarrage] --> B[Sélection Opérateur]
    B --> C[Saisie Fond Caisse]
    C --> D[Interface Caisse Active]
    D --> E[... Ventes ...]
    E --> F[Fermeture Session]
    F --> G[Calcul Solde Théorique]
    G --> H[Saisie Décompte Réel]
    H --> I{Écart > Seuil?}
    I -->|Non| J[Fermeture OK]
    I -->|Oui| K[Commentaire Obligatoire]
    K --> L[Validation Admin]
    L --> J
```
