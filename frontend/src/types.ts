// DEPRECATED: Types maintenant générés automatiquement dans src/generated/
// Ce fichier sera supprimé dans une version future.
// Utilisez les types générés depuis 'src/generated' à la place.

console.warn('DEPRECATED: types.ts is deprecated. Use generated types from src/generated instead.');

// Re-export temporaire pour la compatibilité
export {
  UserRole,
  UserStatus,
  UserCreate,
  UserResponse,
  UserRoleUpdate,
  ApiResponse,
  AdminUser,
  AdminResponse
} from './generated';

// Types locaux non générés (temporaire)
export interface UserStatusUpdate {
  status: string;
}

export interface UserUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  site_id?: string;
}
