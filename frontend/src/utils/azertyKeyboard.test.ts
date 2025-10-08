import { describe, it, expect, vi } from 'vitest';
import { 
  isDirectNumeric, 
  isAZERTYMapped, 
  isAZERTYShiftMapped, 
  mapAZERTYToNumeric, 
  isSpecialKey, 
  handleAZERTYInput, 
  createAZERTYHandler 
} from './azertyKeyboard';

describe('azertyKeyboard utilities', () => {
  describe('isDirectNumeric', () => {
    it('should identify numeric keys', () => {
      expect(isDirectNumeric('0')).toBe(true);
      expect(isDirectNumeric('9')).toBe(true);
      expect(isDirectNumeric('5')).toBe(true);
    });

    it('should reject non-numeric keys', () => {
      expect(isDirectNumeric('a')).toBe(false);
      expect(isDirectNumeric('&')).toBe(false);
      expect(isDirectNumeric('é')).toBe(false);
    });
  });

  describe('isAZERTYMapped', () => {
    it('should identify AZERTY mapped keys', () => {
      expect(isAZERTYMapped('&')).toBe(true);
      expect(isAZERTYMapped('é')).toBe(true);
      expect(isAZERTYMapped('ç')).toBe(true);
      expect(isAZERTYMapped('à')).toBe(true);
    });

    it('should reject non-AZERTY keys', () => {
      expect(isAZERTYMapped('a')).toBe(false);
      expect(isAZERTYMapped('1')).toBe(false);
      expect(isAZERTYMapped('z')).toBe(false);
    });
  });

  describe('isAZERTYShiftMapped', () => {
    it('should identify Shift+AZERTY combinations', () => {
      const mockEvent = { shiftKey: true } as KeyboardEvent;
      expect(isAZERTYShiftMapped('1', mockEvent)).toBe(true);
      expect(isAZERTYShiftMapped('2', mockEvent)).toBe(true);
      expect(isAZERTYShiftMapped('0', mockEvent)).toBe(true);
    });

    it('should reject non-Shift combinations', () => {
      const mockEvent = { shiftKey: false } as KeyboardEvent;
      expect(isAZERTYShiftMapped('1', mockEvent)).toBe(false);
    });
  });

  describe('mapAZERTYToNumeric', () => {
    it('should map direct numeric keys', () => {
      expect(mapAZERTYToNumeric('1')).toBe('1');
      expect(mapAZERTYToNumeric('9')).toBe('9');
    });

    it('should map AZERTY keys to numbers', () => {
      expect(mapAZERTYToNumeric('&')).toBe('1');
      expect(mapAZERTYToNumeric('é')).toBe('2');
      expect(mapAZERTYToNumeric('ç')).toBe('9');
      expect(mapAZERTYToNumeric('à')).toBe('0');
    });

    it('should map Shift+AZERTY combinations', () => {
      const mockEvent = { shiftKey: true } as KeyboardEvent;
      expect(mapAZERTYToNumeric('1', mockEvent)).toBe('1');
      expect(mapAZERTYToNumeric('2', mockEvent)).toBe('2');
    });

    it('should ignore modifier keys', () => {
      expect(mapAZERTYToNumeric('Shift')).toBe(null);
      expect(mapAZERTYToNumeric('Control')).toBe(null);
      expect(mapAZERTYToNumeric('Alt')).toBe(null);
    });

    it('should return null for unmapped keys', () => {
      expect(mapAZERTYToNumeric('a')).toBe(null);
      expect(mapAZERTYToNumeric('z')).toBe(null);
    });
  });

  describe('isSpecialKey', () => {
    it('should identify special keys', () => {
      expect(isSpecialKey('Backspace')).toBe(true);
      expect(isSpecialKey('Delete')).toBe(true);
      expect(isSpecialKey('.')).toBe(true);
      expect(isSpecialKey(',')).toBe(true);
    });

    it('should reject non-special keys', () => {
      expect(isSpecialKey('1')).toBe(false);
      expect(isSpecialKey('a')).toBe(false);
      expect(isSpecialKey('Enter')).toBe(false);
    });
  });

  describe('handleAZERTYInput', () => {
    it('should handle direct numeric input', () => {
      const mockEvent = { key: '1' } as KeyboardEvent;
      expect(handleAZERTYInput('', '1', mockEvent)).toBe('1');
      expect(handleAZERTYInput('12', '3', mockEvent)).toBe('123');
    });

    it('should handle AZERTY mapped input', () => {
      const mockEvent = { key: '&' } as KeyboardEvent;
      expect(handleAZERTYInput('', '&', mockEvent)).toBe('1');
      expect(handleAZERTYInput('1', 'é', mockEvent)).toBe('12');
    });

    it('should handle backspace', () => {
      const mockEvent = { key: 'Backspace' } as KeyboardEvent;
      expect(handleAZERTYInput('123', 'Backspace', mockEvent)).toBe('12');
      expect(handleAZERTYInput('', 'Backspace', mockEvent)).toBe('');
    });

    it('should handle decimal point', () => {
      const mockEvent = { key: '.' } as KeyboardEvent;
      expect(handleAZERTYInput('12', '.', mockEvent, 10, true)).toBe('12.');
      expect(handleAZERTYInput('12.', '.', mockEvent, 10, true)).toBe('12.'); // No duplicate
    });

    it('should respect max length', () => {
      const mockEvent = { key: '1' } as KeyboardEvent;
      expect(handleAZERTYInput('123456789', '1', mockEvent, 5)).toBe('123456789'); // No change
    });

    it('should ignore non-numeric keys', () => {
      const mockEvent = { key: 'a' } as KeyboardEvent;
      expect(handleAZERTYInput('12', 'a', mockEvent)).toBe('12'); // No change
    });
  });

  describe('createAZERTYHandler', () => {
    it('should create a handler that updates value', () => {
      const setValue = vi.fn();
      const validate = vi.fn();
      const handler = createAZERTYHandler(setValue, validate);
      
      const mockEvent = {
        key: '1',
        target: document.createElement('div'),
        preventDefault: vi.fn()
      } as any;
      
      handler(mockEvent);
      
      expect(setValue).toHaveBeenCalledWith('1');
      expect(validate).toHaveBeenCalledWith('1');
    });

    it('should ignore input in form elements', () => {
      const setValue = vi.fn();
      const handler = createAZERTYHandler(setValue);
      
      const mockEvent = {
        key: '1',
        target: document.createElement('input'),
        preventDefault: vi.fn()
      } as any;
      
      handler(mockEvent);
      
      expect(setValue).not.toHaveBeenCalled();
    });
  });
});
