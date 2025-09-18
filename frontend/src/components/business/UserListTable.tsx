import React from 'react';
import { Table, Badge, Group, Text, ActionIcon, Tooltip, Skeleton } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { AdminUser, UserRole, UserStatus } from '../../services/adminService';
import { RoleSelector } from './RoleSelector';

interface UserListTableProps {
  users: AdminUser[];
  loading?: boolean;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<boolean>;
  onViewUser?: (user: AdminUser) => void;
  onEditUser?: (user: AdminUser) => void;
  onDeleteUser?: (user: AdminUser) => void;
}

// const getRoleColor = (role: UserRole) => {
//   switch (role) {
//     case UserRole.SUPER_ADMIN:
//       return 'purple';
//     case UserRole.ADMIN:
//       return 'red';
//     case UserRole.MANAGER:
//       return 'orange';
//     case UserRole.CASHIER:
//       return 'green';
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

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  loading = false,
  onRoleChange,
  onViewUser,
  onEditUser,
  onDeleteUser
}) => {
  if (loading) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nom</Table.Th>
            <Table.Th>Rôle</Table.Th>
            <Table.Th>Statut</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td><Skeleton height={20} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={80} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={100} data-testid="skeleton" /></Table.Td>
              <Table.Td><Skeleton height={20} width={120} data-testid="skeleton" /></Table.Td>
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
          <Table.Th>Statut</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {users.map((user) => (
          <Table.Tr key={user.id} data-testid="user-row">
            <Table.Td>
              <div>
                <Text fw={500}>
                  {user.full_name || `${user.first_name} ${user.last_name}` || user.username || 'Utilisateur'}
                </Text>
                <Text size="sm" c="dimmed">
                  @{user.username || user.telegram_id}
                </Text>
              </div>
            </Table.Td>
            <Table.Td>
              <RoleSelector
                currentRole={user.role}
                userId={user.id}
                userName={user.full_name || user.username || 'Utilisateur'}
                onRoleChange={onRoleChange}
              />
            </Table.Td>
            <Table.Td>
              <Badge color={getStatusColor(user.status)} variant="light">
                {getStatusLabel(user.status)}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {onViewUser && (
                  <Tooltip label="Voir les détails">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => onViewUser(user)}
                      data-testid="view-user-button"
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {onEditUser && (
                  <Tooltip label="Modifier">
                    <ActionIcon
                      variant="subtle"
                      color="orange"
                      onClick={() => onEditUser(user)}
                      data-testid="edit-user-button"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {onDeleteUser && (
                  <Tooltip label="Supprimer">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDeleteUser(user)}
                      data-testid="delete-user-button"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default UserListTable;