import React from 'react';
import { Table, Badge, Text, Skeleton, Tooltip, Group } from '@mantine/core';
import { AdminUser, UserRole, UserStatus } from '../../services/adminService';

interface UserStatusInfo {
  user_id: string;
  is_online: boolean;
  last_login: string | null;
  minutes_since_login: number | null;
}

interface UserListTableProps {
  users: AdminUser[];
  loading?: boolean;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<boolean>;
  onRowClick?: (user: AdminUser) => void;
  userStatuses?: UserStatusInfo[];
}

// const getRoleColor = (role: UserRole) => {
//   switch (role) {
//     case UserRole.SUPER_ADMIN:
//       return 'purple';
//     case UserRole.ADMIN:
//       return 'red';
//     case UserRole.MANAGER:
//       return 'orange';
//     // rôle 'cashier' supprimé
//     case UserRole.USER:
//     default:
//       return 'blue';
//   }
// };

const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case UserStatus.APPROVED:
      return 'green';
    case UserStatus.PENDING:
      return 'yellow';
    case UserStatus.REJECTED:
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusLabel = (status: UserStatus) => {
  switch (status) {
    case UserStatus.APPROVED:
      return 'Approuvé';
    case UserStatus.PENDING:
      return 'En attente';
    case UserStatus.REJECTED:
      return 'Rejeté';
    default:
      return 'Inconnu';
  }
};

const getActiveStatusLabel = (isActive: boolean) => {
  return isActive ? 'Actif' : 'Inactif';
};

const getActiveStatusColor = (isActive: boolean) => {
  return isActive ? 'green' : 'red';
};

const getOnlineStatusInfo = (userId: string, userStatuses?: UserStatusInfo[]) => {
  if (!userStatuses) return null;
  return userStatuses.find(status => status.user_id === userId);
};

const getOnlineStatusLabel = (statusInfo: UserStatusInfo | null) => {
  if (!statusInfo) return 'Inconnu';
  return statusInfo.is_online ? 'En ligne' : 'Hors ligne';
};

const getOnlineStatusColor = (statusInfo: UserStatusInfo | null) => {
  if (!statusInfo) return 'gray';
  return statusInfo.is_online ? 'green' : 'red';
};

const getOnlineStatusTooltip = (statusInfo: UserStatusInfo | null) => {
  if (!statusInfo) return 'Statut inconnu';
  
  if (statusInfo.is_online) {
    return `En ligne - Actif il y a moins de 15 minutes`;
  } else if (statusInfo.last_login) {
    const minutes = statusInfo.minutes_since_login;
    if (minutes !== null) {
      if (minutes < 60) {
        return `Hors ligne - Dernière connexion il y a ${minutes} minutes`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `Hors ligne - Dernière connexion il y a ${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
      }
    }
    return 'Hors ligne - Dernière connexion inconnue';
  } else {
    return 'Hors ligne - Jamais connecté';
  }
};

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  loading = false,
  onRoleChange,
  onRowClick,
  userStatuses
}) => {
  if (loading) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nom</Table.Th>
            <Table.Th>Rôle</Table.Th>
            <Table.Th>Statut d'approbation</Table.Th>
            <Table.Th>Statut d'activité</Table.Th>
            <Table.Th>Statut en ligne</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td><Skeleton height={20} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={80} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={100} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={80} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={80} data-testid="skeleton" /></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Text c="dimmed">Aucun utilisateur trouvé</Text>
      </div>
    );
  }

  return (
    <Table data-testid="user-list-table" striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Nom</Table.Th>
          <Table.Th>Rôle</Table.Th>
          <Table.Th>Statut d'approbation</Table.Th>
          <Table.Th>Statut d'activité</Table.Th>
          <Table.Th>Statut en ligne</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {users.map((user) => (
          <Table.Tr
            key={user.id}
            data-testid="user-row"
            onClick={() => onRowClick?.(user)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick?.(user);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Sélectionner l'utilisateur ${user.full_name || user.username}`}
            style={{ cursor: 'pointer' }}
          >
            <Table.Td>
              <div>
                <Text fw={500}>
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.first_name || user.last_name || user.username || 'Utilisateur'}
                </Text>
                <Text size="sm" c="dimmed">
                  @{user.username || user.telegram_id}
                </Text>
              </div>
            </Table.Td>
            <Table.Td>
              <Badge color="blue" variant="light" style={{ cursor: 'default' }}>
                {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                 user.role === UserRole.ADMIN ? 'Administrateur' :
                 user.role === UserRole.MANAGER ? 'Manager' :
                 'Utilisateur'}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Badge color={getStatusColor(user.status)} variant="light">
                {getStatusLabel(user.status)}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Badge color={getActiveStatusColor(user.is_active)} variant="light">
                {getActiveStatusLabel(user.is_active)}
              </Badge>
            </Table.Td>
            <Table.Td>
              {(() => {
                const statusInfo = getOnlineStatusInfo(user.id, userStatuses);
                return (
                  <Tooltip label={getOnlineStatusTooltip(statusInfo)} withArrow>
                    <Badge 
                      color={getOnlineStatusColor(statusInfo)} 
                      variant="light"
                      data-testid={`online-status-${user.id}`}
                    >
                      {getOnlineStatusLabel(statusInfo)}
                    </Badge>
                  </Tooltip>
                );
              })()}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default UserListTable;