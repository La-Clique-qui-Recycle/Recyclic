import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ReceptionKeyboardShortcutHandler,
  receptionKeyboardShortcutHandler,
  getRowFromPosition,
  getPositionsInRow,
  getMaxPositionsInRow
} from './receptionKeyboardShortcuts';

// Mock categories for testing
const mockOnShortcut = vi.fn();

describe('ReceptionKeyboardShortcutHandler', () => {
  let handler: ReceptionKeyboardShortcutHandler;
  let mockCallback: vi.MockedFunction<(position: number) => void>;

  beforeEach(() => {
    handler = new ReceptionKeyboardShortcutHandler();
    mockCallback = vi.fn();

    // Setup DOM element for testing focus prevention
    document.body.innerHTML = `
      <input type="text" id="test-input" />
      <textarea id="test-textarea"></textarea>
      <div contenteditable="true" id="test-contenteditable"></div>
      <div role="textbox" id="test-textbox"></div>
      <div data-prevent-shortcuts id="test-prevent"></div>
      <button id="test-button">Test Button</button>
    `;
  });

  afterEach(() => {
    handler.deactivate();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('positional mapping', () => {
    it('should map positions correctly to keys', () => {
      handler.initialize(10, mockCallback);

      // Test first row mappings
      expect(handler.getKeyForPosition(1)).toBe('A');
      expect(handler.getKeyForPosition(2)).toBe('Z');
      expect(handler.getKeyForPosition(3)).toBe('E');
      expect(handler.getKeyForPosition(10)).toBe('P');

      // Test second row mappings
      expect(handler.getKeyForPosition(11)).toBe('Q');
      expect(handler.getKeyForPosition(12)).toBe('S');
      expect(handler.getKeyForPosition(20)).toBe('M');

      // Test third row mappings
      expect(handler.getKeyForPosition(21)).toBe('W');
      expect(handler.getKeyForPosition(22)).toBe('X');
      expect(handler.getKeyForPosition(26)).toBe('N');
    });

    it('should map keys correctly to positions', () => {
      handler.initialize(26, mockCallback);

      // Test first row reverse mappings
      expect(handler.getPositionForKey('A')).toBe(1);
      expect(handler.getPositionForKey('Z')).toBe(2);
      expect(handler.getPositionForKey('P')).toBe(10);

      // Test second row reverse mappings
      expect(handler.getPositionForKey('Q')).toBe(11);
      expect(handler.getPositionForKey('S')).toBe(12);
      expect(handler.getPositionForKey('M')).toBe(20);

      // Test third row reverse mappings
      expect(handler.getPositionForKey('W')).toBe(21);
      expect(handler.getPositionForKey('N')).toBe(26);
    });

    it('should handle case insensitive key lookup', () => {
      handler.initialize(26, mockCallback);

      expect(handler.getPositionForKey('a')).toBe(1);
      expect(handler.getPositionForKey('A')).toBe(1);
      expect(handler.getPositionForKey('z')).toBe(2);
      expect(handler.getPositionForKey('Z')).toBe(2);
    });

    it('should limit shortcuts to maxPositions', () => {
      handler.initialize(5, mockCallback);

      expect(handler.getAvailablePositions()).toEqual([1, 2, 3, 4, 5]);
      expect(handler.getKeyForPosition(6)).toBeUndefined();
      expect(handler.hasShortcutForPosition(6)).toBe(false);
    });

    it('should handle maximum 26 positions', () => {
      handler.initialize(30, mockCallback); // More than 26

      expect(handler.getAvailablePositions()).toHaveLength(26);
      expect(handler.getKeyForPosition(27)).toBeUndefined();
    });
  });

  describe('initialization', () => {
    it('should initialize with correct number of shortcuts', () => {
      handler.initialize(10, mockCallback);

      expect(handler.getAvailableKeys()).toHaveLength(10);
      expect(handler.getAvailablePositions()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should initialize with callback', () => {
      handler.initialize(5, mockCallback);

      const shortcuts = handler.getShortcuts();
      expect(shortcuts).toHaveLength(5);
      shortcuts.forEach(shortcut => {
        expect(shortcut.action).toBeDefined();
      });
    });
  });

  describe('activation and deactivation', () => {
    it('should activate and deactivate properly', () => {
      handler.initialize(5, mockCallback);

      expect(handler.getIsActive()).toBe(false);

      handler.activate();
      expect(handler.getIsActive()).toBe(true);

      handler.deactivate();
      expect(handler.getIsActive()).toBe(false);
    });

    it('should handle multiple activate/deactivate calls', () => {
      handler.initialize(5, mockCallback);

      handler.activate();
      handler.activate(); // Should not cause issues
      expect(handler.getIsActive()).toBe(true);

      handler.deactivate();
      handler.deactivate(); // Should not cause issues
      expect(handler.getIsActive()).toBe(false);
    });
  });

  describe('keyboard event handling', () => {
    beforeEach(() => {
      handler.initialize(10, mockCallback);
      handler.activate();
    });

    it('should trigger callback when shortcut key is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase key input', () => {
      const event = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(1);
    });

    it('should trigger different positions for different keys', () => {
      const eventA = new KeyboardEvent('keydown', { key: 'a' });
      const eventZ = new KeyboardEvent('keydown', { key: 'z' });
      const eventE = new KeyboardEvent('keydown', { key: 'e' });

      document.dispatchEvent(eventA);
      document.dispatchEvent(eventZ);
      document.dispatchEvent(eventE);

      expect(mockCallback).toHaveBeenCalledWith(1);
      expect(mockCallback).toHaveBeenCalledWith(2);
      expect(mockCallback).toHaveBeenCalledWith(3);
    });

    it('should not trigger for non-shortcut keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'x' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not trigger with modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation for valid shortcuts', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('conflict prevention', () => {
    beforeEach(() => {
      handler.initialize(10, mockCallback);
      handler.activate();
    });

    it('should prevent shortcuts when input is focused', () => {
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent shortcuts when textarea is focused', () => {
      const textarea = document.getElementById('test-textarea') as HTMLTextAreaElement;
      textarea.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent shortcuts when contenteditable is focused', () => {
      const contenteditable = document.getElementById('test-contenteditable') as HTMLElement;
      contenteditable.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent shortcuts when role="textbox" is focused', () => {
      const textbox = document.getElementById('test-textbox') as HTMLElement;
      textbox.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent shortcuts when data-prevent-shortcuts attribute is present', () => {
      const preventElement = document.getElementById('test-prevent') as HTMLElement;
      preventElement.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should allow shortcuts when button is focused', () => {
      const button = document.getElementById('test-button') as HTMLButtonElement;
      button.focus();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(1);
    });

    it('should allow shortcuts when no element is focused', () => {
      // Blur any focused element
      (document.activeElement as HTMLElement)?.blur();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(1);
    });
  });

  describe('shortcut management', () => {
    it('should return correct shortcut configuration', () => {
      handler.initialize(5, mockCallback);

      const shortcutA = handler.getShortcut('A');
      expect(shortcutA).toBeDefined();
      expect(shortcutA?.position).toBe(1);
      expect(shortcutA?.key).toBe('A');

      const shortcutX = handler.getShortcut('X');
      expect(shortcutX).toBeUndefined();
    });

    it('should return shortcut by position', () => {
      handler.initialize(5, mockCallback);

      const shortcut = handler.getShortcutByPosition(1);
      expect(shortcut).toBeDefined();
      expect(shortcut?.key).toBe('A');
      expect(shortcut?.position).toBe(1);
    });

    it('should return all shortcuts', () => {
      handler.initialize(3, mockCallback);

      const shortcuts = handler.getShortcuts();
      expect(shortcuts).toHaveLength(3);
      expect(shortcuts.map(s => s.key)).toEqual(['A', 'Z', 'E']);
      expect(shortcuts.map(s => s.position)).toEqual([1, 2, 3]);
    });

    it('should handle empty initialization', () => {
      handler.initialize(0, mockCallback);

      expect(handler.getAvailableKeys()).toEqual([]);
      expect(handler.getAvailablePositions()).toEqual([]);
      expect(handler.getShortcuts()).toEqual([]);
    });
  });

  describe('utility functions', () => {
    describe('getRowFromPosition', () => {
      it('should return correct row for positions', () => {
        expect(getRowFromPosition(1)).toBe(1);
        expect(getRowFromPosition(10)).toBe(1);
        expect(getRowFromPosition(11)).toBe(2);
        expect(getRowFromPosition(20)).toBe(2);
        expect(getRowFromPosition(21)).toBe(3);
        expect(getRowFromPosition(26)).toBe(3);
      });
    });

    describe('getPositionsInRow', () => {
      it('should return positions for row 1', () => {
        const positions = getPositionsInRow(1);
        expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });

      it('should return positions for row 2', () => {
        const positions = getPositionsInRow(2);
        expect(positions).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      });

      it('should return positions for row 3', () => {
        const positions = getPositionsInRow(3);
        expect(positions).toEqual([21, 22, 23, 24, 25, 26]);
      });

      it('should return empty array for invalid row', () => {
        expect(getPositionsInRow(0)).toEqual([]);
        expect(getPositionsInRow(4)).toEqual([]);
      });
    });

    describe('getMaxPositionsInRow', () => {
      it('should return max positions for each row', () => {
        expect(getMaxPositionsInRow(1)).toBe(10);
        expect(getMaxPositionsInRow(2)).toBe(10);
        expect(getMaxPositionsInRow(3)).toBe(6);
        expect(getMaxPositionsInRow(0)).toBe(0);
        expect(getMaxPositionsInRow(4)).toBe(0);
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      handler.initialize(5, mockCallback);
      handler.activate();

      expect(handler.getIsActive()).toBe(true);

      handler.destroy();

      expect(handler.getIsActive()).toBe(false);
      expect(handler.getAvailableKeys()).toEqual([]);
    });
  });
});
