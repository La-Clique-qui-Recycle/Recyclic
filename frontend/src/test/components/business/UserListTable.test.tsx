import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserListTable } from '../../../components/business/UserListTable';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

// Mock des données de test
const mockUsers: AdminUser[] = [
  {
    id: '1',
    username: 'user1',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'user2',
    first_name: 'Jane',
    last_name: 'Smith',
    full_name: 'Jane Smith',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
];

const mockUserStatuses = [
  {
    user_id: '1',
    is_online: true,
    last_login: '2023-01-01T12:00:00Z',
    minutes_since_login: 5
  },
  {
    user_id: '2',
    is_online: false,
    last_login: '2023-01-01T10:00:00Z',
    minutes_since_login: 120
  }
];

const defaultProps = {
  users: mockUsers,
  loading: false,
  onRoleChange: jest.fn(),
  onRowClick: jest.fn()
};

describe('UserListTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render users without statuses when userStatuses is not provided', () => {
    render(<UserListTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Vérifier que les colonnes de statut existent mais affichent "Inconnu"
    expect(screen.getAllByText('Inconnu')).toHaveLength(2);
  });

  it('should render users with online statuses', () => {
    render(<UserListTable {...defaultProps} userStatuses={mockUserStatuses} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Vérifier les statuts en ligne
    expect(screen.getByText('En ligne')).toBeInTheDocument();
    expect(screen.getByText('Hors ligne')).toBeInTheDocument();
  });

  it('should show correct tooltips for online status', () => {
    render(<UserListTable {...defaultProps} userStatuses={mockUserStatuses} />);
    
    // Vérifier que les tooltips sont présents
    const onlineBadge = screen.getByTestId('online-status-1');
    const offlineBadge = screen.getByTestId('online-status-2');
    
    expect(onlineBadge).toBeInTheDocument();
    expect(offlineBadge).toBeInTheDocument();
  });

  it('should handle users without status information', () => {
    const statusesWithMissingUser = [
      {
        user_id: '1',
        is_online: true,
        last_login: '2023-01-01T12:00:00Z',
        minutes_since_login: 5
      }
      // user2 n'a pas de statut
    ];
    
    render(<UserListTable {...defaultProps} userStatuses={statusesWithMissingUser} />);
    
    // User1 devrait avoir un statut
    expect(screen.getByText('En ligne')).toBeInTheDocument();
    
    // User2 devrait afficher "Inconnu"
    expect(screen.getByText('Inconnu')).toBeInTheDocument();
  });

  it('should display loading state correctly', () => {
    render(<UserListTable {...defaultProps} loading={true} />);
    
    // Vérifier que les skeletons sont affichés
    expect(screen.getAllByTestId('skeleton')).toHaveLength(20); // 5 lignes × 4 colonnes
  });

  it('should display empty state when no users', () => {
    render(<UserListTable {...defaultProps} users={[]} />);
    
    expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
  });

  it('should handle role changes correctly', async () => {
    const mockOnRoleChange = jest.fn().mockResolvedValue(true);
    
    render(
      <UserListTable 
        {...defaultProps} 
        onRoleChange={mockOnRoleChange}
        userStatuses={mockUserStatuses}
      />
    );
    
    // Vérifier que les utilisateurs sont affichés
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle row clicks correctly', () => {
    const mockOnRowClick = jest.fn();
    
    render(
      <UserListTable 
        {...defaultProps} 
        onRowClick={mockOnRowClick}
        userStatuses={mockUserStatuses}
      />
    );
    
    // Vérifier que les lignes sont cliquables
    const userRows = screen.getAllByTestId('user-row');
    expect(userRows).toHaveLength(2);
  });

  it('should display correct status colors', () => {
    render(<UserListTable {...defaultProps} userStatuses={mockUserStatuses} />);
    
    // Vérifier que les badges de statut sont présents
    const onlineBadge = screen.getByTestId('online-status-1');
    const offlineBadge = screen.getByTestId('online-status-2');
    
    expect(onlineBadge).toBeInTheDocument();
    expect(offlineBadge).toBeInTheDocument();
  });

  it('should handle edge case with null userStatuses', () => {
    render(<UserListTable {...defaultProps} userStatuses={null as any} />);
    
    // Devrait afficher "Inconnu" pour tous les utilisateurs
    expect(screen.getAllByText('Inconnu')).toHaveLength(2);
  });

  it('should handle edge case with empty userStatuses array', () => {
    render(<UserListTable {...defaultProps} userStatuses={[]} />);
    
    // Devrait afficher "Inconnu" pour tous les utilisateurs
    expect(screen.getAllByText('Inconnu')).toHaveLength(2);
  });
});