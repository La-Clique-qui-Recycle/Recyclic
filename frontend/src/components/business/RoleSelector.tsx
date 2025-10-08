import React, { useState } from 'react';
import { Select, Button, Modal, Text, Group, Stack } from '@mantine/core';
import { IconUser, IconShield, IconCash, IconSettings } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { UserRole } from '../../services/adminService';

interface RoleSelectorProps {
  currentRole: UserRole;
  userId: string;
  userName: string;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<boolean>;
  disabled?: boolean;
}

const roleOptions = [
  { value: UserRole.USER, label: 'Utilisateur', icon: IconUser, color: 'blue' },
  { value: UserRole.MANAGER, label: 'Manager', icon: IconSettings, color: 'orange' },
  { value: UserRole.ADMIN, label: 'Administrateur', icon: IconShield, color: 'red' },
  { value: UserRole.SUPER_ADMIN, label: 'Super Admin', icon: IconShield, color: 'purple' },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  userId,
  userName,
  onRoleChange,
  disabled = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setIsModalOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await onRoleChange(userId, selectedRole);
      if (success) {
        notifications.show({
          title: 'Succès',
          message: `Rôle de ${userName} mis à jour vers ${getRoleLabel(selectedRole)}`,
          color: 'green',
        });
        setIsModalOpen(false);
      } else {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de mettre à jour le rôle',
          color: 'red',
        });
      }
    } catch {
      notifications.show({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la mise à jour',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return roleOptions.find(option => option.value === role)?.label || role;
  };

  const getRoleIcon = (role: UserRole) => {
    const option = roleOptions.find(option => option.value === role);
    return option ? React.createElement(option.icon, { size: 16 }) : null;
  };

  const canChangeRole = (newRole: UserRole) => {
    // Un utilisateur ne peut pas se déclasser lui-même
    // Un admin ne peut pas déclasser un super-admin
    return newRole !== currentRole;
  };

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isLoading}
        leftSection={getRoleIcon(currentRole)}
        data-testid="role-selector-button"
      >
        {getRoleLabel(currentRole)}
      </Button>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modifier le rôle"
        size="sm"
        data-testid="role-change-modal"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Modifier le rôle de <strong>{userName}</strong>
          </Text>

          <Select
            label="Nouveau rôle"
            placeholder="Sélectionner un rôle"
            value={selectedRole}
            onChange={(value) => setSelectedRole(value as UserRole)}
            data={roleOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            leftSection={getRoleIcon(selectedRole)}
            data-testid="role-select"
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              data-testid="cancel-role-change"
            >
              Annuler
            </Button>
            <Button
              onClick={handleRoleChange}
              loading={isLoading}
              disabled={!canChangeRole(selectedRole)}
              data-testid="confirm-role-change"
            >
              Confirmer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default RoleSelector;