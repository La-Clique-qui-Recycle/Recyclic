import React, { useState, useEffect } from 'react';
import { TextInput, Button, Group, Stack, NumberInput, Select } from '@mantine/core';
import { Category, categoryService } from '../../services/categoryService';

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (data: { name: string; parent_id?: string | null; price?: number | null; min_price?: number | null; max_price?: number | null }) => Promise<void>;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [price, setPrice] = useState<number | string>('');
  const [minPrice, setMinPrice] = useState<number | string>('');
  const [maxPrice, setMaxPrice] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Determine if price fields should be enabled (only for subcategories with parent_id)
  const hasParent = parentId != null;

  // Charger les catégories disponibles
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const categories = await categoryService.getCategories(true); // Seulement les actives
        // Exclure la catégorie en cours d'édition pour éviter les références circulaires
        const filteredCategories = category 
          ? categories.filter(cat => cat.id !== category.id)
          : categories;
        setAvailableCategories(filteredCategories);
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [category]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parent_id || null);
      setPrice(category.price ?? '');
      setMinPrice(category.min_price ?? '');
      setMaxPrice(category.max_price ?? '');
    } else {
      setName('');
      setParentId(null);
      setPrice('');
      setMinPrice('');
      setMaxPrice('');
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
      const data: { name: string; parent_id?: string | null; price?: number | null; min_price?: number | null; max_price?: number | null } = {
        name: name.trim(),
        parent_id: parentId,
      };

      // Only include price fields if category has a parent (subcategory)
      if (hasParent) {
        data.price = price === '' ? null : Number(price);
        data.min_price = minPrice === '' ? null : Number(minPrice);
        data.max_price = maxPrice === '' ? null : Number(maxPrice);
      }

      await onSubmit(data);
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

        <Select
          label="Catégorie parente"
          placeholder="Sélectionner une catégorie parente (optionnel)"
          value={parentId}
          onChange={(value) => setParentId(value)}
          data={[
            { value: '', label: 'Aucune (catégorie racine)' },
            ...availableCategories.map(cat => ({
              value: cat.id,
              label: cat.name
            }))
          ]}
          clearable
          searchable
          loading={loadingCategories}
          data-testid="parent-category-select"
        />

        {hasParent && (
          <>
            <NumberInput
              label="Prix fixe"
              placeholder="Prix suggéré (optionnel)"
              value={price}
              onChange={setPrice}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="€ "
              data-testid="price-input"
            />

            <NumberInput
              label="Prix minimum"
              placeholder="Prix minimum (optionnel)"
              value={minPrice}
              onChange={setMinPrice}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="€ "
              data-testid="min-price-input"
            />

            <NumberInput
              label="Prix maximum"
              placeholder="Prix maximum (optionnel)"
              value={maxPrice}
              onChange={setMaxPrice}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="€ "
              data-testid="max-price-input"
            />
          </>
        )}

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
