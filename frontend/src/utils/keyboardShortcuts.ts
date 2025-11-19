import { Category } from '../services/categoryService';

/**
 * Interface for keyboard shortcut configuration
 */
export interface ShortcutConfig {
  key: string;
  action: () => void;
  description?: string;
}

/**
 * Service for handling keyboard shortcuts in the cash register interface
 * Manages A-Z shortcuts for category selection with conflict prevention
 */
export class KeyboardShortcutHandler {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private isActive: boolean = false;
  private eventListener: ((event: KeyboardEvent) => void) | null = null;

  /**
   * Initialize the keyboard shortcut handler
   * @param categories - Array of categories with shortcut_key field
   * @param onShortcut - Callback function when a shortcut is triggered
   */
  initialize(categories: Category[], onShortcut: (categoryId: string) => void): void {
    this.shortcuts.clear();

    // Create shortcuts map from categories
    categories.forEach(category => {
      if (category.shortcut_key && category.shortcut_key.length === 1) {
        const key = category.shortcut_key.toUpperCase();
        // Only allow A-Z keys
        if (key >= 'A' && key <= 'Z') {
          this.shortcuts.set(key, {
            key,
            action: () => onShortcut(category.id),
            description: `Select category: ${category.name}`
          });
        }
      }
    });
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
  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
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

    // Only handle A-Z keys
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      const shortcut = this.shortcuts.get(key);
      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
      }
    }
  }

  /**
   * Get available shortcut keys
   */
  getAvailableKeys(): string[] {
    return Array.from(this.shortcuts.keys());
  }

  /**
   * Check if a key is registered as a shortcut
   */
  hasShortcut(key: string): boolean {
    return this.shortcuts.has(key.toUpperCase());
  }

  /**
   * Get shortcut configuration for a key
   */
  getShortcut(key: string): ShortcutConfig | undefined {
    return this.shortcuts.get(key.toUpperCase());
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
export const keyboardShortcutHandler = new KeyboardShortcutHandler();
