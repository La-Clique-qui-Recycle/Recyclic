import React, { useState } from 'react';
import { 
  Paper, 
  Tabs, 
  Stack, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  Button,
  Skeleton,
  Alert
} from '@mantine/core';
import { IconUser, IconHistory, IconAlertCircle } from '@tabler/icons-react';
import { AdminUser, UserRole, UserStatus } from '../../services/adminService';
import { UserProfileTab } from './UserProfileTab';
import { UserHistoryTab } from './UserHistoryTab';

interface UserDetailViewProps {
  user: AdminUser | null;
  loading?: boolean;
  onUserUpdate?: (updatedUser: AdminUser) => void;
}

export const UserDetailView: React.FC<UserDetailViewProps> = ({
  user,
  loading = false,
  onUserUpdate
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('profile');

  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group>
            <Skeleton height={60} circle />
            <div style={{ flex: 1 }}>
              <Skeleton height={20} width="60%" mb="xs" />
              <Skeleton height={16} width="40%" />
            </div>
          </Group>
          <Skeleton height={200} />
        </Stack>
      </Paper>
    );
  }

  if (!user) {
    return (
      <Paper p="xl" withBorder>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Aucun utilisateur sélectionné"
          color="blue"
        >
          Sélectionnez un utilisateur dans la liste pour voir ses détails.
        </Alert>
      </Paper>
    );
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'purple';
      case UserRole.ADMIN:
        return 'red';
      case UserRole.MANAGER:
        return 'orange';
      case UserRole.CASHIER:
        return 'green';
      case UserRole.USER:
      default:
        return 'blue';
    }
  };

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

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.CASHIER:
        return 'Caissier';
      case UserRole.USER:
      default:
        return 'Utilisateur';
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header avec informations de base */}
        <Group>
          <Avatar size="lg" color="blue">
            {user.first_name?.[0] || user.username?.[0] || 'U'}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text size="lg" fw={600}>
              {user.full_name || `${user.first_name} ${user.last_name}` || user.username || 'Utilisateur'}
            </Text>
            <Text size="sm" c="dimmed">
              @{user.username || user.telegram_id}
            </Text>
            <Group gap="xs" mt="xs">
              <Badge color={getRoleColor(user.role)} variant="light">
                {getRoleLabel(user.role)}
              </Badge>
              <Badge color={getStatusColor(user.status)} variant="light">
                {getStatusLabel(user.status)}
              </Badge>
            </Group>
          </div>
        </Group>

        {/* Onglets */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
              Profil
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Historique
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profile" pt="md">
            <UserProfileTab 
              user={user} 
              onUserUpdate={onUserUpdate}
            />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <UserHistoryTab 
              userId={user.id}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
};

export default UserDetailView;



