import { describe, it, expect } from 'vitest';
import { computeLineAmount, formatLineAmount, computeAndFormatLineAmount } from './lineAmount';

describe('lineAmount utilities', () => {
  describe('computeLineAmount', () => {
    it('should calculate correct amount for valid inputs', () => {
      expect(computeLineAmount(10.5, 2)).toBe(21);
      expect(computeLineAmount('15.50', '3')).toBe(46.5);
      expect(computeLineAmount(0, 5)).toBe(0);
      expect(computeLineAmount(5, 0)).toBe(0);
    });

    it('should handle decimal precision correctly', () => {
      expect(computeLineAmount(0.1, 3)).toBe(0.3);
      expect(computeLineAmount(0.33, 3)).toBe(0.99);
      expect(computeLineAmount(1.11, 3)).toBe(3.33);
    });

    it('should return 0 for invalid inputs', () => {
      expect(computeLineAmount('invalid', 2)).toBe(0);
      expect(computeLineAmount(10, 'invalid')).toBe(0);
      expect(computeLineAmount(-5, 2)).toBe(0);
      expect(computeLineAmount(10, -2)).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(computeLineAmount(9999.99, 1)).toBe(9999.99);
      expect(computeLineAmount(1000, 100)).toBe(100000);
    });
  });

  describe('formatLineAmount', () => {
    it('should format amounts with French locale', () => {
      expect(formatLineAmount(15.50)).toBe('15,50\u00A0€');
      expect(formatLineAmount(0)).toBe('0,00\u00A0€');
      expect(formatLineAmount(1000)).toBe('1\u202F000,00\u00A0€');
      expect(formatLineAmount(0.99)).toBe('0,99\u00A0€');
    });

    it('should handle decimal precision', () => {
      expect(formatLineAmount(15.555)).toBe('15,56\u00A0€'); // Rounded
      expect(formatLineAmount(15.554)).toBe('15,55\u00A0€'); // Rounded down
    });
  });

  describe('computeAndFormatLineAmount', () => {
    it('should compute and format in one step', () => {
      expect(computeAndFormatLineAmount(10.5, 2)).toBe('21,00\u00A0€');
      expect(computeAndFormatLineAmount('15.50', '3')).toBe('46,50\u00A0€');
      expect(computeAndFormatLineAmount(0, 5)).toBe('0,00\u00A0€');
    });
  });
});
