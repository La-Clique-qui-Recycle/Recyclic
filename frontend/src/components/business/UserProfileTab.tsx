import React, { useState } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Select,
  Switch,
  Divider,
  Alert,
  Skeleton
} from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { AdminUser, UserRole, UserStatus, adminService } from '../../services/adminService';

interface UserProfileTabProps {
  user: AdminUser;
  onUserUpdate?: (updatedUser: AdminUser) => void;
}

interface UserFormData {
  first_name?: string;
  last_name?: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  user,
  onUserUpdate
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<UserFormData>({
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      status: user.status,
      is_active: user.is_active
    }
  });

  const handleEdit = () => {
    setValue('first_name', user.first_name || '');
    setValue('last_name', user.last_name || '');
    setValue('role', user.role);
    setValue('status', user.status);
    setValue('is_active', user.is_active);
    setEditModalOpen(true);
  };

  const handleSave = async (values: UserFormData) => {
    setLoading(true);
    try {
      // Mettre à jour le profil utilisateur
      const updateData = {
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
      };

      await adminService.updateUser(user.id, updateData);

      // Mettre à jour le rôle si nécessaire
      if (values.role !== user.role) {
        await adminService.updateUserRole(user.id, { role: values.role });
      }

      // Mettre à jour le statut si nécessaire
      if (values.status !== user.status) {
        await adminService.updateUserStatus(user.id, { status: values.status });
      }

      // Créer l'utilisateur mis à jour
      const updatedUser: AdminUser = {
        ...user,
        first_name: values.first_name,
        last_name: values.last_name,
        full_name: values.first_name && values.last_name 
          ? `${values.first_name} ${values.last_name}` 
          : user.full_name,
        role: values.role,
        status: values.status,
        is_active: values.is_active,
        updated_at: new Date().toISOString()
      };

      onUserUpdate?.(updatedUser);

      notifications.show({
        title: 'Succès',
        message: 'Profil utilisateur mis à jour avec succès',
        color: 'green',
      });

      setEditModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le profil utilisateur',
        color: 'red',
      });
    } finally {
      setLoading(false);
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

  return (
    <Stack gap="md">
      {/* Informations de base */}
      <div>
        <Text size="sm" fw={500} c="dimmed" mb="xs">
          Informations personnelles
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Prénom:</Text>
            <Text size="sm" fw={500}>
              {user.first_name || 'Non renseigné'}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Nom:</Text>
            <Text size="sm" fw={500}>
              {user.last_name || 'Non renseigné'}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Nom d'utilisateur:</Text>
            <Text size="sm" fw={500}>
              @{user.username || user.telegram_id}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">ID Telegram:</Text>
            <Text size="sm" fw={500}>
              {user.telegram_id}
            </Text>
          </Group>
        </Stack>
      </div>

      <Divider />

      {/* Informations système */}
      <div>
        <Text size="sm" fw={500} c="dimmed" mb="xs">
          Informations système
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Rôle:</Text>
            <Text size="sm" fw={500}>
              {getRoleLabel(user.role)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Statut:</Text>
            <Text size="sm" fw={500}>
              {getStatusLabel(user.status)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Actif:</Text>
            <Text size="sm" fw={500}>
              {user.is_active ? 'Oui' : 'Non'}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Créé le:</Text>
            <Text size="sm" fw={500}>
              {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Modifié le:</Text>
            <Text size="sm" fw={500}>
              {new Date(user.updated_at).toLocaleDateString('fr-FR')}
            </Text>
          </Group>
        </Stack>
      </div>

      <Divider />

      {/* Actions */}
      <Group justify="center">
        <Button
          leftSection={<IconEdit size={16} />}
          onClick={handleEdit}
          variant="outline"
        >
          Modifier le profil
        </Button>
      </Group>

      {/* Modal d'édition */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier le profil utilisateur"
        size="md"
      >
        <form onSubmit={handleSubmit(handleSave)}>
          <Stack gap="md">
            <TextInput
              label="Prénom"
              placeholder="Entrez le prénom"
              {...register('first_name', { 
                minLength: { value: 2, message: 'Le prénom doit contenir au moins 2 caractères' }
              })}
              error={errors.first_name?.message}
            />
            <TextInput
              label="Nom"
              placeholder="Entrez le nom"
              {...register('last_name', { 
                minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caractères' }
              })}
              error={errors.last_name?.message}
            />
            <Select
              label="Rôle"
              data={[
                { value: UserRole.USER, label: 'Utilisateur' },
                { value: UserRole.CASHIER, label: 'Caissier' },
                { value: UserRole.MANAGER, label: 'Manager' },
                { value: UserRole.ADMIN, label: 'Administrateur' },
                { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
              ]}
              {...register('role')}
            />
            <Select
              label="Statut"
              data={[
                { value: UserStatus.PENDING, label: 'En attente' },
                { value: UserStatus.APPROVED, label: 'Approuvé' },
                { value: UserStatus.REJECTED, label: 'Rejeté' },
              ]}
              {...register('status')}
            />
            <Switch
              label="Utilisateur actif"
              description="L'utilisateur peut se connecter et utiliser le système"
              {...register('is_active')}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                leftSection={<IconX size={16} />}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconCheck size={16} />}
              >
                Sauvegarder
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default UserProfileTab;
