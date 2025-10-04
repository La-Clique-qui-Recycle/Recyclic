/**
 * Utilities for a weight input mask with kilos.grams behavior.
 *
 * Behavior examples:
 * - ""    + 1 -> 1
 * - "1"   + . -> 1.
 * - "1."  + 2 -> 1.2
 * - "1.2" + 3 -> 1.23
 * - "12"  + . -> 12.
 * - "12." + 5 -> 12.5
 */

/** Normalize input by allowing digits and one decimal point */
export function normalizeWeightInput(input: string): string {
  if (!input) return '';
  // Allow digits and one decimal point
  const cleaned = input.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

/** Apply a single numeric digit (0-9) to the current weight input */
export function applyDigit(currentInput: string, digit: string): string {
  if (!/^[0-9]$/.test(digit)) return normalizeWeightInput(currentInput);
  const normalized = normalizeWeightInput(currentInput);
  return normalized + digit;
}

/** Apply decimal point to the current weight input */
export function applyDecimalPoint(currentInput: string): string {
  const normalized = normalizeWeightInput(currentInput);
  if (normalized.includes('.')) return normalized; // Already has decimal point
  return normalized + '.';
}

/** Remove the last character from the input */
export function backspaceWeight(currentInput: string): string {
  const normalized = normalizeWeightInput(currentInput);
  if (normalized.length === 0) return '';
  return normalized.slice(0, -1);
}

/** Clear the input */
export function clearWeight(): string {
  return '';
}

/**
 * Format weight input for display (ensure proper decimal format)
 */
export function formatWeightDisplay(input: string): string {
  const normalized = normalizeWeightInput(input);
  if (!normalized) return '';
  
  // If it ends with a decimal point, keep it
  if (normalized.endsWith('.')) return normalized;
  
  // If it has a decimal point, ensure proper formatting
  if (normalized.includes('.')) {
    const [intPart, decPart] = normalized.split('.');
    return `${intPart}.${decPart}`;
  }
  
  return normalized;
}

/** Parse the formatted string to a float number (kg). */
export function parseWeight(formatted: string): number {
  const n = Number((formatted || '0').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Handle a keyboard key for the weight input. Returns the new input string.
 * Recognized keys: digits, Backspace, Delete, '.', ',' (comma converted to dot).
 */
export function handleWeightKey(currentInput: string, key: string): string {
  if (/^[0-9]$/.test(key)) {
    return applyDigit(currentInput, key);
  }
  if (key === 'Backspace' || key === 'Delete') {
    return backspaceWeight(currentInput);
  }
  if (key === '.' || key === ',') {
    return applyDecimalPoint(currentInput);
  }
  return normalizeWeightInput(currentInput);
}




