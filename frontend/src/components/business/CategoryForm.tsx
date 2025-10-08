import React, { useState, useEffect } from 'react';
import { TextInput, Button, Group, Stack, NumberInput, Select, Alert } from '@mantine/core';
import { Category, categoryService } from '../../services/categoryService';

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (data: { name: string; parent_id?: string | null; price?: number | null; max_price?: number | null }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [price, setPrice] = useState<number | string>('');
  const [maxPrice, setMaxPrice] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);

  // NEW RULE: Prices are allowed only on leaf categories.
  // UX: Always enable inputs so users can CLEAR prices even if the category currently has children.
  // Guard in submit: if has children, only allow empty/zero (treated as null) values.
  const canSetNonNullPrice = !hasChildren;

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
      setMaxPrice(category.max_price ?? '');

      // NEW RULE: Check if category has children to determine if price fields should be disabled
      const checkChildren = async () => {
        try {
          const children = await categoryService.getCategoryChildren(category.id);
          setHasChildren(children.length > 0);
        } catch (err) {
          console.error('Erreur lors du chargement des enfants de la catégorie:', err);
          setHasChildren(false);
        }
      };
      checkChildren();
    } else {
      setName('');
      setParentId(null);
      setPrice('');
      setMaxPrice('');
      setHasChildren(false);
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
      const data: { name: string; parent_id?: string | null; price?: number | null; max_price?: number | null } = {
        name: name.trim(),
        parent_id: parentId,
      };

      // Normalize: treat empty or 0.00 as null
      const normalizedPrice = price === '' || Number(price) === 0 ? null : Number(price);
      const normalizedMaxPrice = maxPrice === '' || Number(maxPrice) === 0 ? null : Number(maxPrice);

      // Guard: if category has children, only allow clearing (null), not setting non-null prices
      if (!canSetNonNullPrice) {
        if (normalizedPrice !== null || normalizedMaxPrice !== null) {
          setError("Cette catégorie a des sous-catégories. Vous pouvez uniquement vider les prix (laisser vide ou 0).);");
          setLoading(false);
          return;
        }
      }

      data.price = normalizedPrice;
      data.max_price = normalizedMaxPrice;

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
        {hasChildren && (
          (price !== '' && Number(price) !== 0) || (maxPrice !== '' && Number(maxPrice) !== 0)
        ) && (
          <Alert color="yellow" title="Avertissement">
            Cette catégorie a des sous-catégories. Pour pouvoir créer des sous-catégories, videz les champs de prix (laisser vide ou 0).
          </Alert>
        )}
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
          aria-label="Sélecteur de catégorie parente"
        />

        <NumberInput
          label="Prix fixe"
          placeholder={canSetNonNullPrice ? "Prix suggéré (optionnel)" : "Laisser vide ou 0 pour enlever le prix (catégorie avec sous-catégories)"}
          value={price}
          onChange={setPrice}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          prefix="€ "
          data-testid="price-input"
          aria-label="Prix minimum"
          description={!canSetNonNullPrice ? "Catégorie avec sous-catégories: seuls les champs vides ou 0 sont acceptés (supprime le prix)." : undefined}
        />

        <NumberInput
          label="Prix maximum"
          placeholder={canSetNonNullPrice ? "Prix maximum (optionnel)" : "Laisser vide ou 0 pour enlever le prix"}
          value={maxPrice}
          onChange={setMaxPrice}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          prefix="€ "
          data-testid="max-price-input"
          aria-label="Prix maximum"
          description={!canSetNonNullPrice ? "Catégorie avec sous-catégories: seuls les champs vides ou 0 sont acceptés." : undefined}
        />

        <Group justify="space-between" gap="sm">
          {category && onDelete && (
            <Button
              color="red"
              variant="light"
              onClick={async () => {
                const ok = confirm('Supprimer définitivement cette catégorie ? Cette action la retirera de la vue.');
                if (!ok) return;
                setLoading(true);
                try {
                  await onDelete();
                } finally {
                  setLoading(false);
                }
              }}
            >
              Supprimer
            </Button>
          )}
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
