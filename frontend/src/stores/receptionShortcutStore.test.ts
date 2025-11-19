import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReceptionShortcutStore, cleanupReceptionShortcutStore } from './receptionShortcutStore';

// Mock the ReceptionKeyboardShortcutHandler
vi.mock('../utils/receptionKeyboardShortcuts', () => ({
  ReceptionKeyboardShortcutHandler: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    destroy: vi.fn(),
    getShortcuts: vi.fn(() => []),
    getShortcut: vi.fn(),
    getShortcutByPosition: vi.fn(),
    getKeyForPosition: vi.fn(),
    getPositionForKey: vi.fn(),
    getAvailableKeys: vi.fn(() => []),
    getAvailablePositions: vi.fn(() => []),
    hasShortcut: vi.fn(),
    hasShortcutForPosition: vi.fn(),
    getIsActive: vi.fn(() => false)
  }))
}));

describe('useReceptionShortcutStore', () => {
  let store: ReturnType<typeof useReceptionShortcutStore>;

  beforeEach(() => {
    store = useReceptionShortcutStore.getState();
    // Reset store state
    store = useReceptionShortcutStore.getState();
  });

  afterEach(() => {
    cleanupReceptionShortcutStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(store.maxPositions).toBe(26);
      expect(store.isActive).toBe(false);
      expect(store.shortcuts).toEqual([]);
    });
  });

  describe('initializeShortcuts', () => {
    it('should initialize shortcuts with correct parameters', () => {
      const mockCallback = vi.fn();

      store.initializeShortcuts(10, mockCallback);

      // Check that the state was updated
      const newState = useReceptionShortcutStore.getState();
      expect(newState.maxPositions).toBe(10);
      expect(newState.shortcuts).toEqual([]);
      expect(newState.isActive).toBe(false);
    });

    it('should handle different maxPositions values', () => {
      const mockCallback = vi.fn();

      store.initializeShortcuts(5, mockCallback);
      let newState = useReceptionShortcutStore.getState();
      expect(newState.maxPositions).toBe(5);

      store.initializeShortcuts(20, mockCallback);
      newState = useReceptionShortcutStore.getState();
      expect(newState.maxPositions).toBe(20);
    });
  });

  describe('activateShortcuts and deactivateShortcuts', () => {
    beforeEach(() => {
      const mockCallback = vi.fn();
      store.initializeShortcuts(5, mockCallback);
    });

    it('should activate shortcuts', () => {
      expect(store.isActive).toBe(false);

      store.activateShortcuts();

      const newState = useReceptionShortcutStore.getState();
      expect(newState.isActive).toBe(true);
    });

    it('should deactivate shortcuts', () => {
      store.activateShortcuts();
      expect(useReceptionShortcutStore.getState().isActive).toBe(true);

      store.deactivateShortcuts();

      const newState = useReceptionShortcutStore.getState();
      expect(newState.isActive).toBe(false);
    });

    it('should handle multiple activate/deactivate calls', () => {
      store.activateShortcuts();
      store.activateShortcuts(); // Should not cause issues
      expect(useReceptionShortcutStore.getState().isActive).toBe(true);

      store.deactivateShortcuts();
      store.deactivateShortcuts(); // Should not cause issues
      expect(useReceptionShortcutStore.getState().isActive).toBe(false);
    });
  });

  describe('shortcut getters', () => {
    beforeEach(() => {
      const mockCallback = vi.fn();
      store.initializeShortcuts(5, mockCallback);
    });

    it('should delegate getShortcutForPosition to handler', () => {
      const result = store.getShortcutForPosition(1);
      expect(result).toBeUndefined(); // Mock returns undefined
    });

    it('should delegate getShortcutForKey to handler', () => {
      const result = store.getShortcutForKey('A');
      expect(result).toBeUndefined(); // Mock returns undefined
    });

    it('should delegate getKeyForPosition to handler', () => {
      const result = store.getKeyForPosition(1);
      expect(result).toBeUndefined(); // Mock returns undefined
    });

    it('should delegate getPositionForKey to handler', () => {
      const result = store.getPositionForKey('A');
      expect(result).toBeUndefined(); // Mock returns undefined
    });

    it('should delegate getAvailableKeys to handler', () => {
      const result = store.getAvailableKeys();
      expect(result).toEqual([]);
    });

    it('should delegate getAvailablePositions to handler', () => {
      const result = store.getAvailablePositions();
      expect(result).toEqual([]);
    });

    it('should delegate hasShortcutForPosition to handler', () => {
      const result = store.hasShortcutForPosition(1);
      expect(result).toBe(false);
    });

    it('should delegate hasShortcutForKey to handler', () => {
      const result = store.hasShortcutForKey('A');
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up handler on cleanupReceptionShortcutStore', () => {
      const mockCallback = vi.fn();
      store.initializeShortcuts(5, mockCallback);
      store.activateShortcuts();

      expect(useReceptionShortcutStore.getState().isActive).toBe(true);

      cleanupReceptionShortcutStore();

      // After cleanup, trying to activate should work with a new handler
      store.initializeShortcuts(3, mockCallback);
      store.activateShortcuts();

      const newState = useReceptionShortcutStore.getState();
      expect(newState.maxPositions).toBe(3);
      expect(newState.isActive).toBe(true);
    });
  });

  describe('integration with handler', () => {
    it('should properly manage handler lifecycle', () => {
      const mockCallback = vi.fn();
      const { ReceptionKeyboardShortcutHandler } = vi.mocked(await import('../utils/receptionKeyboardShortcuts'));

      const mockHandler = {
        initialize: vi.fn(),
        activate: vi.fn(),
        deactivate: vi.fn(),
        destroy: vi.fn(),
        getShortcuts: vi.fn(() => [
          { position: 1, key: 'A', action: vi.fn(), description: 'Test' }
        ]),
        getShortcut: vi.fn(),
        getShortcutByPosition: vi.fn(),
        getKeyForPosition: vi.fn(),
        getPositionForKey: vi.fn(),
        getAvailableKeys: vi.fn(() => ['A']),
        getAvailablePositions: vi.fn(() => [1]),
        hasShortcut: vi.fn(),
        hasShortcutForPosition: vi.fn(),
        getIsActive: vi.fn(() => false)
      };

      ReceptionKeyboardShortcutHandler.mockImplementation(() => mockHandler);

      // Re-initialize store to use the new mock
      store = useReceptionShortcutStore.getState();

      store.initializeShortcuts(1, mockCallback);

      expect(mockHandler.initialize).toHaveBeenCalledWith(1, mockCallback);

      store.activateShortcuts();
      expect(mockHandler.activate).toHaveBeenCalled();

      store.deactivateShortcuts();
      expect(mockHandler.deactivate).toHaveBeenCalled();

      cleanupReceptionShortcutStore();
      expect(mockHandler.destroy).toHaveBeenCalled();
    });
  });
});
