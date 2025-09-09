# Information Architecture (IA)

## Site Map / Screen Inventory

```mermaid
graph TD
    A[Session Fermée] --> B[Ouverture Session]
    B --> C[Interface Caisse Principale]
    C --> D[Mode Catégorie]
    C --> E[Mode Quantité]
    C --> F[Mode Prix]
    D --> E --> F
    F --> D
    C --> G[Ticket Temps Réel]
    C --> H[Fermeture Session]
    G --> I[Validation Vente]
    H --> J[Contrôle Caisse]
    C --> K[Admin Panel]
    K --> L[Déverrouillage Erreurs]
```

## Navigation Structure

**Navigation Principale :** Modes 3-boutons visuels (Catégorie/Quantité/Prix) avec état actif/inactif clair

**Navigation Secondaire :** Pavé numérique intégré, boutons retour/annulation

**Breadcrumb Strategy :** État de session visible en permanence (Opérateur, Heure ouverture, Total jour)
