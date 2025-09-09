# Data Models

## User

**Purpose:** Gestion des utilisateurs autorisés (bénévoles, admins) avec authentification Telegram

**Key Attributes:**
- telegram_id: number - ID utilisateur Telegram unique
- full_name: string - Nom complet utilisateur
- role: enum - Role (admin, operator, viewer)
- site_id: string - Ressourcerie associée
- is_active: boolean - Statut compte actif

### TypeScript Interface

```typescript
interface User {
  id: string;
  telegram_id: number;
  full_name: string;
  email?: string;
  role: 'admin' | 'operator' | 'viewer';
  site_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- Belongs to Site (site_id)
- Has many Deposits (created_by)
- Has many Sales (cashier_id)

## Deposit

**Purpose:** Enregistrement des objets déposés via bot Telegram avec classification IA

**Key Attributes:**
- description: string - Description vocale transcrite
- category_eee: enum - Classification EEE-1 à EEE-8
- quantity: number - Nombre d'objets
- weight_kg: number - Poids total
- ai_confidence: number - Score confiance IA
- human_validated: boolean - Validation humaine

### TypeScript Interface

```typescript
interface Deposit {
  id: string;
  site_id: string;
  created_by: string; // User.id
  description: string;
  audio_file_path?: string;
  transcription: string;
  category_eee: EEECategory;
  subcategory?: string;
  quantity: number;
  weight_kg: number;
  ai_confidence: number;
  ai_suggested_categories: EEECategory[];
  human_validated: boolean;
  validation_notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- Belongs to Site (site_id)
- Belongs to User (created_by)

## Sale

**Purpose:** Transactions de vente avec catégories EEE obligatoires pour conformité

**Key Attributes:**
- category_eee: enum - Catégorie EEE obligatoire
- quantity: number - Quantité vendue
- unit_price: number - Prix unitaire euros
- total_amount: number - Montant total
- payment_method: enum - Espèces/CB/Chèque
- session_id: string - Session de caisse

### TypeScript Interface

```typescript
interface Sale {
  id: string;
  site_id: string;
  session_id: string;
  cashier_id: string; // User.id
  category_eee: EEECategory;
  subcategory?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'check';
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- Belongs to Site (site_id)
- Belongs to CashSession (session_id)
- Belongs to User (cashier_id)

## CashSession

**Purpose:** Sessions de caisse avec gestion fond, encaissements et contrôles

**Key Attributes:**
- cashier_id: string - Opérateur caisse
- opening_amount: number - Fond de caisse initial
- closing_amount: number - Montant final théorique
- actual_amount: number - Décompte réel
- variance: number - Écart théorique/réel
- status: enum - opened/closed

### TypeScript Interface

```typescript
interface CashSession {
  id: string;
  site_id: string;
  cashier_id: string; // User.id
  opening_amount: number;
  closing_amount?: number;
  actual_amount?: number;
  variance?: number;
  variance_comment?: string;
  status: 'opened' | 'closed';
  opened_at: Date;
  closed_at?: Date;
}
```

### Relationships
- Belongs to Site (site_id)
- Belongs to User (cashier_id)
- Has many Sales (session_id)

## Site

**Purpose:** Configuration ressourcerie avec personnalisation et paramètres

**Key Attributes:**
- name: string - Nom ressourcerie
- settings: object - Configuration JSON
- branding: object - Logo, couleurs, thème
- sync_config: object - Configuration synchronisation cloud

### TypeScript Interface

```typescript
interface Site {
  id: string;
  name: string;
  address?: string;
  contact_email?: string;
  settings: {
    cash_variance_threshold: number;
    auto_follow_mode: boolean;
    offline_mode_enabled: boolean;
  };
  branding: {
    primary_color: string;
    logo_url?: string;
    theme: 'light' | 'dark' | 'auto';
  };
  sync_config: {
    google_sheets_id?: string;
    infomaniak_credentials?: string;
    sync_frequency: number;
  };
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- Has many Users (site_id)
- Has many Deposits (site_id)
- Has many Sales (site_id)
- Has many CashSessions (site_id)

---
