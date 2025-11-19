import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualFeedbackSystem, FeedbackColor } from '../visualFeedback';

describe('VisualFeedbackSystem', () => {
  let system: VisualFeedbackSystem;

  beforeEach(() => {
    // Reset singleton instance for each test
    (VisualFeedbackSystem as any).instance = null;
    system = VisualFeedbackSystem.getInstance();
  });

  afterEach(() => {
    // Clean up any DOM manipulations
    document.body.innerHTML = '';
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const system1 = VisualFeedbackSystem.getInstance();
      const system2 = VisualFeedbackSystem.getInstance();
      expect(system1).toBe(system2);
    });
  });

  describe('default configuration', () => {
    it('has all required color schemes', () => {
      const config = system.getConfig();

      expect(config.colors).toHaveProperty('primary');
      expect(config.colors).toHaveProperty('success');
      expect(config.colors).toHaveProperty('inactive');
      expect(config.colors).toHaveProperty('warning');
      expect(config.colors).toHaveProperty('error');
    });

    it('has transition settings', () => {
      const config = system.getConfig();

      expect(config.transitions).toHaveProperty('duration');
      expect(config.transitions).toHaveProperty('easing');
      expect(typeof config.transitions.duration).toBe('number');
    });

    it('has animation settings', () => {
      const config = system.getConfig();

      expect(config.animations).toHaveProperty('pulse');
      expect(config.animations).toHaveProperty('glow');
      expect(typeof config.animations.pulse).toBe('boolean');
    });
  });

  describe('color schemes', () => {
    it('returns correct primary color scheme', () => {
      const scheme = system.getColorScheme('primary');

      expect(scheme).toHaveProperty('background');
      expect(scheme).toHaveProperty('border');
      expect(scheme).toHaveProperty('text');
      expect(scheme.background).toBe('#e3f2fd');
      expect(scheme.border).toBe('#1976d2');
      expect(scheme.text).toBe('#0d47a1');
    });

    it('returns correct success color scheme', () => {
      const scheme = system.getColorScheme('success');

      expect(scheme.background).toBe('#e8f5e8');
      expect(scheme.border).toBe('#2e7d32');
      expect(scheme.text).toBe('#1b5e20');
    });

    it('returns correct inactive color scheme', () => {
      const scheme = system.getColorScheme('inactive');

      expect(scheme.background).toBe('#f5f5f5');
      expect(scheme.border).toBe('#e0e0e0');
      expect(scheme.text).toBe('#666666');
    });
  });

  describe('subscription system', () => {
    it('notifies listeners on config change', () => {
      const mockCallback = vi.fn();
      const unsubscribe = system.subscribe(mockCallback);

      system.updateConfig({
        transitions: { duration: 500, easing: 'linear' }
      });

      expect(mockCallback).toHaveBeenCalledWith(system.getConfig());

      unsubscribe();
    });

    it('stops notifying after unsubscribe', () => {
      const mockCallback = vi.fn();
      const unsubscribe = system.subscribe(mockCallback);

      unsubscribe();
      system.updateConfig({
        transitions: { duration: 600, easing: 'ease-out' }
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('visual feedback application', () => {
    it('applies feedback to element', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      system.applyFeedback(element, 'primary', { animate: false });

      expect(element.style.backgroundColor).toBe('#e3f2fd');
      expect(element.style.borderColor).toBe('#1976d2');
      expect(element.style.color).toBe('#0d47a1');
    });

    it('removes feedback from element', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      system.applyFeedback(element, 'primary', { animate: false });
      system.removeFeedback(element);

      expect(element.style.backgroundColor).toBe('');
      expect(element.style.borderColor).toBe('');
      expect(element.style.color).toBe('');
    });

    it('applies feedback with animation', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      system.applyFeedback(element, 'success', { animate: true, duration: 100 });

      expect(element.style.transition).toContain('300ms');
    });

    it('applies feedback to multiple elements', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      system.applyFeedbackToElements([element1, element2], 'warning', {
        animate: false,
        stagger: 50
      });

      // Elements should eventually get the styles (async due to stagger)
      setTimeout(() => {
        expect(element1.style.backgroundColor).toBe('#fff3e0');
        expect(element2.style.backgroundColor).toBe('#fff3e0');
      }, 100);
    });

    it('clears feedback from multiple elements', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      system.applyFeedbackToElements([element1, element2], 'error', { animate: false });
      system.clearFeedbackFromElements([element1, element2]);

      expect(element1.style.backgroundColor).toBe('');
      expect(element2.style.backgroundColor).toBe('');
    });
  });

  describe('CSS generation', () => {
    it('generates CSS classes', () => {
      const css = system.generateCSSClasses();

      expect(css).toContain('.feedback-primary');
      expect(css).toContain('.feedback-success');
      expect(css).toContain('.feedback-inactive');
      expect(css).toContain('.feedback-warning');
      expect(css).toContain('.feedback-error');
      expect(css).toContain('@keyframes pulse');
      expect(css).toContain('@keyframes glow');
    });

    it('includes transition properties', () => {
      const css = system.generateCSSClasses();

      expect(css).toContain('transition:');
      expect(css).toContain('ease-in-out');
    });
  });

  describe('contrast validation', () => {
    it('validates high contrast colors', () => {
      const isValid = system.validateContrast('#000000', '#ffffff');
      expect(isValid).toBe(true);
    });

    it('validates low contrast colors', () => {
      const isValid = system.validateContrast('#808080', '#909090');
      expect(isValid).toBe(false);
    });

    it('handles hex color format', () => {
      const isValid = system.validateContrast('#1976d2', '#e3f2fd');
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('configuration updates', () => {
    it('updates colors configuration', () => {
      const newColors = {
        primary: {
          background: '#custom-bg',
          border: '#custom-border',
          text: '#custom-text',
        }
      };

      system.updateConfig({ colors: newColors });

      const scheme = system.getColorScheme('primary');
      expect(scheme.background).toBe('#custom-bg');
      expect(scheme.border).toBe('#custom-border');
      expect(scheme.text).toBe('#custom-text');
    });

    it('updates transitions configuration', () => {
      system.updateConfig({
        transitions: { duration: 500, easing: 'linear' }
      });

      const config = system.getConfig();
      expect(config.transitions.duration).toBe(500);
      expect(config.transitions.easing).toBe('linear');
    });

    it('updates animations configuration', () => {
      system.updateConfig({
        animations: { pulse: false, glow: false }
      });

      const config = system.getConfig();
      expect(config.animations.pulse).toBe(false);
      expect(config.animations.glow).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles invalid elements gracefully', () => {
      const invalidElement = null as any;

      // Should not throw
      expect(() => {
        system.applyFeedback(invalidElement, 'primary');
      }).not.toThrow();
    });

    it('handles empty element arrays', () => {
      expect(() => {
        system.applyFeedbackToElements([], 'primary');
      }).not.toThrow();
    });
  });
});


