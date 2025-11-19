import React, { useEffect, useMemo, useCallback } from 'react'
import { useCategoryStore } from '../../stores/categoryStore'
import { Category } from '../../services/categoryService'

interface CategoryDisplayManagerProps {
  /** Ticket type: 'entry' for ENTRY/DEPOT tickets, 'sale' for SALE/CASH REGISTER tickets */
  ticketType: 'entry' | 'sale'
  /** Callback when categories are loaded */
  onCategoriesLoaded?: (categories: Category[]) => void
  /** Children render function that receives filtered categories */
  children?: (categories: Category[]) => React.ReactNode
}

/**
 * CategoryDisplayManager - Manages category visibility and selection logic
 * 
 * CRITICAL SCOPE:
 * - ENTRY/DEPOT tickets: Respects visibility settings (is_visible)
 * - SALE/CASH REGISTER tickets: Always shows ALL categories
 * 
 * AC 1.2.3: Automatically adapts selection logic based on visibility settings
 * AC 1.2.4: Changes are persisted immediately via API
 */
export const CategoryDisplayManager: React.FC<CategoryDisplayManagerProps> = ({
  ticketType,
  onCategoriesLoaded,
  children
}) => {
  const {
    categories,
    activeCategories,
    visibleCategories,
    loading,
    error,
    fetchCategories,
    fetchVisibleCategories
  } = useCategoryStore()

  // Fetch appropriate categories based on ticket type
  useEffect(() => {
    if (ticketType === 'entry') {
      // ENTRY tickets: fetch visible categories only
      fetchVisibleCategories()
    } else {
      // SALE tickets: fetch all active categories (ignore visibility)
      fetchCategories()
    }
  }, [ticketType, fetchCategories, fetchVisibleCategories])

  // Get filtered categories based on ticket type
  const filteredCategories = useMemo(() => {
    if (ticketType === 'entry') {
      // ENTRY tickets: use visible categories
      return visibleCategories
    } else {
      // SALE tickets: use all active categories (ignore visibility)
      return activeCategories
    }
  }, [ticketType, visibleCategories, activeCategories])

  // Build category hierarchy with visibility logic
  const categoryHierarchy = useMemo(() => {
    const buildHierarchy = (
      categories: Category[],
      parentId: string | null = null
    ): Category[] => {
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

      // AC 1.2.2: If no visible subcategories, parent category is sufficient
      return children.map(category => {
        const subcategories = buildHierarchy(categories, category.id)
        const visibleSubcategories = subcategories.filter(cat => cat.is_visible)
        
        // If parent has children but none are visible, mark parent as selectable
        if (subcategories.length > 0 && visibleSubcategories.length === 0 && category.is_visible) {
          // Parent is selectable when all children are hidden
          return {
            ...category,
            _isSelectable: true,
            _hasVisibleChildren: false
          }
        }

        return {
          ...category,
          _isSelectable: subcategories.length === 0 || visibleSubcategories.length > 0,
          _hasVisibleChildren: visibleSubcategories.length > 0,
          children: subcategories
        }
      })
    }

    return buildHierarchy(filteredCategories)
  }, [filteredCategories])

  // Notify parent when categories are loaded
  useEffect(() => {
    if (!loading && filteredCategories.length > 0 && onCategoriesLoaded) {
      onCategoriesLoaded(categoryHierarchy)
    }
  }, [loading, filteredCategories, categoryHierarchy, onCategoriesLoaded])

  // Get root categories (for display)
  const rootCategories = useMemo(() => {
    return categoryHierarchy.filter(cat => !cat.parent_id)
  }, [categoryHierarchy])

  // Get category by ID with hierarchy context
  const getCategoryById = useCallback((categoryId: string): Category | undefined => {
    const findCategory = (cats: Category[]): Category | undefined => {
      for (const cat of cats) {
        if (cat.id === categoryId) {
          return cat
        }
        if ((cat as any).children) {
          const found = findCategory((cat as any).children)
          if (found) return found
        }
      }
      return undefined
    }
    return findCategory(categoryHierarchy)
  }, [categoryHierarchy])

  // Check if category is selectable (AC 1.2.2)
  const isCategorySelectable = useCallback((categoryId: string): boolean => {
    const category = getCategoryById(categoryId)
    if (!category) return false
    
    // If category has _isSelectable flag, use it
    if ((category as any)._isSelectable !== undefined) {
      return (category as any)._isSelectable
    }
    
    // Default: leaf categories are selectable
    return !category.parent_id || true
  }, [getCategoryById])

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

  // Render children with filtered categories
  if (children) {
    return <>{children(categoryHierarchy)}</>
  }

  // Default: render root categories
  return (
    <div>
      {rootCategories.map(category => (
        <div key={category.id}>
          {category.name}
        </div>
      ))}
    </div>
  )
}

// Export utility functions
export const useCategoryDisplay = (ticketType: 'entry' | 'sale') => {
  const {
    categories,
    activeCategories,
    visibleCategories,
    loading,
    error,
    fetchCategories,
    fetchVisibleCategories
  } = useCategoryStore()

  const filteredCategories = React.useMemo(() => {
    if (ticketType === 'entry') {
      return visibleCategories
    } else {
      return activeCategories
    }
  }, [ticketType, visibleCategories, activeCategories])

  React.useEffect(() => {
    if (ticketType === 'entry') {
      fetchVisibleCategories()
    } else {
      fetchCategories()
    }
  }, [ticketType, fetchCategories, fetchVisibleCategories])

  return {
    categories: filteredCategories,
    loading,
    error
  }
}

export default CategoryDisplayManager

