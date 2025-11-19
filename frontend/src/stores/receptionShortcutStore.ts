import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ReceptionKeyboardShortcutHandler, ReceptionShortcutConfig } from '../utils/receptionKeyboardShortcuts';

interface ReceptionShortcutState {
  // State
  maxPositions: number;
  isActive: boolean;
  shortcuts: ReceptionShortcutConfig[];

  // Actions
  initializeShortcuts: (maxPositions: number, onShortcut: (position: number) => void) => void;
  activateShortcuts: () => void;
  deactivateShortcuts: () => void;
  getShortcutForPosition: (position: number) => ReceptionShortcutConfig | undefined;
  getShortcutForKey: (key: string) => ReceptionShortcutConfig | undefined;
  getKeyForPosition: (position: number) => string | undefined;
  getPositionForKey: (key: string) => number | undefined;
  getAvailableKeys: () => string[];
  getAvailablePositions: () => number[];
  hasShortcutForPosition: (position: number) => boolean;
  hasShortcutForKey: (key: string) => boolean;
}

// Handler instance (managed internally by the store)
let shortcutHandler: ReceptionKeyboardShortcutHandler | null = null;

// Stable action references to avoid re-renders
const actions = {
  initializeShortcuts: (maxPositions: number, onShortcut: (position: number) => void) => {
    // Clean up existing handler
    if (shortcutHandler) {
      shortcutHandler.deactivate();
      shortcutHandler.destroy();
    }

    // Create new handler
    shortcutHandler = new ReceptionKeyboardShortcutHandler();
    shortcutHandler.initialize(maxPositions, onShortcut);

    // Update store state
    useReceptionShortcutStore.setState({
      maxPositions,
      shortcuts: shortcutHandler.getShortcuts(),
      isActive: false
    });
  },

  activateShortcuts: () => {
    if (shortcutHandler) {
      shortcutHandler.activate();
      useReceptionShortcutStore.setState({ isActive: true });
    }
  },

  deactivateShortcuts: () => {
    if (shortcutHandler) {
      shortcutHandler.deactivate();
      useReceptionShortcutStore.setState({ isActive: false });
    }
  }
};

export const useReceptionShortcutStore = create<ReceptionShortcutState>()(
  devtools(
    (set, get) => ({
      // Initial state
      maxPositions: 26,
      isActive: false,
      shortcuts: [],

      // Use stable action references
      initializeShortcuts: actions.initializeShortcuts,
      activateShortcuts: actions.activateShortcuts,
      deactivateShortcuts: actions.deactivateShortcuts,

      // Get shortcut for position
      getShortcutForPosition: (position: number) => {
        return shortcutHandler?.getShortcutByPosition(position);
      },

      // Get shortcut for key
      getShortcutForKey: (key: string) => {
        return shortcutHandler?.getShortcut(key);
      },

      // Get key for position
      getKeyForPosition: (position: number) => {
        return shortcutHandler?.getKeyForPosition(position);
      },

      // Get position for key
      getPositionForKey: (key: string) => {
        return shortcutHandler?.getPositionForKey(key);
      },

      // Get available keys
      getAvailableKeys: () => {
        return shortcutHandler?.getAvailableKeys() || [];
      },

      // Get available positions
      getAvailablePositions: () => {
        return shortcutHandler?.getAvailablePositions() || [];
      },

      // Check if position has shortcut
      hasShortcutForPosition: (position: number) => {
        return shortcutHandler?.hasShortcutForPosition(position) || false;
      },

      // Check if key has shortcut
      hasShortcutForKey: (key: string) => {
        return shortcutHandler?.hasShortcut(key) || false;
      },
    }),
    { name: 'receptionShortcutStore' }
  )
);

// Cleanup function for when the store is no longer needed
export const cleanupReceptionShortcutStore = () => {
  if (shortcutHandler) {
    shortcutHandler.deactivate();
    shortcutHandler.destroy();
    shortcutHandler = null;
  }
};

export default useReceptionShortcutStore;
