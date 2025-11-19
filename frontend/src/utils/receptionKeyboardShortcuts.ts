/**
 * Service for handling keyboard shortcuts in reception ticket interface
 * Uses fixed positional mapping instead of database-driven shortcuts
 */

// Position to key mapping for reception interface
// Ligne 1: A Z E R T Y U I O P (positions 1-10)
// Ligne 2: Q S D F G H J K L M (positions 11-20)
// Ligne 3: W X C V B N (positions 21-26)
const POSITION_TO_KEY_MAP: { [position: number]: string } = {
  // Ligne 1
  1: 'A', 2: 'Z', 3: 'E', 4: 'R', 5: 'T', 6: 'Y', 7: 'U', 8: 'I', 9: 'O', 10: 'P',
  // Ligne 2
  11: 'Q', 12: 'S', 13: 'D', 14: 'F', 15: 'G', 16: 'H', 17: 'J', 18: 'K', 19: 'L', 20: 'M',
  // Ligne 3
  21: 'W', 22: 'X', 23: 'C', 24: 'V', 25: 'B', 26: 'N'
};

// Reverse mapping: key to position
const KEY_TO_POSITION_MAP: { [key: string]: number } = {};
Object.entries(POSITION_TO_KEY_MAP).forEach(([position, key]) => {
  KEY_TO_POSITION_MAP[key.toUpperCase()] = parseInt(position, 10);
});

/**
 * Interface for reception shortcut configuration
 */
export interface ReceptionShortcutConfig {
  position: number;
  key: string;
  action: () => void;
  description?: string;
}

/**
 * Service for handling keyboard shortcuts in reception ticket interface
 * Uses fixed positional mapping for category button selection
 */
export class ReceptionKeyboardShortcutHandler {
  private shortcuts: Map<string, ReceptionShortcutConfig> = new Map();
  private isActive: boolean = false;
  private eventListener: ((event: KeyboardEvent) => void) | null = null;
  private maxPositions: number;

  /**
   * Initialize the reception keyboard shortcut handler
   * @param maxPositions - Maximum number of positions/buttons to handle (default: 26)
   * @param onShortcut - Callback function when a shortcut is triggered with position
   */
  initialize(maxPositions: number = 26, onShortcut: (position: number) => void): void {
    this.shortcuts.clear();
    this.maxPositions = Math.min(maxPositions, 26); // Max 26 positions (3 rows)

    // Create shortcuts map from position mapping
    for (let position = 1; position <= this.maxPositions; position++) {
      const key = POSITION_TO_KEY_MAP[position];
      if (key) {
        this.shortcuts.set(key, {
          position,
          key,
          action: () => onShortcut(position),
          description: `Select position ${position} (${key})`
        });
      }
    }
  }

  /**
   * Activate keyboard shortcuts
   */
  activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.eventListener = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.eventListener);
  }

  /**
   * Deactivate keyboard shortcuts
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.eventListener) {
      document.removeEventListener('keydown', this.eventListener);
      this.eventListener = null;
    }
  }

  /**
   * Check if keyboard shortcuts are currently active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): ReceptionShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcut configuration for a key
   */
  getShortcut(key: string): ReceptionShortcutConfig | undefined {
    return this.shortcuts.get(key.toUpperCase());
  }

  /**
   * Get shortcut configuration for a position
   */
  getShortcutByPosition(position: number): ReceptionShortcutConfig | undefined {
    const key = POSITION_TO_KEY_MAP[position];
    return key ? this.shortcuts.get(key) : undefined;
  }

  /**
   * Get the key for a specific position
   */
  getKeyForPosition(position: number): string | undefined {
    return POSITION_TO_KEY_MAP[position];
  }

  /**
   * Get the position for a specific key
   */
  getPositionForKey(key: string): number | undefined {
    return KEY_TO_POSITION_MAP[key.toUpperCase()];
  }

  /**
   * Check if a key is registered as a shortcut
   */
  hasShortcut(key: string): boolean {
    return this.shortcuts.has(key.toUpperCase());
  }

  /**
   * Check if a position has a shortcut
   */
  hasShortcutForPosition(position: number): boolean {
    const key = POSITION_TO_KEY_MAP[position];
    return key ? this.shortcuts.has(key) : false;
  }

  /**
   * Get all available keys
   */
  getAvailableKeys(): string[] {
    return Array.from(this.shortcuts.keys());
  }

  /**
   * Get all available positions
   */
  getAvailablePositions(): number[] {
    return Object.keys(POSITION_TO_KEY_MAP)
      .map(pos => parseInt(pos, 10))
      .filter(pos => pos <= this.maxPositions)
      .sort((a, b) => a - b);
  }

  /**
   * Check if an element should prevent shortcut activation
   * @param target - The DOM element that received the key event
   */
  private shouldPreventShortcut(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }

    const element = target as HTMLElement;

    // Prevent shortcuts when focused on input elements
    if (element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT' ||
        element.contentEditable === 'true') {
      return true;
    }

    // Prevent shortcuts when focused on elements with role="textbox"
    if (element.getAttribute('role') === 'textbox') {
      return true;
    }

    // Prevent shortcuts when focused on elements with specific data attributes
    if (element.hasAttribute('data-prevent-shortcuts')) {
      return true;
    }

    return false;
  }

  /**
   * Handle keydown events
   * @param event - Keyboard event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Only handle single character keys without modifiers
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }

    // Check if shortcuts should be prevented
    if (this.shouldPreventShortcut(event.target)) {
      return;
    }

    const key = event.key.toUpperCase();

    // Only handle keys that are in our mapping
    if (this.shortcuts.has(key)) {
      event.preventDefault();
      event.stopPropagation();
      const shortcut = this.shortcuts.get(key);
      if (shortcut) {
        shortcut.action();
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.deactivate();
    this.shortcuts.clear();
  }
}

// Singleton instance
export const receptionKeyboardShortcutHandler = new ReceptionKeyboardShortcutHandler();

// Utility functions for position calculations
export const getRowFromPosition = (position: number): number => {
  if (position <= 10) return 1;
  if (position <= 20) return 2;
  return 3;
};

export const getPositionsInRow = (row: number): number[] => {
  switch (row) {
    case 1: return Array.from({ length: 10 }, (_, i) => i + 1);
    case 2: return Array.from({ length: 10 }, (_, i) => i + 11);
    case 3: return Array.from({ length: 6 }, (_, i) => i + 21);
    default: return [];
  }
};

export const getMaxPositionsInRow = (row: number): number => {
  switch (row) {
    case 1: return 10;
    case 2: return 10;
    case 3: return 6;
    default: return 0;
  }
};
