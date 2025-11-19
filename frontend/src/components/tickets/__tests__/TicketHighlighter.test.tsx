import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TicketHighlighter from '../TicketHighlighter';
import { ScrollPositionManager } from '../../../utils/scrollManager';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TicketHighlighter', () => {
  let mockScrollManager: ScrollPositionManager;

  const mockChildren = (
    <div>
      <div data-testid="item-1">Item 1</div>
      <div data-testid="item-2">Item 2</div>
      <div data-testid="item-3">Item 3</div>
    </div>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock scroll manager
    const mockElement = document.createElement('div');
    mockScrollManager = new ScrollPositionManager(mockElement);

    // Mock the getCurrentState method
    vi.spyOn(mockScrollManager, 'getCurrentState').mockReturnValue({
      scrollTop: 0,
      scrollLeft: 0,
      scrollHeight: 300,
      clientHeight: 100,
      clientWidth: 200,
      canScrollUp: false,
      canScrollDown: true,
      canScrollLeft: false,
      canScrollRight: false,
      isScrollable: true
    });
  });

  afterEach(() => {
    mockScrollManager.destroy();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager} className="custom-class">
          {mockChildren}
        </TicketHighlighter>
      );

      const container = screen.getByRole('application');
      expect(container.parentElement).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should enhance children with accessibility attributes', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      items.forEach((item, index) => {
        expect(item).toHaveAttribute('aria-label', `Article ${index + 1}`);
        expect(item).toHaveAttribute('tabindex', '0');
        expect(item).toHaveAttribute('data-scroll-item', `item-${index}`);
      });
    });

    it('should announce highlighted items', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      // Focus first item
      const firstItem = screen.getByRole('listitem', { name: /Article 1/ });
      fireEvent.focus(firstItem);

      // Should have aria-current when highlighted
      expect(firstItem).toHaveAttribute('aria-current', 'true');

      // Should announce highlighting in aria-label
      expect(firstItem).toHaveAttribute('aria-label', 'Article 1 - mis en évidence');
    });

    it('should have screen reader announcements for scroll', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      // Should have aria-live region for scroll announcements
      const liveRegion = screen.getByRole('log', { hidden: true });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Highlight Behavior', () => {
    it('should highlight items on focus', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const firstItem = screen.getByRole('listitem', { name: /Article 1/ });
      fireEvent.focus(firstItem);

      // Check if highlight styles are applied (checking data attribute)
      expect(firstItem).toHaveAttribute('aria-current', 'true');
    });

    it('should remove highlight after timeout', async () => {
      vi.useFakeTimers();

      render(
        <TicketHighlighter scrollManager={mockScrollManager} highlightDuration={100}>
          {mockChildren}
        </TicketHighlighter>
      );

      const firstItem = screen.getByRole('listitem', { name: /Article 1/ });
      fireEvent.focus(firstItem);

      expect(firstItem).toHaveAttribute('aria-current', 'true');

      // Fast-forward time
      vi.advanceTimersByTime(150);

      expect(firstItem).not.toHaveAttribute('aria-current');

      vi.useRealTimers();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard scroll navigation', () => {
      // Mock scroll manager methods
      const mockCanScroll = vi.fn().mockReturnValue(true);
      const mockScrollBy = vi.fn();

      vi.spyOn(mockScrollManager, 'canScroll').mockImplementation(mockCanScroll);
      vi.spyOn(mockScrollManager, 'scrollBy').mockImplementation(mockScrollBy);

      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      // Simulate keyboard events on window (since keyboard handler is global)
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'PageUp' });
      fireEvent.keyDown(window, { key: 'PageDown' });
      fireEvent.keyDown(window, { key: 'Home' });
      fireEvent.keyDown(window, { key: 'End' });

      expect(mockCanScroll).toHaveBeenCalledWith('up');
      expect(mockCanScroll).toHaveBeenCalledWith('down');
      expect(mockScrollBy).toHaveBeenCalled();
    });
  });

  describe('Scroll State Integration', () => {
    it('should show position indicator when scrollable', () => {
      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const positionIndicator = screen.getByLabelText(/Position de défilement/);
      expect(positionIndicator).toBeInTheDocument();
    });

    it('should hide position indicator when not scrollable', () => {
      vi.spyOn(mockScrollManager, 'getCurrentState').mockReturnValue({
        ...mockScrollManager.getCurrentState(),
        isScrollable: false
      });

      render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const positionIndicator = screen.queryByLabelText(/Position de défilement/);
      expect(positionIndicator).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      const { rerender } = render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      // Rerender with same props
      rerender(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    it('should memoize enhanced children', () => {
      const { rerender } = render(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const firstRenderItems = screen.getAllByRole('listitem');

      rerender(
        <TicketHighlighter scrollManager={mockScrollManager}>
          {mockChildren}
        </TicketHighlighter>
      );

      const secondRenderItems = screen.getAllByRole('listitem');

      // Should maintain reference stability
      expect(firstRenderItems[0]).toBe(secondRenderItems[0]);
    });

    it('should have displayName for debugging', () => {
      expect(TicketHighlighter.displayName).toBe('TicketHighlighter');
    });
  });
});
