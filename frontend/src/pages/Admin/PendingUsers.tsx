import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Title, Text, Group, Button, Stack, Alert } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import PendingUsersTable from '../../components/business/PendingUsersTable';
import { adminService, AdminUser } from '../../services/adminService';

const PendingUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true); // Toujours initialiser à true pour un état prévisible
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const cachedUsersRef = useRef<AdminUser[] | null>(null);

  const fetchPendingUsers = useMemo(
    () => async () => {
      // Ne met à jour le chargement que si le cache est vide
      if (!cachedUsersRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const pendingUsers = await adminService.getPendingUsers();
        setUsers(pendingUsers);
        cachedUsersRef.current = pendingUsers;
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs en attente:', err);
        setError('Impossible de récupérer les utilisateurs en attente');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const pendingUsers = await adminService.getPendingUsers();
        if (isMounted) {
          setUsers(pendingUsers);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs en attente:', err);
        if (isMounted) {
          setError('Impossible de récupérer les utilisateurs en attente');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []); // <-- Tableau de dépendances vide pour une exécution unique

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
        cachedUsersRef.current = null; // Invalider le cache avant de rafraîchir
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
        cachedUsersRef.current = null; // Invalider le cache avant de rafraîchir
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
    cachedUsersRef.current = null;
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
            <a
              href="/admin/users"
              aria-label="Voir tous les utilisateurs"
            >
              <IconUsers size={16} />
              {' '}Tous les utilisateurs
            </a>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={loading}
              disabled={loading}
              aria-label="Actualiser"
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
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleRefresh}>Réessayer</Button>
            </div>
          </Alert>
        )}

        <PendingUsersTable
          users={users}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewUser={handleViewUser}
        />

        <Group justify="center" mt="sm">
          <Text size="sm" c="dimmed" data-testid="count-info">
            {`${users.length} utilisateur${users.length === 1 ? '' : 's'} en attente`}
          </Text>
        </Group>
      </Stack>
    </Container>
  );
};

export default PendingUsers;

