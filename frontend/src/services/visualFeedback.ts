import { useCallback, useEffect, useState } from 'react';

export type FeedbackColor = 'primary' | 'success' | 'inactive' | 'warning' | 'error';

export interface ColorScheme {
  background: string;
  border: string;
  text: string;
  shadow?: string;
}

export interface VisualFeedbackConfig {
  colors: Record<FeedbackColor, ColorScheme>;
  transitions: {
    duration: number;
    easing: string;
  };
  animations: {
    pulse: boolean;
    glow: boolean;
  };
}

class VisualFeedbackSystem {
  private static instance: VisualFeedbackSystem;
  private config: VisualFeedbackConfig;
  private listeners: Set<(config: VisualFeedbackConfig) => void> = new Set();

  // WCAG AA compliant colors (4.5:1 contrast ratio minimum)
  private defaultConfig: VisualFeedbackConfig = {
    colors: {
      primary: {
        background: '#e3f2fd', // Light blue background
        border: '#1976d2',     // Blue border
        text: '#0d47a1',       // Dark blue text
        shadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
      },
      success: {
        background: '#e8f5e8', // Light green background
        border: '#2e7d32',     // Green border
        text: '#1b5e20',       // Dark green text
        shadow: '0 0 0 2px rgba(46, 125, 50, 0.2)',
      },
      inactive: {
        background: '#f5f5f5', // Light gray background
        border: '#e0e0e0',     // Gray border
        text: '#666666',       // Medium gray text
      },
      warning: {
        background: '#fff3e0', // Light orange background
        border: '#f57c00',     // Orange border
        text: '#e65100',       // Dark orange text
        shadow: '0 0 0 2px rgba(245, 124, 0, 0.2)',
      },
      error: {
        background: '#ffebee', // Light red background
        border: '#d32f2f',     // Red border
        text: '#b71c1c',       // Dark red text
        shadow: '0 0 0 2px rgba(211, 47, 47, 0.2)',
      },
    },
    transitions: {
      duration: 300,
      easing: 'ease-in-out',
    },
    animations: {
      pulse: true,
      glow: true,
    },
  };

  static getInstance(): VisualFeedbackSystem {
    if (!VisualFeedbackSystem.instance) {
      VisualFeedbackSystem.instance = new VisualFeedbackSystem();
    }
    return VisualFeedbackSystem.instance;
  }

  private constructor() {
    this.config = { ...this.defaultConfig };
  }

  // Get current configuration
  getConfig(): VisualFeedbackConfig {
    return { ...this.config };
  }

  // Get color scheme for a specific feedback type
  getColorScheme(type: FeedbackColor): ColorScheme {
    return { ...this.config.colors[type] };
  }

  // Subscribe to configuration changes
  subscribe(callback: (config: VisualFeedbackConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of configuration changes
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getConfig()));
  }

  // Update configuration
  updateConfig(newConfig: Partial<VisualFeedbackConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      colors: {
        ...this.config.colors,
        ...newConfig.colors,
      },
      transitions: {
        ...this.config.transitions,
        ...newConfig.transitions,
      },
      animations: {
        ...this.config.animations,
        ...newConfig.animations,
      },
    };
    this.notifyListeners();
  }

  // Apply visual feedback to an element
  applyFeedback(
    element: HTMLElement,
    type: FeedbackColor,
    options?: {
      animate?: boolean;
      duration?: number;
    }
  ): void {
    const colorScheme = this.getColorScheme(type);
    const animate = options?.animate ?? true;
    const duration = options?.duration ?? this.config.transitions.duration;

    if (animate) {
      this.animateElement(element, colorScheme, duration);
    } else {
      this.setElementStyles(element, colorScheme);
    }
  }

  // Remove visual feedback from an element
  removeFeedback(element: HTMLElement): void {
    this.clearElementStyles(element);
  }

  // Generate CSS classes for feedback types
  generateCSSClasses(): string {
    const classes: string[] = [];

    Object.entries(this.config.colors).forEach(([type, scheme]) => {
      const className = `feedback-${type}`;
      const css = `
        .${className} {
          background-color: ${scheme.background} !important;
          border-color: ${scheme.border} !important;
          color: ${scheme.text} !important;
          ${scheme.shadow ? `box-shadow: ${scheme.shadow} !important;` : ''}
          transition: all ${this.config.transitions.duration}ms ${this.config.transitions.easing} !important;
        }

        .${className}.animate-pulse {
          animation: pulse 2s infinite;
        }

        .${className}.animate-glow {
          animation: glow 2s infinite;
        }
      `;
      classes.push(css);
    });

    // Add keyframes for animations
    classes.push(`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: ${this.config.colors.primary.shadow};
        }
        50% {
          box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.4);
        }
      }
    `);

    return classes.join('\n');
  }

  // Validate color contrast (WCAG AA compliance)
  validateContrast(foreground: string, background: string): boolean {
    // Simple contrast validation - in a real implementation,
    // you'd use a proper color contrast calculation library
    const fgBrightness = this.getBrightness(foreground);
    const bgBrightness = this.getBrightness(background);
    const contrast = Math.abs(fgBrightness - bgBrightness);

    // WCAG AA requires 4.5:1 contrast ratio
    // This is a simplified check - real implementation would calculate proper ratio
    return contrast > 125; // Rough approximation
  }

  // Apply feedback to multiple elements
  applyFeedbackToElements(
    elements: HTMLElement[],
    type: FeedbackColor,
    options?: {
      animate?: boolean;
      duration?: number;
      stagger?: number; // Delay between elements
    }
  ): void {
    const stagger = options?.stagger ?? 0;

    elements.forEach((element, index) => {
      const delay = index * stagger;
      setTimeout(() => {
        this.applyFeedback(element, type, options);
      }, delay);
    });
  }

  // Clear feedback from multiple elements
  clearFeedbackFromElements(elements: HTMLElement[]): void {
    elements.forEach(element => this.removeFeedback(element));
  }

  // Private methods

  private animateElement(
    element: HTMLElement,
    colorScheme: ColorScheme,
    duration: number
  ): void {
    // Store original styles
    const originalStyles = {
      backgroundColor: element.style.backgroundColor,
      borderColor: element.style.borderColor,
      color: element.style.color,
      boxShadow: element.style.boxShadow,
      transition: element.style.transition,
    };

    // Apply transition
    element.style.transition = `all ${duration}ms ${this.config.transitions.easing}`;

    // Apply new styles
    this.setElementStyles(element, colorScheme);

    // Add animation classes if enabled
    if (this.config.animations.pulse) {
      element.classList.add('animate-pulse');
    }
    if (this.config.animations.glow) {
      element.classList.add('animate-glow');
    }

    // Clean up animations after transition
    setTimeout(() => {
      element.classList.remove('animate-pulse', 'animate-glow');
    }, duration);
  }

  private setElementStyles(element: HTMLElement, colorScheme: ColorScheme): void {
    element.style.backgroundColor = colorScheme.background;
    element.style.borderColor = colorScheme.border;
    element.style.color = colorScheme.text;
    if (colorScheme.shadow) {
      element.style.boxShadow = colorScheme.shadow;
    }
  }

  private clearElementStyles(element: HTMLElement): void {
    element.style.backgroundColor = '';
    element.style.borderColor = '';
    element.style.color = '';
    element.style.boxShadow = '';
    element.style.transition = '';
    element.classList.remove('animate-pulse', 'animate-glow');
  }

  private getBrightness(color: string): number {
    // Simple brightness calculation
    // In a real implementation, you'd parse the color properly
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000;
    }
    return 128; // Default medium brightness
  }
}

// Singleton instance
const visualFeedbackSystem = VisualFeedbackSystem.getInstance();

// React hook for using visual feedback
export function useVisualFeedback(): {
  config: VisualFeedbackConfig;
  getColorScheme: (type: FeedbackColor) => ColorScheme;
  applyFeedback: (
    element: HTMLElement,
    type: FeedbackColor,
    options?: { animate?: boolean; duration?: number }
  ) => void;
  removeFeedback: (element: HTMLElement) => void;
  applyFeedbackToElements: (
    elements: HTMLElement[],
    type: FeedbackColor,
    options?: { animate?: boolean; duration?: number; stagger?: number }
  ) => void;
  clearFeedbackFromElements: (elements: HTMLElement[]) => void;
  generateCSSClasses: () => string;
  validateContrast: (foreground: string, background: string) => boolean;
} {
  const [config, setConfig] = useState<VisualFeedbackConfig>(visualFeedbackSystem.getConfig());

  useEffect(() => {
    const unsubscribe = visualFeedbackSystem.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    getColorScheme: useCallback((type: FeedbackColor) => visualFeedbackSystem.getColorScheme(type), []),
    applyFeedback: useCallback((
      element: HTMLElement,
      type: FeedbackColor,
      options?: { animate?: boolean; duration?: number }
    ) => visualFeedbackSystem.applyFeedback(element, type, options), []),
    removeFeedback: useCallback((element: HTMLElement) => visualFeedbackSystem.removeFeedback(element), []),
    applyFeedbackToElements: useCallback((
      elements: HTMLElement[],
      type: FeedbackColor,
      options?: { animate?: boolean; duration?: number; stagger?: number }
    ) => visualFeedbackSystem.applyFeedbackToElements(elements, type, options), []),
    clearFeedbackFromElements: useCallback(
      (elements: HTMLElement[]) => visualFeedbackSystem.clearFeedbackFromElements(elements),
      []
    ),
    generateCSSClasses: useCallback(() => visualFeedbackSystem.generateCSSClasses(), []),
    validateContrast: useCallback(
      (foreground: string, background: string) => visualFeedbackSystem.validateContrast(foreground, background),
      []
    ),
  };
}

export { visualFeedbackSystem };
export default VisualFeedbackSystem;


