import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { ScrollPositionManager, ScrollState } from '../../utils/scrollManager';

interface TicketHighlighterProps {
  children: React.ReactNode;
  scrollManager?: ScrollPositionManager;
  highlightDuration?: number;
  className?: string;
}

interface HighlightState {
  isVisible: boolean;
  direction: 'up' | 'down' | null;
  progress: number;
}

const HighlightOverlay = styled.div<{ $isVisible: boolean; $direction: 'up' | 'down' | null }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
  opacity: ${({ $isVisible }) => $isVisible ? 0.3 : 0};
  transition: opacity 0.3s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: ${({ $direction }) => $direction === 'down' ? '0' : 'auto'};
    bottom: ${({ $direction }) => $direction === 'up' ? '0' : 'auto'};
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(
      ${({ $direction }) => $direction === 'up' ? '0deg' : '180deg'},
      rgba(44, 85, 48, 0.2) 0%,
      rgba(44, 85, 48, 0.1) 50%,
      transparent 100%
    );
    animation: ${({ $isVisible }) => $isVisible ? 'highlightPulse 0.8s ease-out' : 'none'};
  }
`;

const highlightPulse = keyframes`
  0% {
    opacity: 0;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.1);
  }
  100% {
    opacity: 0.3;
    transform: scaleY(1);
  }
`;

const HighlightedItem = styled.div<{ $isHighlighted: boolean }>`
  transition: all 0.3s ease;

  ${({ $isHighlighted }) => $isHighlighted && `
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(44, 85, 48, 0.15);
    border-left: 3px solid #2c5530;
    background: linear-gradient(90deg, rgba(44, 85, 48, 0.05) 0%, transparent 100%);
  `}
`;

const PositionIndicator = styled.div<{ $position: number; $visible: boolean }>`
  position: absolute;
  right: 8px;
  top: ${({ $position }) => `${$position}%`};
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #2c5530;
  border-radius: 2px;
  opacity: ${({ $visible }) => $visible ? 0.6 : 0};
  transition: opacity 0.3s ease, top 0.1s ease;
  pointer-events: none;
  z-index: 10;
`;

const TicketHighlighter: React.FC<TicketHighlighterProps> = memo(({
  children,
  scrollManager,
  highlightDuration = 800,
  className
}) => {
  const [highlightState, setHighlightState] = useState<HighlightState>({
    isVisible: false,
    direction: null,
    progress: 0
  });

  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());

  const handleScrollChange = useCallback((state: ScrollState) => {
    if (!scrollManager) return;

    const direction = state.scrollTop > lastScrollTop ? 'down' :
                     state.scrollTop < lastScrollTop ? 'up' : null;

    if (direction) {
      setHighlightState({
        isVisible: true,
        direction,
        progress: state.scrollTop / (state.scrollHeight - state.clientHeight)
      });

      // Clear highlight after duration
      setTimeout(() => {
        setHighlightState(prev => ({ ...prev, isVisible: false }));
      }, highlightDuration);
    }

    setLastScrollTop(state.scrollTop);
  }, [lastScrollTop, highlightDuration, scrollManager]);

  useEffect(() => {
    if (!scrollManager) return;
    const unsubscribe = scrollManager.subscribe(handleScrollChange);
    return unsubscribe;
  }, [scrollManager, handleScrollChange]);

  // Keyboard navigation support
  useEffect(() => {
    if (!scrollManager) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Arrow keys for scrolling
      if (event.key === 'ArrowDown' && scrollManager.canScroll('down')) {
        event.preventDefault();
        scrollManager.scrollBy({ top: 50 });
      } else if (event.key === 'ArrowUp' && scrollManager.canScroll('up')) {
        event.preventDefault();
        scrollManager.scrollBy({ top: -50 });
      } else if (event.key === 'PageDown' && scrollManager.canScroll('down')) {
        event.preventDefault();
        scrollManager.scrollBy({ top: 200 });
      } else if (event.key === 'PageUp' && scrollManager.canScroll('up')) {
        event.preventDefault();
        scrollManager.scrollBy({ top: -200 });
      } else if (event.key === 'Home') {
        event.preventDefault();
        scrollManager.scrollToTop();
      } else if (event.key === 'End') {
        event.preventDefault();
        scrollManager.scrollToBottom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollManager]);

  // Focus management for accessibility
  const handleItemFocus = useCallback((itemId: string) => {
    setHighlightedItems(prev => new Set([...prev, itemId]));

    // Remove highlight after animation
    setTimeout(() => {
      setHighlightedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 500);
  }, []);

  // Clone children and add highlighting props with accessibility
  const enhancedChildren = useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        const itemId = `item-${index}`;
        const isHighlighted = highlightedItems.has(itemId);

        return React.cloneElement(child as React.ReactElement<any>, {
          'data-scroll-item': itemId,
          onFocus: () => handleItemFocus(itemId),
          tabIndex: 0,
          role: 'listitem',
          'aria-label': `Article ${index + 1}${isHighlighted ? ' - mis en évidence' : ''}`,
          'aria-current': isHighlighted ? 'true' : undefined,
          $isHighlighted: isHighlighted,
          as: HighlightedItem
        });
      }
      return child;
    });
  }, [children, highlightedItems, handleItemFocus]);

  // Screen reader announcement for scroll changes
  const scrollAnnouncement = useMemo(() => {
    if (!scrollManager) return '';

    const currentState = scrollManager.getCurrentState();
    if (!currentState?.isScrollable) {
      return '';
    }

    const progress = Math.round(highlightState.progress * 100);
    if (highlightState.direction === 'up') {
      return `Défilement vers le haut, ${progress}% du contenu visible`;
    } else if (highlightState.direction === 'down') {
      return `Défilement vers le bas, ${progress}% du contenu visible`;
    }
    return '';
  }, [highlightState.direction, highlightState.progress, scrollManager]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <HighlightOverlay
        $isVisible={highlightState.isVisible}
        $direction={highlightState.direction}
      />
      <PositionIndicator
        $position={highlightState.progress * 100}
        $visible={scrollManager?.getCurrentState()?.isScrollable || false}
        aria-label={`Position de défilement: ${Math.round(highlightState.progress * 100)}%`}
      />

      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {scrollAnnouncement}
      </div>

      {/* Focus trap for keyboard navigation */}
      <div role="application" aria-label="Navigation des articles du ticket">
        {enhancedChildren}
      </div>
    </div>
  );
});

TicketHighlighter.displayName = 'TicketHighlighter';

export default TicketHighlighter;
