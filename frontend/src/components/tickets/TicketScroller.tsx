import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import styled from 'styled-components';
import { ScrollPositionManager } from '../../utils/scrollManager';

interface TicketScrollerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  onScrollManagerReady?: (manager: ScrollPositionManager) => void;
}

interface ScrollerState {
  canScrollUp: boolean;
  canScrollDown: boolean;
  isScrollable: boolean;
}

const ScrollerContainer = styled.div<{ $maxHeight: string }>`
  position: relative;
  height: ${({ $maxHeight }) => $maxHeight};
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const ScrollableContent = styled.div<{ $showScrollbar: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  scroll-behavior: smooth;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ $showScrollbar }) => $showScrollbar ? '#2c5530' : 'transparent'};
    border-radius: 4px;
    transition: background 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ $showScrollbar }) => $showScrollbar ? '#234426' : 'transparent'};
  }

  /* Firefox scrollbar */
  scrollbar-width: ${({ $showScrollbar }) => $showScrollbar ? 'thin' : 'none'};
  scrollbar-color: ${({ $showScrollbar }) => $showScrollbar ? '#2c5530 #f1f1f1' : 'transparent transparent'};
`;

const ScrollIndicator = styled.div<{ $position: 'top' | 'bottom'; $visible: boolean }>`
  position: absolute;
  ${({ $position }) => $position}: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 20px;
  background: linear-gradient(
    ${({ $position }) => $position === 'top' ? '180deg' : '0deg'},
    rgba(44, 85, 48, 0.1) 0%,
    rgba(44, 85, 48, 0.05) 100%
  );
  display: ${({ $visible }) => $visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  border-radius: ${({ $position }) => $position === 'top' ? '0 0 8px 8px' : '8px 8px 0 0'};
  z-index: 10;
  pointer-events: none;

  &::before {
    content: '';
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-${({ $position }) => $position === 'top' ? 'bottom' : 'top'}: 4px solid #2c5530;
    opacity: 0.6;
  }
`;

const TicketScroller: React.FC<TicketScrollerProps> = memo(({
  children,
  className,
  maxHeight = '400px',
  onScrollManagerReady
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollManagerRef = useRef<ScrollPositionManager | null>(null);
  const [scrollState, setScrollState] = useState<ScrollerState>({
    canScrollUp: false,
    canScrollDown: false,
    isScrollable: false
  });

  // Initialize scroll manager
  useEffect(() => {
    if (contentRef.current && !scrollManagerRef.current) {
      scrollManagerRef.current = new ScrollPositionManager(contentRef.current);
      onScrollManagerReady?.(scrollManagerRef.current);
    }

    return () => {
      if (scrollManagerRef.current) {
        scrollManagerRef.current.destroy();
        scrollManagerRef.current = null;
      }
    };
  }, [onScrollManagerReady]);

  const checkScrollState = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const isScrollable = scrollHeight > clientHeight;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1; // -1 for rounding errors

    setScrollState({
      canScrollUp,
      canScrollDown,
      isScrollable
    });
  }, []);

  const handleScroll = useCallback(() => {
    checkScrollState();
  }, [checkScrollState]);

  const handleResize = useCallback(() => {
    checkScrollState();
  }, [checkScrollState]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    // Initial check
    checkScrollState();

    // Add event listeners
    element.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Use ResizeObserver if available for more precise content changes
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        checkScrollState();
      });
      resizeObserver.observe(element);
    }

    // Cleanup
    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [handleScroll, handleResize, checkScrollState]);

  // Re-check when children change
  useEffect(() => {
    // Small delay to allow DOM updates
    const timeoutId = setTimeout(checkScrollState, 10);
    return () => clearTimeout(timeoutId);
  }, [children, checkScrollState]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!contentRef.current) return;

    const { scrollTop, clientHeight, scrollHeight } = contentRef.current;

    switch (event.key) {
      case 'ArrowUp':
        if (scrollState.canScrollUp) {
          event.preventDefault();
          contentRef.current.scrollBy({ top: -50, behavior: 'smooth' });
        }
        break;
      case 'ArrowDown':
        if (scrollState.canScrollDown) {
          event.preventDefault();
          contentRef.current.scrollBy({ top: 50, behavior: 'smooth' });
        }
        break;
      case 'PageUp':
        if (scrollState.canScrollUp) {
          event.preventDefault();
          contentRef.current.scrollBy({ top: -clientHeight, behavior: 'smooth' });
        }
        break;
      case 'PageDown':
        if (scrollState.canScrollDown) {
          event.preventDefault();
          contentRef.current.scrollBy({ top: clientHeight, behavior: 'smooth' });
        }
        break;
      case 'Home':
        event.preventDefault();
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'End':
        event.preventDefault();
        contentRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        break;
    }
  }, [scrollState.canScrollUp, scrollState.canScrollDown]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ScrollerContainer
      className={className}
      $maxHeight={maxHeight}
      role="region"
      aria-label="Zone de défilement des articles du ticket"
      aria-live="polite"
    >
      <ScrollIndicator
        $position="top"
        $visible={scrollState.canScrollUp}
        aria-label="Contenu disponible vers le haut"
      />
      <ScrollableContent
        ref={contentRef}
        $showScrollbar={scrollState.isScrollable}
        tabIndex={scrollState.isScrollable ? 0 : -1}
        role="list"
        aria-label="Liste des articles du ticket"
      >
        {children}
      </ScrollableContent>
      <ScrollIndicator
        $position="bottom"
        $visible={scrollState.canScrollDown}
        aria-label="Contenu disponible vers le bas"
      />
    </ScrollerContainer>
  );
});

TicketScroller.displayName = 'TicketScroller';

export default TicketScroller;
