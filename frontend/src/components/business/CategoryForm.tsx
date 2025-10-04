import React, { useState, useEffect } from 'react';
import { TextInput, Button, Group, Stack } from '@mantine/core';
import { Category } from '../../services/categoryService';

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName('');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim() });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Nom de la catégorie"
          placeholder="Ex: Électronique, Meubles, Vêtements..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          required
          data-autofocus
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {category ? 'Mettre à jour' : 'Créer'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
