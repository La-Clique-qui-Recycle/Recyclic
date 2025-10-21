import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Table,
  Button,
  Group as MantineGroup,
  Modal,
  TextInput,
  Textarea,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Stack,
  MultiSelect,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconLock } from '@tabler/icons-react';
import groupService, { Group, GroupDetail, Permission } from '../../services/groupService';
import adminService, { AdminUser } from '../../services/adminService';

// Fonction pour mapper les permissions vers des noms de modules lisibles
const getModuleName = (permissionName: string): string => {
  const moduleMap: { [key: string]: string } = {
    'caisse.access': 'Caisse',
    'reception.access': 'Réception',
    'admin.users.manage': 'Gestion des Utilisateurs',
    'admin.groups.manage': 'Gestion des Groupes',
    'reports.view': 'Consultation des Rapports',
    'reports.export': 'Export des Rapports',
  };
  
  return moduleMap[permissionName] || permissionName;
};

export default function GroupsReal() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [managePermissionsModalOpen, setManagePermissionsModalOpen] = useState(false);
  const [manageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);

  const createForm = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (value.length < 3 ? 'Le nom doit contenir au moins 3 caractères' : null),
    },
  });

  const editForm = useForm({
    initialValues: {
      name: '',
      description: '',
    },
  });

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [groupsData, permissionsData, usersData] = await Promise.all([
        groupService.listGroups(),
        groupService.listPermissions(),
        adminService.getUsers(),
      ]);
      
      setGroups(groupsData);
      setPermissions(permissionsData);
      
      // Filtrer pour ne montrer que les bénévoles (rôle 'user')
      const benevoles = usersData.filter(user => user.role === 'user');
      setUsers(benevoles);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: typeof createForm.values) => {
    try {
      await groupService.createGroup(values);
      notifications.show({
        title: 'Succès',
        message: 'Groupe créé avec succès',
        color: 'green',
      });
      setCreateModalOpen(false);
      createForm.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Erreur lors de la création du groupe',
        color: 'red',
      });
    }
  };

  const handleEdit = async (values: typeof editForm.values) => {
    if (!selectedGroup) return;

    try {
      await groupService.updateGroup(selectedGroup.id, values);
      notifications.show({
        title: 'Succès',
        message: 'Groupe mis à jour avec succès',
        color: 'green',
      });
      setEditModalOpen(false);
      setSelectedGroup(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Erreur lors de la mise à jour du groupe',
        color: 'red',
      });
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;

    try {
      await groupService.deleteGroup(groupId);
      notifications.show({
        title: 'Succès',
        message: 'Groupe supprimé avec succès',
        color: 'green',
      });
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Erreur lors de la suppression du groupe',
        color: 'red',
      });
    }
  };

  const openEditModal = async (groupId: string) => {
    try {
      const group = await groupService.getGroup(groupId);
      setSelectedGroup(group);
      editForm.setValues({
        name: group.name,
        description: group.description || '',
      });
      setEditModalOpen(true);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les détails du groupe',
        color: 'red',
      });
    }
  };

  const openManagePermissionsModal = async (groupId: string) => {
    try {
      const group = await groupService.getGroup(groupId);
      setSelectedGroup(group);
      setSelectedPermissionIds(group.permissions.map((p) => p.id));
      setManagePermissionsModalOpen(true);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les détails du groupe',
        color: 'red',
      });
    }
  };

  const openManageUsersModal = async (groupId: string) => {
    try {
      const group = await groupService.getGroup(groupId);
      setSelectedGroup(group);
      setSelectedUserIds(group.users.map((u) => u.id));
      setManageUsersModalOpen(true);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les détails du groupe',
        color: 'red',
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedGroup) return;

    try {
      // Remove permissions that are no longer selected
      const currentPermissionIds = selectedGroup.permissions.map((p) => p.id);
      const toRemove = currentPermissionIds.filter((id) => !selectedPermissionIds.includes(id));

      for (const permId of toRemove) {
        await groupService.removePermissionFromGroup(selectedGroup.id, permId);
      }

      // Add new permissions
      const toAdd = selectedPermissionIds.filter((id) => !currentPermissionIds.includes(id));
      if (toAdd.length > 0) {
        await groupService.assignPermissionsToGroup(selectedGroup.id, {
          permission_ids: toAdd,
        });
      }

      notifications.show({
        title: 'Succès',
        message: 'Permissions mises à jour avec succès',
        color: 'green',
      });
      setManagePermissionsModalOpen(false);
      setSelectedGroup(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Erreur lors de la mise à jour des permissions',
        color: 'red',
      });
    }
  };

  const handleSaveUsers = async () => {
    if (!selectedGroup) return;

    try {
      // Remove users that are no longer selected
      const currentUserIds = selectedGroup.users.map((u) => u.id);
      const toRemove = currentUserIds.filter((id) => !selectedUserIds.includes(id));

      for (const userId of toRemove) {
        await groupService.removeUserFromGroup(selectedGroup.id, userId);
      }

      // Add new users
      const toAdd = selectedUserIds.filter((id) => !currentUserIds.includes(id));
      if (toAdd.length > 0) {
        await groupService.assignUsersToGroup(selectedGroup.id, {
          user_ids: toAdd,
        });
      }

      notifications.show({
        title: 'Succès',
        message: 'Utilisateurs mis à jour avec succès',
        color: 'green',
      });
      setManageUsersModalOpen(false);
      setSelectedGroup(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Erreur lors de la mise à jour des utilisateurs',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} />

      <MantineGroup justify="space-between" mb="lg">
        <Title order={2}>Gestion des Groupes (API Réelle)</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Créer un groupe
        </Button>
      </MantineGroup>

      <Paper shadow="sm" p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Utilisateurs</Table.Th>
              <Table.Th>Permissions</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.map((group) => (
              <Table.Tr key={group.id}>
                <Table.Td>{group.name}</Table.Td>
                <Table.Td>{group.description || '-'}</Table.Td>
                <Table.Td>
                  <Badge>{group.user_ids.length}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue">{group.permission_ids.length}</Badge>
                </Table.Td>
                <Table.Td>
                  <MantineGroup gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => openEditModal(group.id)}
                      title="Modifier"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => openManageUsersModal(group.id)}
                      title="Gérer les utilisateurs"
                    >
                      <IconUsers size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="violet"
                      onClick={() => openManagePermissionsModal(group.id)}
                      title="Gérer les permissions"
                    >
                      <IconLock size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(group.id)}
                      title="Supprimer"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </MantineGroup>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Create Group Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          createForm.reset();
        }}
        title="Créer un nouveau groupe"
      >
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack>
            <TextInput
              label="Nom du groupe"
              placeholder="Ex: Équipe Caisse"
              required
              {...createForm.getInputProps('name')}
            />
            <Textarea
              label="Description"
              placeholder="Description du groupe"
              {...createForm.getInputProps('description')}
            />
            <MantineGroup justify="flex-end">
              <Button variant="subtle" onClick={() => setCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </MantineGroup>
          </Stack>
        </form>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedGroup(null);
        }}
        title="Modifier le groupe"
      >
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack>
            <TextInput
              label="Nom du groupe"
              placeholder="Ex: Équipe Caisse"
              required
              {...editForm.getInputProps('name')}
            />
            <Textarea
              label="Description"
              placeholder="Description du groupe"
              {...editForm.getInputProps('description')}
            />
            <MantineGroup justify="flex-end">
              <Button variant="subtle" onClick={() => setEditModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </MantineGroup>
          </Stack>
        </form>
      </Modal>

      {/* Manage Permissions Modal */}
      <Modal
        opened={managePermissionsModalOpen}
        onClose={() => {
          setManagePermissionsModalOpen(false);
          setSelectedGroup(null);
        }}
        title="Gérer les permissions du groupe"
        size="md"
      >
        <Stack>
          {/* Boutons en haut */}
          <MantineGroup justify="flex-end" mb="md">
            <Button
              variant="subtle"
              onClick={() => setManagePermissionsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSavePermissions}>Enregistrer</Button>
          </MantineGroup>
          
          <MultiSelect
            label="Permissions"
            placeholder="Sélectionner les permissions"
            data={permissions.map((p) => ({
              value: p.id,
              label: getModuleName(p.name),
            }))}
            value={selectedPermissionIds}
            onChange={setSelectedPermissionIds}
            searchable
          />
        </Stack>
      </Modal>

      {/* Manage Users Modal */}
      <Modal
        opened={manageUsersModalOpen}
        onClose={() => {
          setManageUsersModalOpen(false);
          setSelectedGroup(null);
        }}
        title="Gérer les utilisateurs du groupe"
        size="md"
      >
        <Stack>
          {/* Boutons en haut */}
          <MantineGroup justify="flex-end" mb="md">
            <Button variant="subtle" onClick={() => setManageUsersModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveUsers}>Enregistrer</Button>
          </MantineGroup>
          
          <MultiSelect
            label="Utilisateurs"
            placeholder="Sélectionner les utilisateurs"
            data={users.map((u) => ({
              value: u.id,
              label: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.id,
            }))}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            searchable
          />
        </Stack>
      </Modal>
    </Container>
  );
}
