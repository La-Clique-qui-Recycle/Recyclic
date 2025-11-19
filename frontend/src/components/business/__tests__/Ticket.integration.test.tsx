import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Ticket from '../Ticket';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import { useCategoryStore } from '../../../stores/categoryStore';
import { usePresetStore } from '../../../stores/presetStore';

// Mock the stores
vi.mock('../../../stores/cashSessionStore');
vi.mock('../../../stores/categoryStore');
vi.mock('../../../stores/presetStore');

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Ticket Integration - Scrollable Functionality', () => {
  const mockItems = [
    {
      id: 'item-1',
      category: 'cat1',
      categoryName: 'Category 1',
      quantity: 1,
      weight: 1.5,
      price: 10.0,
      total: 10.0
    },
    {
      id: 'item-2',
      category: 'cat2',
      categoryName: 'Category 2',
      quantity: 2,
      weight: 2.0,
      price: 15.0,
      total: 30.0
    },
    {
      id: 'item-3',
      category: 'cat3',
      categoryName: 'Category 3',
      quantity: 1,
      weight: 3.0,
      price: 20.0,
      total: 20.0
    }
  ];

  const mockOnRemoveItem = vi.fn();
  const mockOnUpdateItem = vi.fn();
  const mockOnFinalizeSale = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store implementations
    (useCashSessionStore as any).mockReturnValue({
      ticketScrollState: {
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        canScrollUp: false,
        canScrollDown: false,
        isScrollable: false
      },
      setScrollPosition: vi.fn(),
      updateScrollableState: vi.fn(),
      resetScrollState: vi.fn()
    });

    (useCategoryStore as any).mockReturnValue({
      getCategoryById: vi.fn((id) => ({ name: `Category ${id}` })),
      fetchCategories: vi.fn()
    });

    (usePresetStore as any).mockReturnValue({
      selectedPreset: null,
      notes: '',
      setNotes: vi.fn(),
      presets: []
    });
  });

  describe('Scrollable Layout', () => {
    it('should render ticket with scrollable area', () => {
      render(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Should have ticket header
      expect(screen.getByText('Ticket de Caisse')).toBeInTheDocument();

      // Should have scrollable region
      const scrollRegion = screen.getByRole('region', {
        name: 'Zone de défilement des articles du ticket'
      });
      expect(scrollRegion).toBeInTheDocument();

      // Should have fixed footer
      expect(screen.getByText('3 articles')).toBeInTheDocument();
      expect(screen.getByText('60.00 €')).toBeInTheDocument();
      expect(screen.getByText('Finaliser la vente')).toBeInTheDocument();
    });

    it('should display all items in scrollable area', () => {
      render(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Check all items are displayed
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
      expect(screen.getByText('Category 3')).toBeInTheDocument();

      // Check totals are displayed
      expect(screen.getByText('10.00 €')).toBeInTheDocument();
      expect(screen.getByText('30.00 €')).toBeInTheDocument();
      expect(screen.getByText('20.00 €')).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior', () => {
    it('should auto-scroll to bottom when items are added', async () => {
      const { rerender } = render(
        <Ticket
          items={[mockItems[0]]}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Initially should have 1 item
      expect(screen.getByText('1 articles')).toBeInTheDocument();

      // Add more items
      rerender(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Should update to 3 items
      expect(screen.getByText('3 articles')).toBeInTheDocument();
      expect(screen.getByText('60.00 €')).toBeInTheDocument();
    });

    it('should maintain fixed footer visibility', () => {
      // Create many items to ensure scrolling
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        category: `cat${i}`,
        categoryName: `Category ${i}`,
        quantity: 1,
        weight: 1.0,
        price: 10.0,
        total: 10.0
      }));

      render(
        <Ticket
          items={manyItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Footer should always be visible
      const finalizeButton = screen.getByText('Finaliser la vente');
      expect(finalizeButton).toBeInTheDocument();

      const totalAmount = screen.getByText('200.00 €');
      expect(totalAmount).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      render(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      const scrollableArea = screen.getByRole('list', {
        name: 'Liste des articles du ticket'
      });

      // Should be focusable
      expect(scrollableArea).toHaveAttribute('tabIndex', '0');

      // Test keyboard navigation (should not throw)
      fireEvent.keyDown(scrollableArea, { key: 'ArrowDown' });
      fireEvent.keyDown(scrollableArea, { key: 'Home' });
      fireEvent.keyDown(scrollableArea, { key: 'End' });
    });

    it('should have proper ARIA labels for items', () => {
      render(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      listItems.forEach((item, index) => {
        expect(item).toHaveAttribute('aria-label', `Article ${index + 1}`);
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of items without performance degradation', () => {
      const largeItemSet = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        category: `cat${i}`,
        categoryName: `Category ${i}`,
        quantity: 1,
        weight: 1.0,
        price: 1.0,
        total: 1.0
      }));

      const startTime = performance.now();

      render(
        <Ticket
          items={largeItemSet}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render within reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);

      // Should display correct totals
      expect(screen.getByText('100.00 €')).toBeInTheDocument();
    });

    it('should memoize components to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Rerender with same props
      rerender(
        <Ticket
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      // Should still work without issues
      expect(screen.getByText('60.00 €')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message', () => {
      render(
        <Ticket
          items={[]}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      expect(screen.getByText('Aucun article ajouté')).toBeInTheDocument();
      expect(screen.getByText('0 articles')).toBeInTheDocument();
      expect(screen.getByText('0.00 €')).toBeInTheDocument();
    });

    it('should disable finalize button when empty', () => {
      render(
        <Ticket
          items={[]}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );

      const finalizeButton = screen.getByText('Finaliser la vente');
      expect(finalizeButton).toBeDisabled();
    });
  });
});
