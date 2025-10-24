import React, { useState } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Divider
} from '@mantine/core';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { AdminUser, adminService } from '../../services/adminService';
import { UserRole, UserStatus } from '../../generated';
import { useAuthStore } from '../../stores/authStore';

interface UserProfileTabProps {
  user: AdminUser | null;
  onUserUpdate?: (updatedUser: AdminUser) => void;
  isCreateMode?: boolean;
  opened?: boolean;
  onClose?: () => void;
}

interface UserFormData {
  telegram_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  notes?: string;
  skills?: string;
  availability?: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}

const sanitizeUserForForm = (user: AdminUser | null): UserFormData => ({
  telegram_id: user?.telegram_id || '',
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  username: user?.username || '',
  email: user?.email || '',
  phone_number: user?.phone_number || '',
  address: user?.address || '',
  notes: user?.notes || '',
  skills: user?.skills || '',
  availability: user?.availability || '',
  password: '', // Pas de mot de passe par défaut pour la modification
  role: user?.role || UserRole.USER,
  is_active: user?.is_active ?? true,
});

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  user,
  onUserUpdate,
  isCreateMode = false,
  opened = true,
  onClose
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [forcePasswordModalOpen, setForcePasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);

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
      if (isCreateMode) {
        // Mode création
        const createData = {
          telegram_id: values.telegram_id || null, // Peut être null maintenant
          first_name: values.first_name,
          last_name: values.last_name,
          username: values.username,
          email: values.email || undefined,
          phone_number: values.phone_number || undefined,
          address: values.address || undefined,
          notes: values.notes || undefined,
          skills: values.skills || undefined,
          availability: values.availability || undefined,
          password: values.password,
          role: values.role,
          is_active: values.is_active,
        };

        const newUser = await adminService.createUser(createData);

        onUserUpdate?.(newUser);

        notifications.show({
          title: 'Succès',
          message: 'Utilisateur créé avec succès',
          color: 'green',
        });

        if (onClose) {
          onClose();
        }
      } else {
        // Mode modification
        const updateData = {
          first_name: values.first_name,
          last_name: values.last_name,
          username: values.username,
          email: values.email || undefined,
          phone_number: values.phone_number || undefined,
          address: values.address || undefined,
          notes: values.notes || undefined,
          skills: values.skills || undefined,
          availability: values.availability || undefined,
          role: values.role,
        };

        await adminService.updateUser(user.id, updateData);

        // Mettre à jour l'état actif si nécessaire
        if (values.is_active !== user.is_active) {
          await adminService.updateUserStatus(user.id, { 
            status: values.is_active ? 'approved' : 'rejected', 
            is_active: values.is_active 
          });
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
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Gestion spécifique de l'erreur 409 Conflict pour email dupliqué
      if (error?.response?.status === 409) {
        const errorMessage = error?.response?.data?.detail || 'Un compte avec cet email existe déjà';
        notifications.show({
          title: 'Email déjà utilisé',
          message: errorMessage,
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Erreur',
          message: `Impossible de ${isCreateMode ? 'créer' : 'mettre à jour'} l'utilisateur`,
          color: 'red',
        });
      }
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

  const handleResetPin = async () => {
    setLoading(true);
    try {
      await adminService.resetUserPin(user.id);
      notifications.show({
        title: 'Succès',
        message: 'Le code PIN a été réinitialisé avec succès. L\'utilisateur devra en créer un nouveau.',
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du PIN:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de réinitialiser le code PIN.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForcePassword = async (newPassword: string, reason?: string) => {
    setLoading(true);
    try {
      await adminService.forceUserPassword(user.id, newPassword, reason);
      notifications.show({
        title: 'Succès',
        message: 'Mot de passe forcé avec succès',
        color: 'green',
      });
      setForcePasswordModalOpen(false);
    } catch (error) {
      console.error('Erreur lors du forçage du mot de passe:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de forcer le mot de passe.',
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

  // Si c'est en mode création et que le modal n'est pas ouvert, ne rien afficher
  if (isCreateMode && !opened) {
    return null;
  }

  return (
    <Stack gap="md">
      {/* Mode affichage (pas en création) */}
      {!isCreateMode && user && (
        <>
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
              <Group justify="space-between">
                <Text size="sm">Email:</Text>
                <Text size="sm" fw={500}>
                  {user.email || 'Non renseigné'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Téléphone:</Text>
                <Text size="sm" fw={500}>
                  {user.phone_number || 'Non renseigné'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Adresse:</Text>
                <Text size="sm" fw={500}>
                  {user.address || 'Non renseigné'}
                </Text>
              </Group>
            </Stack>
          </div>

          <Divider />

          {/* Informations de profil étendues */}
          <div>
            <Text size="sm" fw={500} c="dimmed" mb="xs">
              Informations de profil
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Compétences:</Text>
                <Text size="sm" fw={500}>
                  {user.skills || 'Non renseigné'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Disponibilité:</Text>
                <Text size="sm" fw={500}>
                  {user.availability || 'Non renseigné'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Notes:</Text>
                <Text size="sm" fw={500}>
                  {user.notes || 'Non renseigné'}
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
            <Button
              onClick={handleResetPassword}
              variant="outline"
              color="orange"
              loading={loading}
            >
              Réinitialiser le mot de passe
            </Button>
            <Button
              onClick={handleResetPin}
              variant="outline"
              color="blue"
              loading={loading}
            >
              Réinitialiser le PIN
            </Button>
            {currentUser?.role === 'super-admin' && (
              <Button
                onClick={() => setForcePasswordModalOpen(true)}
                variant="outline"
                color="red"
                loading={loading}
              >
                Forcer le mot de passe
              </Button>
            )}
          </Group>
        </>
      )}

      {/* Modal d'édition/création */}
      <Modal
        opened={isCreateMode ? opened : editModalOpen}
        onClose={isCreateMode ? onClose || (() => {}) : () => setEditModalOpen(false)}
        title={isCreateMode ? "Créer un nouvel utilisateur" : "Modifier le profil utilisateur"}
        size="md"
      >
        <form onSubmit={handleSubmit(handleSave)}>
          <Stack gap="md">
            {isCreateMode && (
              <TextInput
                label="ID Telegram"
                placeholder="Entrez l'ID Telegram (optionnel)"
                {...register('telegram_id', {
                  minLength: { value: 1, message: 'L\'ID Telegram ne peut pas être vide si renseigné' }
                })}
                value={watch('telegram_id') || ''}
                onChange={(e) => setValue('telegram_id', e.target.value, { shouldValidate: true })}
                error={errors.telegram_id?.message}
              />
            )}

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
              {...register('username', isCreateMode ? {
                required: 'Le nom d\'utilisateur est requis',
                minLength: { value: 3, message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' },
                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores' }
              } : {})}
              value={watch('username') || ''}
              onChange={(e) => setValue('username', e.target.value, { shouldValidate: true })}
              error={errors.username?.message}
            />

            <TextInput
              label="Email"
              placeholder="Entrez l'email"
              type="email"
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format d\'email invalide' }
              })}
              value={watch('email') || ''}
              onChange={(e) => setValue('email', e.target.value, { shouldValidate: true })}
              error={errors.email?.message}
            />

            <TextInput
              label="Téléphone"
              placeholder="Entrez le numéro de téléphone"
              {...register('phone_number')}
              value={watch('phone_number') || ''}
              onChange={(e) => setValue('phone_number', e.target.value, { shouldValidate: true })}
              error={errors.phone_number?.message}
            />

            <Textarea
              label="Adresse"
              placeholder="Entrez l'adresse"
              minRows={2}
              maxRows={4}
              autosize
              {...register('address')}
              value={watch('address') || ''}
              onChange={(e) => setValue('address', e.target.value, { shouldValidate: true })}
              error={errors.address?.message}
            />

            <Textarea
              label="Compétences"
              placeholder="Entrez les compétences (ex: Accueil public, Bricolage, Agencement, Manutention, Transport...)"
              minRows={2}
              maxRows={4}
              autosize
              {...register('skills')}
              value={watch('skills') || ''}
              onChange={(e) => setValue('skills', e.target.value, { shouldValidate: true })}
              error={errors.skills?.message}
            />

            <Textarea
              label="Disponibilité"
              placeholder="Entrez la disponibilité (ex: Tous les vendredis, Le samedi matin, Mercredi après-midi...)"
              minRows={2}
              maxRows={4}
              autosize
              {...register('availability')}
              value={watch('availability') || ''}
              onChange={(e) => setValue('availability', e.target.value, { shouldValidate: true })}
              error={errors.availability?.message}
            />

            <Textarea
              label="Notes"
              placeholder="Entrez des notes (observations, commentaires...)"
              minRows={3}
              maxRows={6}
              autosize
              {...register('notes')}
              value={watch('notes') || ''}
              onChange={(e) => setValue('notes', e.target.value, { shouldValidate: true })}
              error={errors.notes?.message}
            />

            {isCreateMode && (
              <TextInput
                label="Mot de passe"
                type="password"
                placeholder="Entrez le mot de passe"
                {...register('password', {
                  required: 'Le mot de passe est requis',
                  minLength: { value: 8, message: 'Le mot de passe doit contenir au moins 8 caractères' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
                    message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
                  }
                })}
                value={watch('password') || ''}
                onChange={(e) => setValue('password', e.target.value, { shouldValidate: true })}
                error={errors.password?.message}
              />
            )}

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

            {!isCreateMode && (
              <Button
                variant="outline"
                color="orange"
                onClick={handleResetPassword}
                loading={loading}
              >
                Réinitialiser le mot de passe
              </Button>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={isCreateMode ? (onClose || (() => {})) : () => setEditModalOpen(false)}
                leftSection={<IconX size={16} />}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconCheck size={16} />}
              >
                {isCreateMode ? 'Créer' : 'Sauvegarder'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de forçage de mot de passe (Super Admin uniquement) */}
      <Modal
        opened={forcePasswordModalOpen}
        onClose={() => setForcePasswordModalOpen(false)}
        title="Forcer le mot de passe"
        size="md"
      >
        <ForcePasswordForm
          onSubmit={handleForcePassword}
          onCancel={() => setForcePasswordModalOpen(false)}
          loading={loading}
        />
      </Modal>
    </Stack>
  );
};

// Composant pour le formulaire de forçage de mot de passe
interface ForcePasswordFormProps {
  onSubmit: (newPassword: string, reason?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const ForcePasswordForm: React.FC<ForcePasswordFormProps> = ({
  onSubmit,
  onCancel,
  loading
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (newPassword !== confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setValidationError(passwordErrors.join('. '));
      return;
    }

    onSubmit(newPassword, reason || undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          ⚠️ Cette action est irréversible et remplacera immédiatement le mot de passe de l'utilisateur.
        </Text>

        <TextInput
          label="Nouveau mot de passe"
          type="password"
          placeholder="Entrez le nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <TextInput
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Confirmez le nouveau mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Textarea
          label="Raison (optionnelle)"
          placeholder="Expliquez pourquoi vous forcez ce mot de passe..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minRows={2}
        />

        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
        </div>

        {validationError && (
          <div style={{ color: '#dc2626', fontSize: '14px' }}>
            {validationError}
          </div>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={onCancel}
            leftSection={<IconX size={16} />}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            color="red"
            loading={loading}
            leftSection={<IconCheck size={16} />}
          >
            Forcer le mot de passe
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default UserProfileTab;
