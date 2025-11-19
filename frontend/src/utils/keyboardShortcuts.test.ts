import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardShortcutHandler, keyboardShortcutHandler } from './keyboardShortcuts';
import type { Category } from '../services/categoryService';

// Mock categories for testing
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Category A',
    shortcut_key: 'a',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Category B',
    shortcut_key: 'b',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Category C',
    shortcut_key: null, // No shortcut
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

describe('KeyboardShortcutHandler', () => {
  let handler: KeyboardShortcutHandler;
  let mockCallback: vi.MockedFunction<(categoryId: string) => void>;

  beforeEach(() => {
    handler = new KeyboardShortcutHandler();
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

  describe('initialization', () => {
    it('should initialize with categories and callback', () => {
      handler.initialize(mockCategories, mockCallback);

      expect(handler.getAvailableKeys()).toEqual(['A', 'B']);
      expect(handler.hasShortcut('A')).toBe(true);
      expect(handler.hasShortcut('B')).toBe(true);
      expect(handler.hasShortcut('C')).toBe(false);
    });

    it('should handle case insensitive shortcuts', () => {
      const categoriesWithUpper: Category[] = [{
        ...mockCategories[0],
        shortcut_key: 'A'
      }];

      handler.initialize(categoriesWithUpper, mockCallback);
      expect(handler.hasShortcut('a')).toBe(true);
      expect(handler.hasShortcut('A')).toBe(true);
    });

    it('should only accept A-Z shortcuts', () => {
      const categoriesWithInvalid: Category[] = [
        { ...mockCategories[0], shortcut_key: '1' },
        { ...mockCategories[1], shortcut_key: '!' },
        { ...mockCategories[2], shortcut_key: 'z' }
      ];

      handler.initialize(categoriesWithInvalid, mockCallback);
      expect(handler.getAvailableKeys()).toEqual(['Z']);
    });
  });

  describe('activation and deactivation', () => {
    it('should activate and deactivate properly', () => {
      handler.initialize(mockCategories, mockCallback);

      expect(handler.getIsActive()).toBe(false);

      handler.activate();
      expect(handler.getIsActive()).toBe(true);

      handler.deactivate();
      expect(handler.getIsActive()).toBe(false);
    });

    it('should handle multiple activate/deactivate calls', () => {
      handler.initialize(mockCategories, mockCallback);

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
      handler.initialize(mockCategories, mockCallback);
      handler.activate();
    });

    it('should trigger callback when shortcut key is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith('1');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase key input', () => {
      const event = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith('1');
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
      handler.initialize(mockCategories, mockCallback);
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

      expect(mockCallback).toHaveBeenCalledWith('1');
    });

    it('should allow shortcuts when no element is focused', () => {
      // Blur any focused element
      (document.activeElement as HTMLElement)?.blur();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith('1');
    });
  });

  describe('shortcut management', () => {
    it('should return correct shortcut configuration', () => {
      handler.initialize(mockCategories, mockCallback);

      const shortcutA = handler.getShortcut('A');
      expect(shortcutA).toBeDefined();
      expect(shortcutA?.key).toBe('A');
      expect(shortcutA?.description).toBe('Select category: Category A');

      const shortcutX = handler.getShortcut('X');
      expect(shortcutX).toBeUndefined();
    });

    it('should return all shortcuts', () => {
      handler.initialize(mockCategories, mockCallback);

      const shortcuts = handler.getShortcuts();
      expect(shortcuts).toHaveLength(2);
      expect(shortcuts.map(s => s.key)).toEqual(['A', 'B']);
    });

    it('should handle empty categories', () => {
      handler.initialize([], mockCallback);

      expect(handler.getAvailableKeys()).toEqual([]);
      expect(handler.getShortcuts()).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      handler.initialize(mockCategories, mockCallback);
      handler.activate();

      expect(handler.getIsActive()).toBe(true);

      handler.destroy();

      expect(handler.getIsActive()).toBe(false);
      expect(handler.getAvailableKeys()).toEqual([]);
    });
  });
});
