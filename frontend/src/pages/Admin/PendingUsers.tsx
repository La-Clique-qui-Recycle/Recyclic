import React, { useEffect, useState } from 'react';
import { Container, Title, Text, Group, Button, Stack, Alert } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PendingUsersTable from '../../components/business/PendingUsersTable';
import { adminService, AdminUser } from '../../services/adminService';

const PendingUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const pendingUsers = await adminService.getPendingUsers();
      setUsers(pendingUsers);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs en attente:', err);
      setError('Impossible de récupérer les utilisateurs en attente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string, message?: string): Promise<boolean> => {
    try {
      const result = await adminService.approveUser(userId, message);
      if (result.success) {
        notifications.show({
          title: 'Succès',
          message: result.message,
          color: 'green',
        });
        // Rafraîchir la liste
        await fetchPendingUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur lors de l\'approbation:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'approuver l\'utilisateur',
        color: 'red',
      });
      return false;
    }
  };

  const handleReject = async (userId: string, reason?: string): Promise<boolean> => {
    try {
      const result = await adminService.rejectUser(userId, reason);
      if (result.success) {
        notifications.show({
          title: 'Succès',
          message: result.message,
          color: 'orange',
        });
        // Rafraîchir la liste
        await fetchPendingUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur lors du rejet:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de rejeter l\'utilisateur',
        color: 'red',
      });
      return false;
    }
  };

  const handleViewUser = (user: AdminUser) => {
    // TODO: Implémenter la vue détaillée de l'utilisateur
    console.log('Voir utilisateur:', user);
    notifications.show({
      title: 'Info',
      message: `Détails de l'utilisateur ${user.full_name || user.username}`,
      color: 'blue',
    });
  };

  const handleRefresh = () => {
    fetchPendingUsers();
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>Demandes d'Inscription</Title>
            <Text c="dimmed">
              Gérez les demandes d'inscription en attente d'approbation
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconUsers size={16} />}
              variant="outline"
              onClick={() => window.location.href = '/admin/users'}
            >
              Tous les utilisateurs
            </Button>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={loading}
              data-testid="refresh-button"
            >
              Actualiser
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Erreur"
            color="red"
            data-testid="error-message"
          >
            {error}
          </Alert>
        )}

        <PendingUsersTable
          users={users}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewUser={handleViewUser}
        />

        {users.length > 0 && (
          <Group justify="center" mt="sm">
            <Text size="sm" c="dimmed" data-testid="count-info">
              {users.length} utilisateur{users.length > 1 ? 's' : ''} en attente
            </Text>
          </Group>
        )}
      </Stack>
    </Container>
  );
};

export default PendingUsers;
