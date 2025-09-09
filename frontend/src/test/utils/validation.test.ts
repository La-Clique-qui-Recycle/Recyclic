import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidPhone,
  isValidTelegramId,
  isValidUsername,
  isRequired,
  validateRegistrationForm,
  getFieldError,
  formatPhoneNumber,
  formatUsername,
  type RegistrationFormData
} from '../../utils/validation'

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate French phone numbers', () => {
      expect(isValidPhone('0123456789')).toBe(true)
      expect(isValidPhone('+33123456789')).toBe(true)
      expect(isValidPhone('06 12 34 56 78')).toBe(true)
      expect(isValidPhone('+33 6 12 34 56 78')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123456789')).toBe(false)
      expect(isValidPhone('012345678')).toBe(false)
      expect(isValidPhone('+3312345678')).toBe(false)
      expect(isValidPhone('invalid')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('isValidTelegramId', () => {
    it('should validate correct Telegram IDs', () => {
      expect(isValidTelegramId('123456789')).toBe(true)
      expect(isValidTelegramId('1234567890')).toBe(true)
    })

    it('should reject invalid Telegram IDs', () => {
      expect(isValidTelegramId('12345678')).toBe(false)
      expect(isValidTelegramId('12345678901')).toBe(false)
      expect(isValidTelegramId('abc123456')).toBe(false)
      expect(isValidTelegramId('')).toBe(false)
    })
  })

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('@username')).toBe(true)
      expect(isValidUsername('@user_name')).toBe(true)
      expect(isValidUsername('@user123')).toBe(true)
      expect(isValidUsername('@' + 'a'.repeat(32))).toBe(true)
    })

    it('should reject invalid usernames', () => {
      expect(isValidUsername('username')).toBe(false)
      expect(isValidUsername('@user')).toBe(false)
      expect(isValidUsername('@' + 'a'.repeat(33))).toBe(false)
      expect(isValidUsername('@user-name')).toBe(false)
      expect(isValidUsername('@user.name')).toBe(false)
    })

    it('should accept empty username (optional field)', () => {
      expect(isValidUsername('')).toBe(true)
    })
  })

  describe('isRequired', () => {
    it('should validate required fields', () => {
      expect(isRequired('test')).toBe(true)
      expect(isRequired('  test  ')).toBe(true)
    })

    it('should reject empty or whitespace-only fields', () => {
      expect(isRequired('')).toBe(false)
      expect(isRequired('   ')).toBe(false)
    })
  })

  describe('validateRegistrationForm', () => {
    const validFormData: RegistrationFormData = {
      telegram_id: '123456789',
      username: '@testuser',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '0123456789',
      site_id: '1',
      notes: 'Test notes'
    }

    it('should validate correct form data', () => {
      const result = validateRegistrationForm(validFormData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require telegram_id', () => {
      const data = { ...validFormData, telegram_id: '' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'telegram_id',
        message: 'L\'ID Telegram est requis'
      })
    })

    it('should validate telegram_id format', () => {
      const data = { ...validFormData, telegram_id: '123' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'telegram_id',
        message: 'L\'ID Telegram doit contenir 9 ou 10 chiffres'
      })
    })

    it('should require first_name', () => {
      const data = { ...validFormData, first_name: '' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'first_name',
        message: 'Le prénom est requis'
      })
    })

    it('should require last_name', () => {
      const data = { ...validFormData, last_name: '' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'last_name',
        message: 'Le nom de famille est requis'
      })
    })

    it('should validate email format when provided', () => {
      const data = { ...validFormData, email: 'invalid-email' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'L\'adresse email n\'est pas valide'
      })
    })

    it('should validate phone format when provided', () => {
      const data = { ...validFormData, phone: 'invalid-phone' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Le numéro de téléphone n\'est pas valide (format français requis)'
      })
    })

    it('should validate username format when provided', () => {
      const data = { ...validFormData, username: 'invalid-username' }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Le nom d\'utilisateur doit commencer par @ et contenir 5-32 caractères alphanumériques'
      })
    })

    it('should allow empty optional fields', () => {
      const data = {
        ...validFormData,
        username: '',
        email: '',
        phone: '',
        notes: ''
      }
      const result = validateRegistrationForm(data)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('getFieldError', () => {
    const errors = [
      { field: 'telegram_id', message: 'ID Telegram requis' },
      { field: 'email', message: 'Email invalide' }
    ]

    it('should return error message for existing field', () => {
      expect(getFieldError(errors, 'telegram_id')).toBe('ID Telegram requis')
      expect(getFieldError(errors, 'email')).toBe('Email invalide')
    })

    it('should return undefined for non-existing field', () => {
      expect(getFieldError(errors, 'first_name')).toBeUndefined()
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format phone numbers correctly', () => {
      expect(formatPhoneNumber('0123456789')).toBe('+33123456789')
      expect(formatPhoneNumber('+33123456789')).toBe('+33123456789')
      expect(formatPhoneNumber('06 12 34 56 78')).toBe('+33612345678')
      expect(formatPhoneNumber('+33 6 12 34 56 78')).toBe('+33612345678')
    })

    it('should return original value for invalid formats', () => {
      expect(formatPhoneNumber('invalid')).toBe('invalid')
      expect(formatPhoneNumber('')).toBe('')
    })
  })

  describe('formatUsername', () => {
    it('should add @ prefix when missing', () => {
      expect(formatUsername('username')).toBe('@username')
      expect(formatUsername('test_user')).toBe('@test_user')
    })

    it('should not add @ prefix when already present', () => {
      expect(formatUsername('@username')).toBe('@username')
    })

    it('should return empty string for empty input', () => {
      expect(formatUsername('')).toBe('')
    })
  })
})
