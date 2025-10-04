import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Alert,
  Table,
  Badge,
  ActionIcon,
  Paper,
  Modal,
  LoadingOverlay
} from '@mantine/core';
import {
  IconPlus,
  IconRefresh,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Category, categoryService } from '../../services/categoryService';
import { CategoryForm } from '../../components/business/CategoryForm';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des catégories');
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les catégories',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver la catégorie "${category.name}" ?`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(category.id);
      notifications.show({
        title: 'Succès',
        message: 'Catégorie désactivée avec succès',
        color: 'green',
      });
      fetchCategories();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.detail || 'Impossible de désactiver la catégorie',
        color: 'red',
      });
    }
  };

  const handleReactivate = async (category: Category) => {
    try {
      await categoryService.reactivateCategory(category.id);
      notifications.show({
        title: 'Succès',
        message: 'Catégorie réactivée avec succès',
        color: 'green',
      });
      fetchCategories();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.detail || 'Impossible de réactiver la catégorie',
        color: 'red',
      });
    }
  };

  const handleSubmit = async (data: { name: string }) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data);
        notifications.show({
          title: 'Succès',
          message: 'Catégorie mise à jour avec succès',
          color: 'green',
        });
      } else {
        await categoryService.createCategory(data);
        notifications.show({
          title: 'Succès',
          message: 'Catégorie créée avec succès',
          color: 'green',
        });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.detail || 'Erreur lors de l\'enregistrement',
        color: 'red',
      });
    }
  };

  const rows = categories.map((category) => (
    <tr key={category.id}>
      <td>{category.name}</td>
      <td>
        <Badge color={category.is_active ? 'green' : 'gray'}>
          {category.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </td>
      <td>
        <Group gap="xs">
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => handleEdit(category)}
            title="Modifier"
          >
            <IconEdit size={18} />
          </ActionIcon>
          {category.is_active ? (
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => handleDelete(category)}
              title="Désactiver"
            >
              <IconTrash size={18} />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="light"
              color="green"
              onClick={() => handleReactivate(category)}
              title="Réactiver"
            >
              <IconCheck size={18} />
            </ActionIcon>
          )}
        </Group>
      </td>
    </tr>
  ));

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Gestion des Catégories</Title>
            <Text c="dimmed" size="sm">
              Gérer les catégories de produits utilisées dans l'application
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={fetchCategories}
              loading={loading}
            >
              Actualiser
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreate}
            >
              Nouvelle catégorie
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erreur" color="red">
            {error}
          </Alert>
        )}

        <Paper shadow="sm" p="md" withBorder pos="relative">
          <LoadingOverlay visible={loading} />
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <tr>
                  <td colSpan={3}>
                    <Text ta="center" c="dimmed">
                      Aucune catégorie trouvée
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Paper>
      </Stack>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Container>
  );
};

export default AdminCategories;
