import React, { useEffect, useState } from 'react';
import { Container, Title, Text, Group, Select, TextInput, Button, Stack, Alert, Pagination, Grid, Paper } from '@mantine/core';
import { IconSearch, IconRefresh, IconAlertCircle, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAdminStore, UserStatusInfo } from '../../stores/adminStore';
import { UserListTable } from '../../components/business/UserListTable';
import UserDetailView from '../../components/business/UserDetailView';
import { UserProfileTab } from '../../components/business/UserProfileTab';
import { UserRole, UserStatus, AdminUser } from '../../services/adminService';

const AdminUsers: React.FC = () => {
  const {
    users,
    loading,
    error,
    filters,
    selectedUser,
    userStatuses,
    statusesLoading,
    statusesError,
    fetchUsers,
    updateUserRole,
    filterUsers,
    setFilters,
    setSelectedUser,
    fetchUserStatuses,
    startStatusPolling,
    stopStatusPolling
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Démarrer le polling des statuts
    startStatusPolling();
    
    // Nettoyer le polling lors du démontage du composant
    return () => {
      stopStatusPolling();
    };
  }, [fetchUsers, startStatusPolling, stopStatusPolling]);

  const handleRoleChange = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        notifications.show({
          title: 'Succès',
          message: 'Rôle mis à jour avec succès',
          color: 'green',
        });
      }
      return success;
    } catch {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le rôle',
        color: 'red',
      });
      return false;
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
    filterUsers({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (key: string, value: string | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    filterUsers(newFilters);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleRowClick = (user: AdminUser) => {
    setSelectedUser(user);
  };

  const handleUserUpdate = async (updatedUser: AdminUser) => {
    try {
      // Simplement rafraîchir la liste complète après mise à jour
      // C'est la solution la plus simple et la plus robuste
      await fetchUsers();

      // Remettre à jour l'utilisateur sélectionné avec les nouvelles données
      setSelectedUser(updatedUser);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      // En cas d'erreur, rafraîchir quand même la liste
      await fetchUsers();
    }
  };

  const handleCreateUser = async (newUser: AdminUser) => {
    try {
      // Fermer le modal et rafraîchir la liste
      setCreateModalOpen(false);
      await fetchUsers();

      notifications.show({
        title: 'Succès',
        message: 'Bénévole créé avec succès',
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de créer l\'utilisateur',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>Gestion des Utilisateurs</Title>
            <Text c="dimmed">
              Gérez les utilisateurs et leurs rôles dans le système
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconUserPlus size={16} />}
              onClick={() => setCreateModalOpen(true)}
              data-testid="create-user-button"
            >
              Créer un utilisateur
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

        {statusesError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Erreur de statuts"
            color="orange"
            data-testid="statuses-error-message"
          >
            {statusesError}
          </Alert>
        )}

        {/* Statistiques des statuts en ligne */}
        {userStatuses.length > 0 && (
          <Paper p="md" withBorder>
            <Group justify="space-between" align="center">
              <div>
                <Text size="lg" fw={600}>Statuts en ligne</Text>
                <Text size="sm" c="dimmed">
                  {userStatuses.filter(s => s.is_online).length} en ligne • {userStatuses.filter(s => !s.is_online).length} hors ligne
                </Text>
              </div>
              <Group gap="xs">
                <Button
                  variant="light"
                  size="xs"
                  onClick={fetchUserStatuses}
                  loading={statusesLoading}
                  data-testid="refresh-statuses-button"
                >
                  Actualiser les statuts
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        <Group gap="md" align="end">
          <TextInput
            placeholder="Rechercher un utilisateur..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
            data-testid="search-input"
          />
          <Button
            leftSection={<IconSearch size={16} />}
            onClick={handleSearch}
            data-testid="search-button"
          >
            Rechercher
          </Button>
        </Group>

        <Group gap="md" align="end">
          <Select
            label="Filtrer par rôle"
            placeholder="Tous les rôles"
            value={filters.role || null}
            onChange={(value) => handleFilterChange('role', value)}
            data={[
              { value: UserRole.USER, label: 'Bénévole' },
              { value: UserRole.ADMIN, label: 'Administrateur' },
              { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
            ]}
            clearable
            data-testid="role-filter"
          />
        </Group>

        {/* Structure Master-Detail */}
        <Grid>
          {/* Colonne Master - Liste des utilisateurs */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text size="lg" fw={600}>
                  Liste des utilisateurs
                </Text>
                <UserListTable
                  users={users}
                  loading={loading}
                  onRoleChange={handleRoleChange}
                  onRowClick={handleRowClick}
                  userStatuses={userStatuses}
                />
                
                {users.length > 0 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={Math.ceil(users.length / (filters.limit || 20))}
                      data-testid="pagination"
                      size="sm"
                    />
                  </Group>
                )}

                {users.length > 0 && (
                  <Group justify="center" mt="sm">
                    <Text size="sm" c="dimmed" data-testid="page-info">
                      {((currentPage - 1) * (filters.limit || 20)) + 1}-{Math.min(currentPage * (filters.limit || 20), users.length)} sur {users.length} utilisateurs
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Colonne Detail - Vue détaillée */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <UserDetailView
              user={selectedUser}
              loading={loading}
              onUserUpdate={handleUserUpdate}
            />
          </Grid.Col>
        </Grid>

        {/* Modal de création d'utilisateur */}
        <UserProfileTab
          user={null}
          onUserUpdate={handleCreateUser}
          isCreateMode={true}
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      </Stack>
    </Container>
  );
};

export default AdminUsers;