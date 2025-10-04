import { describe, it, expect } from 'vitest'
import {
  normalizeWeightInput,
  applyDigit,
  applyDecimalPoint,
  backspaceWeight,
  clearWeight,
  formatWeightDisplay,
  handleWeightKey,
  parseWeight,
} from '../../utils/weightMask'

describe('weightMask utils', () => {
  it('normalizeWeightInput should allow digits and one decimal point', () => {
    expect(normalizeWeightInput('12.34')).toBe('12.34')
    expect(normalizeWeightInput('12.34.56')).toBe('12.3456')
    expect(normalizeWeightInput('abc12.34def')).toBe('12.34')
    expect(normalizeWeightInput('')).toBe('')
  })

  it('applyDigit should append a digit', () => {
    expect(applyDigit('', '1')).toBe('1')
    expect(applyDigit('1', '2')).toBe('12')
    expect(applyDigit('12.', '3')).toBe('12.3')
    expect(applyDigit('x', 'a')).toBe('')
  })

  it('applyDecimalPoint should add decimal point if not present', () => {
    expect(applyDecimalPoint('12')).toBe('12.')
    expect(applyDecimalPoint('12.')).toBe('12.') // already has decimal
    expect(applyDecimalPoint('')).toBe('.')
  })

  it('backspaceWeight should remove last character', () => {
    expect(backspaceWeight('12.3')).toBe('12.')
    expect(backspaceWeight('12.')).toBe('12')
    expect(backspaceWeight('12')).toBe('1')
    expect(backspaceWeight('1')).toBe('')
    expect(backspaceWeight('')).toBe('')
  })

  it('clearWeight should empty input', () => {
    expect(clearWeight()).toBe('')
  })

  it('formatWeightDisplay should format properly', () => {
    expect(formatWeightDisplay('')).toBe('')
    expect(formatWeightDisplay('12')).toBe('12')
    expect(formatWeightDisplay('12.')).toBe('12.')
    expect(formatWeightDisplay('12.3')).toBe('12.3')
    expect(formatWeightDisplay('12.34')).toBe('12.34')
  })

  it('handleWeightKey should process digits, backspace, delete, separators', () => {
    let input = ''
    input = handleWeightKey(input, '1')
    expect(input).toBe('1')
    input = handleWeightKey(input, '2')
    expect(input).toBe('12')
    input = handleWeightKey(input, '.')
    expect(input).toBe('12.')
    input = handleWeightKey(input, '3')
    expect(input).toBe('12.3')
    input = handleWeightKey(input, ',') // comma converted to dot
    expect(input).toBe('12.3') // no change, already has decimal
    input = handleWeightKey(input, 'Backspace')
    expect(input).toBe('12.')
    input = handleWeightKey(input, 'Delete')
    expect(input).toBe('12')
  })

  it('parseWeight should parse dot or comma separated', () => {
    expect(parseWeight('1.23')).toBeCloseTo(1.23)
    expect(parseWeight('1,23')).toBeCloseTo(1.23)
    expect(parseWeight('12')).toBeCloseTo(12)
    expect(parseWeight('abc')).toBe(0)
  })
})




