import React from 'react';

export interface ScrollState {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
  canScrollUp: boolean;
  canScrollDown: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isScrollable: boolean;
}

export interface ScrollOptions {
  behavior?: 'smooth' | 'instant' | 'auto';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

export class ScrollPositionManager {
  private element: HTMLElement | null = null;
  private observers: Set<(state: ScrollState) => void> = new Set();
  private resizeObserver: ResizeObserver | null = null;
  private scrollListener: (() => void) | null = null;
  private throttledUpdate: (() => void) | null = null;
  private animationFrame: number | null = null;

  constructor(element?: HTMLElement) {
    if (element) {
      this.attach(element);
    }
  }

  /**
   * Attach the manager to a scrollable element
   */
  attach(element: HTMLElement): void {
    this.detach(); // Clean up previous attachments

    this.element = element;
    this.setupEventListeners();
    this.setupResizeObserver();

    // Initial state update
    this.updateObservers();
  }

  /**
   * Detach from current element and clean up
   */
  detach(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.scrollListener && this.element) {
      this.element.removeEventListener('scroll', this.scrollListener, { passive: true });
      this.scrollListener = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.element = null;
  }

  /**
   * Subscribe to scroll state changes
   */
  subscribe(callback: (state: ScrollState) => void): () => void {
    this.observers.add(callback);

    // Send initial state if element is attached
    if (this.element) {
      callback(this.getCurrentState());
    }

    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Get current scroll state
   */
  getCurrentState(): ScrollState {
    if (!this.element) {
      return this.getEmptyState();
    }

    const { scrollTop, scrollLeft, scrollHeight, clientHeight, scrollWidth, clientWidth } = this.element;

    return {
      scrollTop,
      scrollLeft,
      scrollHeight,
      clientHeight,
      clientWidth,
      canScrollUp: scrollTop > 0,
      canScrollDown: scrollTop < scrollHeight - clientHeight - 1,
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
      isScrollable: scrollHeight > clientHeight
    };
  }

  /**
   * Scroll to a specific position
   */
  scrollTo(options: ScrollToOptions): void {
    if (!this.element) return;

    this.element.scrollTo({
      behavior: 'smooth',
      ...options
    });
  }

  /**
   * Scroll to top smoothly
   */
  scrollToTop(): void {
    this.scrollTo({ top: 0 });
  }

  /**
   * Scroll to bottom smoothly
   */
  scrollToBottom(): void {
    if (!this.element) return;

    this.scrollTo({
      top: this.element.scrollHeight - this.element.clientHeight
    });
  }

  /**
   * Scroll by a relative amount
   */
  scrollBy(options: ScrollToOptions): void {
    if (!this.element) return;

    this.element.scrollBy({
      behavior: 'smooth',
      ...options
    });
  }

  /**
   * Check if element can scroll in a direction
   */
  canScroll(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const state = this.getCurrentState();

    switch (direction) {
      case 'up':
        return state.canScrollUp;
      case 'down':
        return state.canScrollDown;
      case 'left':
        return state.canScrollLeft;
      case 'right':
        return state.canScrollRight;
      default:
        return false;
    }
  }

  /**
   * Get scroll progress (0-1)
   */
  getScrollProgress(): number {
    const state = this.getCurrentState();
    if (!state.isScrollable) return 0;

    return state.scrollTop / (state.scrollHeight - state.clientHeight);
  }

  private setupEventListeners(): void {
    if (!this.element) return;

    // Throttled scroll handler using requestAnimationFrame
    this.throttledUpdate = this.throttleWithAnimationFrame(() => {
      this.updateObservers();
    });

    this.scrollListener = () => {
      if (this.throttledUpdate) {
        this.throttledUpdate();
      }
    };

    this.element.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  private setupResizeObserver(): void {
    if (!this.element || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Small delay to allow DOM updates
      setTimeout(() => {
        this.updateObservers();
      }, 10);
    });

    this.resizeObserver.observe(this.element);
  }

  private updateObservers(): void {
    const state = this.getCurrentState();
    this.observers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in scroll observer callback:', error);
      }
    });
  }

  private throttleWithAnimationFrame(callback: () => void): () => void {
    return () => {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      this.animationFrame = requestAnimationFrame(() => {
        callback();
        this.animationFrame = null;
      });
    };
  }

  private getEmptyState(): ScrollState {
    return {
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
    };
  }

  /**
   * Clean up when the manager is no longer needed
   */
  destroy(): void {
    this.detach();
    this.observers.clear();
  }
}

/**
 * Factory function to create a ScrollPositionManager instance
 */
export function createScrollManager(element?: HTMLElement): ScrollPositionManager {
  return new ScrollPositionManager(element);
}

/**
 * Hook-like utility for React components to use scroll management
 */
export function useScrollManager(element: HTMLElement | null): ScrollPositionManager {
  const managerRef = React.useRef<ScrollPositionManager | null>(null);

  React.useEffect(() => {
    if (element && !managerRef.current) {
      managerRef.current = new ScrollPositionManager(element);
    } else if (element && managerRef.current) {
      managerRef.current.attach(element);
    } else if (!element && managerRef.current) {
      managerRef.current.detach();
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [element]);

  return managerRef.current || new ScrollPositionManager();
}
