// Validation utilities for forms

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation (French format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+33|0)[1-9](\d{8})$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Telegram ID validation
export const isValidTelegramId = (telegramId: string): boolean => {
  const telegramIdRegex = /^\d{9,10}$/
  return telegramIdRegex.test(telegramId)
}

// Username validation (Telegram format)
export const isValidUsername = (username: string): boolean => {
  if (!username) return true // Username is optional
  const usernameRegex = /^@[a-zA-Z0-9_]{5,32}$/
  return usernameRegex.test(username)
}

// Required field validation
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0
}

// Registration form validation
export interface RegistrationFormData {
  telegram_id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  site_id: string
  notes: string
}

export const validateRegistrationForm = (data: RegistrationFormData): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  if (!isRequired(data.telegram_id)) {
    errors.push({ field: 'telegram_id', message: 'L\'ID Telegram est requis' })
  } else if (!isValidTelegramId(data.telegram_id)) {
    errors.push({ field: 'telegram_id', message: 'L\'ID Telegram doit contenir 9 ou 10 chiffres' })
  }

  if (!isRequired(data.first_name)) {
    errors.push({ field: 'first_name', message: 'Le prénom est requis' })
  }

  if (!isRequired(data.last_name)) {
    errors.push({ field: 'last_name', message: 'Le nom de famille est requis' })
  }

  // Optional fields with validation
  if (data.username && !isValidUsername(data.username)) {
    errors.push({ field: 'username', message: 'Le nom d\'utilisateur doit commencer par @ et contenir 5-32 caractères alphanumériques' })
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'L\'adresse email n\'est pas valide' })
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone n\'est pas valide (format français requis)' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get error message for a specific field
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  const error = errors.find(e => e.field === field)
  return error?.message
}

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('33')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+33${cleaned.slice(1)}`
  }
  return phone
}

// Format username
export const formatUsername = (username: string): string => {
  if (!username) return ''
  if (username.startsWith('@')) return username
  return `@${username}`
}
