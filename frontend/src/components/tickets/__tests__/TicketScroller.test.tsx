import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TicketScroller from '../TicketScroller';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TicketScroller', () => {
  const mockChildren = (
    <div>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
      <div>Item 4</div>
      <div>Item 5</div>
    </div>
  );

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(
        <TicketScroller>
          {mockChildren}
        </TicketScroller>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 5')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TicketScroller className="custom-class">
          {mockChildren}
        </TicketScroller>
      );

      const container = screen.getByRole('region');
      expect(container).toHaveClass('custom-class');
    });

    it('should apply custom maxHeight', () => {
      render(
        <TicketScroller maxHeight="500px">
          {mockChildren}
        </TicketScroller>
      );

      const container = screen.getByRole('region');
      expect(container).toHaveStyle({ height: '500px' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TicketScroller>
          {mockChildren}
        </TicketScroller>
      );

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Zone de défilement des articles du ticket');
      expect(region).toHaveAttribute('aria-live', 'polite');

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Liste des articles du ticket');
    });

    it('should show scroll indicators with proper labels', () => {
      // Create scrollable content
      const scrollableContent = (
        <div style={{ height: '1000px' }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ height: '50px' }}>Item {i + 1}</div>
          ))}
        </div>
      );

      render(
        <TicketScroller maxHeight="200px">
          {scrollableContent}
        </TicketScroller>
      );

      // Indicators should have proper aria-labels
      const indicators = screen.getAllByLabelText(/Contenu disponible/);
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll Behavior', () => {
    it('should handle keyboard navigation', () => {
      const scrollableContent = (
        <div style={{ height: '1000px' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{ height: '50px' }}>Item {i + 1}</div>
          ))}
        </div>
      );

      render(
        <TicketScroller maxHeight="200px">
          {scrollableContent}
        </TicketScroller>
      );

      const scrollableElement = screen.getByRole('list');

      // Test arrow down
      fireEvent.keyDown(scrollableElement, { key: 'ArrowDown' });
      // Should not throw and should prevent default

      // Test page down
      fireEvent.keyDown(scrollableElement, { key: 'PageDown' });

      // Test home/end
      fireEvent.keyDown(scrollableElement, { key: 'Home' });
      fireEvent.keyDown(scrollableElement, { key: 'End' });
    });

    it('should be keyboard focusable when scrollable', () => {
      const scrollableContent = (
        <div style={{ height: '1000px' }}>
          <div>Content</div>
        </div>
      );

      render(
        <TicketScroller maxHeight="100px">
          {scrollableContent}
        </TicketScroller>
      );

      const scrollableElement = screen.getByRole('list');
      expect(scrollableElement).toHaveAttribute('tabIndex', '0');
    });

    it('should not be keyboard focusable when not scrollable', () => {
      render(
        <TicketScroller maxHeight="500px">
          <div style={{ height: '100px' }}>Short content</div>
        </TicketScroller>
      );

      const scrollableElement = screen.getByRole('list');
      expect(scrollableElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      const { rerender } = render(
        <TicketScroller>
          {mockChildren}
        </TicketScroller>
      );

      // Rerender with same props should not cause unnecessary re-renders
      rerender(
        <TicketScroller>
          {mockChildren}
        </TicketScroller>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should have displayName for debugging', () => {
      expect(TicketScroller.displayName).toBe('TicketScroller');
    });
  });

  describe('Layout', () => {
    it('should separate scrollable and indicator areas', () => {
      const scrollableContent = (
        <div style={{ height: '600px' }}>
          <div>Long content</div>
        </div>
      );

      render(
        <TicketScroller maxHeight="300px">
          {scrollableContent}
        </TicketScroller>
      );

      const region = screen.getByRole('region');
      const scrollable = screen.getByRole('list');

      expect(region).toContainElement(scrollable);
      expect(region.children).toHaveLength(3); // top indicator, content, bottom indicator
    });
  });
});
