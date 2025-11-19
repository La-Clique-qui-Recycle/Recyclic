import React, { useEffect, useState, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { Checkbox, Group, Stack, Text, ActionIcon, NumberInput } from '@mantine/core'
import { IconChevronDown, IconChevronRight, IconGripVertical } from '@tabler/icons-react'
import { useCategoryStore } from '../../stores/categoryStore'
import { notifications } from '@mantine/notifications'

const CategoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
`

const CategoryItem = styled.div<{ $level?: number }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  margin-left: ${props => (props.$level || 0) * 1.5}rem;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #2c5530;
  }
`

const CategoryName = styled.div`
  font-weight: 500;
  flex: 1;
`

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`

const OrderInput = styled(NumberInput)`
  width: 80px;
`

interface EnhancedCategorySelectorProps {
  /** Callback when category is selected (for ticket creation) */
  onSelect?: (categoryId: string) => void
  /** Currently selected category ID */
  selectedCategory?: string
  /** If true, shows checkboxes for visibility management (admin mode) */
  showVisibilityControls?: boolean
  /** If true, shows display order controls */
  showDisplayOrder?: boolean
  /** If true, uses visibleCategories (for ENTRY tickets). If false, uses activeCategories (for SALE tickets) */
  useVisibleCategories?: boolean
}

export const EnhancedCategorySelector: React.FC<EnhancedCategorySelectorProps> = ({
  onSelect,
  selectedCategory,
  showVisibilityControls = false,
  showDisplayOrder = false,
  useVisibleCategories = true // Par défaut, utiliser les catégories visibles (pour ENTRY tickets)
}) => {
  const {
    categories,
    activeCategories,
    visibleCategories,
    loading,
    error,
    fetchCategories,
    fetchVisibleCategories,
    toggleCategoryVisibility,
    updateDisplayOrder
  } = useCategoryStore()

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [updatingCategories, setUpdatingCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (showVisibilityControls) {
      // Fetch all categories for admin view
      fetchCategories()
    } else if (useVisibleCategories) {
      // Fetch visible categories for ENTRY tickets
      fetchVisibleCategories()
    } else {
      // Fetch all active categories for SALE tickets (ignore visibility)
      fetchCategories()
    }
  }, [fetchCategories, fetchVisibleCategories, showVisibilityControls, useVisibleCategories])


  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const handleVisibilityToggle = useCallback(async (categoryId: string, currentVisibility: boolean) => {
    setUpdatingCategories(prev => new Set(prev).add(categoryId))
    
    try {
      // Mise à jour optimiste : le store met à jour immédiatement sans recharger
      await toggleCategoryVisibility(categoryId, !currentVisibility)
      notifications.show({
        title: 'Visibilité mise à jour',
        message: `La catégorie a été ${!currentVisibility ? 'affichée' : 'masquée'}`,
        color: 'green'
      })
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.detail || 'Erreur lors de la mise à jour de la visibilité',
        color: 'red'
      })
    } finally {
      setUpdatingCategories(prev => {
        const next = new Set(prev)
        next.delete(categoryId)
        return next
      })
    }
  }, [toggleCategoryVisibility])

  const handleDisplayOrderChange = useCallback(async (categoryId: string, newOrder: number) => {
    setUpdatingCategories(prev => new Set(prev).add(categoryId))
    
    try {
      // Mise à jour optimiste : le store met à jour immédiatement sans recharger
      await updateDisplayOrder(categoryId, newOrder)
      notifications.show({
        title: 'Ordre mis à jour',
        message: 'L\'ordre d\'affichage a été modifié',
        color: 'green'
      })
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.detail || 'Erreur lors de la mise à jour de l\'ordre',
        color: 'red'
      })
    } finally {
      setUpdatingCategories(prev => {
        const next = new Set(prev)
        next.delete(categoryId)
        return next
      })
    }
  }, [updateDisplayOrder])

  // Build category tree
  const buildCategoryTree = (categories: typeof activeCategories, parentId: string | null = null, level: number = 0): JSX.Element[] => {
    const children = categories
      .filter(cat => {
        if (parentId === null) {
          return !cat.parent_id
        }
        return cat.parent_id === parentId
      })
      .sort((a, b) => {
        // Sort by display_order first, then by name
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order
        }
        return a.name.localeCompare(b.name)
      })

    return children.map(category => {
      const hasChildren = categories.some(cat => cat.parent_id === category.id)
      const isExpanded = expandedCategories.has(category.id)
      const isUpdating = updatingCategories.has(category.id)
      const isSelected = selectedCategory === category.id

      // AC 1.2.2: If no subcategories are visible, parent category is sufficient
      const visibleChildren = categories.filter(cat => 
        cat.parent_id === category.id && cat.is_visible
      )
      const shouldShowParent = hasChildren && visibleChildren.length === 0 && category.is_visible

      return (
        <React.Fragment key={category.id}>
          <CategoryItem 
            $level={level}
            style={{
              backgroundColor: isSelected ? '#e8f5e8' : undefined,
              borderColor: isSelected ? '#2c5530' : undefined
            }}
          >
            {hasChildren && (
              <ActionIcon
                variant="subtle"
                onClick={() => toggleExpand(category.id)}
                size="sm"
                data-testid={`expand-${category.id}`}
              >
                {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              </ActionIcon>
            )}
            {!hasChildren && <div style={{ width: 24 }} />}

            {showVisibilityControls && (
              <Checkbox
                checked={category.is_visible}
                onChange={() => handleVisibilityToggle(category.id, category.is_visible)}
                disabled={isUpdating}
                data-testid={`visibility-checkbox-${category.id}`}
                aria-label={`Afficher/masquer ${category.name}`}
              />
            )}

            <CategoryInfo>
              <CategoryName
                onClick={() => onSelect?.(category.id)}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
                data-testid={`category-${category.id}`}
              >
                {category.name}
                {shouldShowParent && (
                  <Text size="xs" c="dimmed" component="span" style={{ marginLeft: '0.5rem' }}>
                    (sous-catégories masquées)
                  </Text>
                )}
              </CategoryName>
              
              {category.shortcut_key && (
                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                  {category.shortcut_key.toUpperCase()}
                </Text>
              )}
            </CategoryInfo>

            {showDisplayOrder && (
              <OrderInput
                value={category.display_order}
                onChange={(value) => {
                  const numValue = typeof value === 'number' ? value : parseInt(value || '0', 10)
                  if (!isNaN(numValue)) {
                    handleDisplayOrderChange(category.id, numValue)
                  }
                }}
                min={0}
                step={1}
                disabled={isUpdating}
                size="xs"
                data-testid={`display-order-${category.id}`}
              />
            )}
          </CategoryItem>

          {hasChildren && isExpanded && (
            <div>
              {buildCategoryTree(categories, category.id, level + 1)}
            </div>
          )}
        </React.Fragment>
      )
    })
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        Chargement des catégories...
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive">
        Erreur lors du chargement des catégories: {error}
      </div>
    )
  }

  // Use visible categories for ENTRY tickets, all active categories for SALE tickets or admin
  const categoriesToDisplay = showVisibilityControls 
    ? activeCategories 
    : (useVisibleCategories ? visibleCategories : activeCategories)

  return (
    <CategoryContainer role="group" aria-label="Sélection de catégorie">
      {buildCategoryTree(categoriesToDisplay)}
    </CategoryContainer>
  )
}

export default EnhancedCategorySelector
