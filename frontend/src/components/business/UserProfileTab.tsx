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
  Divider
} from '@mantine/core';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { AdminUser, adminService } from '../../services/adminService';
import { UserRole, UserStatus } from '../../generated';

interface UserProfileTabProps {
  user: AdminUser;
  onUserUpdate?: (updatedUser: AdminUser) => void;
}

interface UserFormData {
  first_name?: string;
  last_name?: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
}

const sanitizeUserForForm = (user: AdminUser): UserFormData => ({
  first_name: user.first_name || '',
  last_name: user.last_name || '',
  username: user.username || '',
  role: user.role,
  status: user.status,
  is_active: user.is_active,
});

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  user,
  onUserUpdate
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<UserFormData>({
    defaultValues: sanitizeUserForForm(user)
  });

  const handleEdit = () => {
    const sanitized = sanitizeUserForForm(user);
    Object.keys(sanitized).forEach(key => {
      setValue(key as keyof UserFormData, sanitized[key as keyof UserFormData]);
    });
    setEditModalOpen(true);
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await adminService.updateUserStatus(user.id, {
        is_active: false,
        reason: "Désactivé par l'administrateur"
      });

      const updatedUser: AdminUser = {
        ...user,
        is_active: false,
        updated_at: new Date().toISOString()
      };

      onUserUpdate?.(updatedUser);

      notifications.show({
        title: 'Succès',
        message: 'Utilisateur désactivé avec succès',
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de désactiver l\'utilisateur',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await adminService.updateUserStatus(user.id, {
        is_active: true,
        reason: "Réactivé par l'administrateur"
      });

      const updatedUser: AdminUser = {
        ...user,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      onUserUpdate?.(updatedUser);

      notifications.show({
        title: 'Succès',
        message: 'Utilisateur activé avec succès',
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'activer l\'utilisateur',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: UserFormData) => {
    setLoading(true);
    try {
      const updateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        role: values.role,
        status: values.status,
      };

      await adminService.updateUser(user.id, updateData);

      // Mettre à jour l'état actif si nécessaire
      if (values.is_active !== user.is_active) {
        await adminService.updateUserStatus(user.id, { is_active: values.is_active });
      }

      const updatedUser: AdminUser = {
        ...user,
        ...updateData,
        is_active: values.is_active,
        full_name: values.first_name && values.last_name 
          ? `${values.first_name} ${values.last_name}` 
          : user.full_name,
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

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await adminService.triggerResetPassword(user.id);
      notifications.show({
        title: 'Succès',
        message: `Un e-mail de réinitialisation a été envoyé à l'utilisateur.`,
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'envoyer l\'e-mail de réinitialisation.',
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
      case UserRole.USER:
        return 'Bénévole';
      default:
        return 'Bénévole';
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
      <Group justify="center" gap="md">
        <Button
          leftSection={<IconEdit size={16} />}
          onClick={handleEdit}
          variant="outline"
        >
          Modifier le profil
        </Button>
        {user.is_active ? (
          <Button
            color="red"
            variant="outline"
            onClick={() => handleDeactivate()}
          >
            Désactiver
          </Button>
        ) : (
          <Button
            color="green"
            variant="outline"
            onClick={() => handleActivate()}
          >
            Activer
          </Button>
        )}
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
              value={watch('first_name') || ''}
              onChange={(e) => setValue('first_name', e.target.value, { shouldValidate: true })}
              error={errors.first_name?.message}
            />
            <TextInput
              label="Nom"
              placeholder="Entrez le nom"
              {...register('last_name', {
                minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caractères' }
              })}
              value={watch('last_name') || ''}
              onChange={(e) => setValue('last_name', e.target.value, { shouldValidate: true })}
              error={errors.last_name?.message}
            />
            <TextInput
              label="Nom d'utilisateur"
              placeholder="Entrez le nom d'utilisateur"
              {...register('username')}
              value={watch('username') || ''}
              onChange={(e) => setValue('username', e.target.value, { shouldValidate: true })}
              error={errors.username?.message}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  label="Rôle"
                  data={[
                    { value: UserRole.USER, label: 'Bénévole' },
                    { value: UserRole.ADMIN, label: 'Administrateur' },
                    { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
                  ]}
                  value={field.value}
                  onChange={(val) => field.onChange(val as UserRole)}
                />
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Statut"
                  data={[
                    { value: UserStatus.PENDING, label: 'En attente' },
                    { value: UserStatus.APPROVED, label: 'Approuvé' },
                    { value: UserStatus.REJECTED, label: 'Rejeté' },
                  ]}
                  value={field.value}
                  onChange={(val) => field.onChange(val as UserStatus)}
                />
              )}
            />
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Utilisateur actif"
                  description="L'utilisateur peut se connecter et utiliser le système"
                  checked={!!field.value}
                  onChange={(event) => field.onChange(event.currentTarget.checked)}
                />
              )}
            />

            <Button
              variant="outline"
              color="orange"
              onClick={handleResetPassword}
              loading={loading}
            >
              Réinitialiser le mot de passe
            </Button>

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
