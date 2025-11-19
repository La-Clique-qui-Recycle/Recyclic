import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScrollPositionManager } from '../scrollManager';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  return setTimeout(cb, 16) as any;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ScrollPositionManager', () => {
  let element: HTMLElement;
  let manager: ScrollPositionManager;

  beforeEach(() => {
    // Create a mock scrollable element
    element = document.createElement('div');
    element.style.height = '200px';
    element.style.overflowY = 'auto';

    // Add content that makes it scrollable
    const content = document.createElement('div');
    content.style.height = '400px';
    element.appendChild(content);

    document.body.appendChild(element);

    manager = new ScrollPositionManager();
  });

  afterEach(() => {
    document.body.removeChild(element);
    manager.destroy();
  });

  describe('Initialization', () => {
    it('should create manager without element', () => {
      const emptyManager = new ScrollPositionManager();
      expect(emptyManager.getCurrentState()).toEqual({
        scrollTop: 0,
        scrollLeft: 0,
        scrollHeight: 0,
        clientHeight: 0,
        clientWidth: 0,
        canScrollUp: false,
        canScrollDown: false,
        canScrollLeft: false,
        canScrollRight: false,
        isScrollable: false
      });
      emptyManager.destroy();
    });

    it('should attach to element', () => {
      manager.attach(element);
      const state = manager.getCurrentState();
      expect(state.scrollHeight).toBeGreaterThan(0);
      expect(state.isScrollable).toBe(true);
    });
  });

  describe('Scroll State Detection', () => {
    beforeEach(() => {
      manager.attach(element);
    });

    it('should detect scrollable content', () => {
      const state = manager.getCurrentState();
      expect(state.isScrollable).toBe(true);
      expect(state.canScrollDown).toBe(true);
      expect(state.canScrollUp).toBe(false);
    });

    it('should detect scroll position changes', () => {
      element.scrollTop = 100;
      element.dispatchEvent(new Event('scroll'));

      // Wait for throttled update
      return new Promise(resolve => {
        setTimeout(() => {
          const state = manager.getCurrentState();
          expect(state.scrollTop).toBe(100);
          expect(state.canScrollUp).toBe(true);
          expect(state.canScrollDown).toBe(true);
          resolve(void 0);
        }, 20);
      });
    });
  });

  describe('Scroll Methods', () => {
    beforeEach(() => {
      manager.attach(element);
    });

    it('should scroll to top', () => {
      element.scrollTop = 100;
      manager.scrollToTop();

      return new Promise(resolve => {
        setTimeout(() => {
          expect(element.scrollTop).toBe(0);
          resolve(void 0);
        }, 100);
      });
    });

    it('should scroll to bottom', () => {
      manager.scrollToBottom();

      return new Promise(resolve => {
        setTimeout(() => {
          expect(element.scrollTop).toBeGreaterThan(0);
          resolve(void 0);
        }, 100);
      });
    });

    it('should check scroll capabilities', () => {
      expect(manager.canScroll('down')).toBe(true);
      expect(manager.canScroll('up')).toBe(false);

      element.scrollTop = 100;
      element.dispatchEvent(new Event('scroll'));

      return new Promise(resolve => {
        setTimeout(() => {
          expect(manager.canScroll('up')).toBe(true);
          resolve(void 0);
        }, 20);
      });
    });
  });

  describe('Event Subscription', () => {
    beforeEach(() => {
      manager.attach(element);
    });

    it('should notify subscribers on scroll', () => {
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      element.scrollTop = 50;
      element.dispatchEvent(new Event('scroll'));

      return new Promise(resolve => {
        setTimeout(() => {
          expect(mockCallback).toHaveBeenCalled();
          const state = mockCallback.mock.calls[0][0];
          expect(state.scrollTop).toBe(50);
          unsubscribe();
          resolve(void 0);
        }, 20);
      });
    });

    it('should send initial state to new subscribers', () => {
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].isScrollable).toBe(true);

      unsubscribe();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      manager.attach(element);
    });

    it('should throttle scroll events', () => {
      const mockCallback = vi.fn();
      manager.subscribe(mockCallback);

      // Trigger multiple scroll events rapidly
      for (let i = 0; i < 10; i++) {
        element.scrollTop = i * 10;
        element.dispatchEvent(new Event('scroll'));
      }

      return new Promise(resolve => {
        setTimeout(() => {
          // Should not call callback 10 times due to throttling
          expect(mockCallback.mock.calls.length).toBeLessThan(10);
          resolve(void 0);
        }, 100);
      });
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      manager.attach(element);
      const mockCallback = vi.fn();
      manager.subscribe(mockCallback);

      manager.destroy();

      // Should not notify after destroy
      element.scrollTop = 50;
      element.dispatchEvent(new Event('scroll'));

      return new Promise(resolve => {
        setTimeout(() => {
          expect(mockCallback.mock.calls.length).toBe(1); // Only initial call
          resolve(void 0);
        }, 20);
      });
    });
  });
});
