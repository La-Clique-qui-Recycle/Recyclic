# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Composants UI de base
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── business/        # Composants métier
│   │   ├── CategorySelector/
│   │   ├── CashRegister/
│   │   └── TicketDisplay/
│   └── layout/          # Composants de mise en page
│       ├── Header/
│       ├── Navigation/
│       └── Container/
├── pages/               # Pages/routes principales
│   ├── CashRegister/
│   ├── Dashboard/
│   └── Admin/
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useOffline.ts
│   └── useCashSession.ts
├── services/           # Services API
│   ├── api.ts
│   ├── auth.ts
│   └── sync.ts
├── stores/             # State management Zustand
│   ├── authStore.ts
│   ├── cashStore.ts
│   └── offlineStore.ts
└── utils/              # Utilitaires
    ├── constants.ts
    ├── formatting.ts
    └── validation.ts
```

### Component Template

```typescript
interface ComponentProps {
  // Props typées
}

export const Component: React.FC<ComponentProps> = ({ prop }) => {
  // Hooks en premier
  const store = useStore();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Logic
  }, []);
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

Component.displayName = 'Component';
```

## State Management Architecture

### State Structure

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// Cash Store
interface CashState {
  currentSession: CashSession | null;
  currentSale: Sale[];
  currentMode: 'category' | 'quantity' | 'price';
  openSession: (amount: number) => Promise<void>;
  addSaleItem: (item: SaleItem) => void;
  finalizeSale: () => Promise<void>;
}

// Offline Store
interface OfflineState {
  isOnline: boolean;
  pendingSyncs: SyncItem[];
  lastSyncTime: Date | null;
  queueSync: (item: SyncItem) => void;
  processPendingSync: () => Promise<void>;
}
```

### State Management Patterns

- **Zustand stores séparés par domaine** - Auth, Cash, Offline isolés
- **Actions async avec error handling** - Toutes les actions API gèrent erreurs
- **Optimistic updates** - UI update immédiat, rollback si échec
- **Local persistence** - State critique sauvé dans localStorage
- **Sync queue pattern** - Mode offline avec queue de synchronisation

## Routing Architecture

### Route Organization

```
/                        # Redirect vers /cash ou /login
/login                   # Page connexion
/cash                    # Interface caisse principale
├── /cash/session        # Gestion session (ouvrir/fermer)
├── /cash/sale          # Processus vente
└── /cash/history       # Historique ventes
/admin                  # Dashboard admin
├── /admin/users        # Gestion utilisateurs
├── /admin/exports      # Exports et sync
└── /admin/settings     # Configuration site
/offline                # Page mode hors ligne
```

### Protected Route Pattern

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

## Frontend Services Layer

### API Client Setup

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { useOfflineStore } from '../stores/offlineStore';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor pour JWT
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor pour gestion erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'NETWORK_ERROR') {
          useOfflineStore.getState().setOffline(true);
        }
        
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### Service Example

```typescript
import { apiClient } from './apiClient';
import type { Sale, SaleCreate, CashSession } from '@recyclic/shared';

export class CashService {
  async openSession(opening_amount: number): Promise<CashSession> {
    return apiClient.post<CashSession>('/cash-sessions', {
      cashier_id: useAuthStore.getState().user?.id,
      opening_amount,
    });
  }
  
  async addSale(sale: SaleCreate): Promise<Sale> {
    try {
      return await apiClient.post<Sale>('/sales', sale);
    } catch (error) {
      // Queue pour sync offline
      useOfflineStore.getState().queueSync({
        type: 'sale',
        data: sale,
        timestamp: new Date(),
      });
      
      // Retourner sale avec ID temporaire
      return {
        ...sale,
        id: `temp-${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date(),
      } as Sale;
    }
  }
  
  async closeSession(session_id: string, actual_amount: number): Promise<CashSession> {
    return apiClient.post<CashSession>(`/cash-sessions/${session_id}/close`, {
      actual_amount,
    });
  }
}

export const cashService = new CashService();
```

---
