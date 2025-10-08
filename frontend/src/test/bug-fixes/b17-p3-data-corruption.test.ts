/**
 * Tests pour la story B17-P3: Correction des données corrompues et manquantes
 * 
 * Cette suite de tests vérifie que:
 * 1. Les durées de session sont calculées correctement (pas de NaN)
 * 2. Les dates sont formatées correctement (pas de "Invalid Date")
 * 3. Les fonctions gèrent les données invalides gracieusement
 */

import { describe, it, expect } from 'vitest'
import { dashboardService } from '../../services/dashboardService'

describe('B17-P3: Correction des données corrompues', () => {
  describe('calculateSessionDuration', () => {
    it('devrait calculer correctement la durée d\'une session fermée', () => {
      const openedAt = '2025-01-27T10:00:00Z'
      const closedAt = '2025-01-27T12:30:00Z'
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('2h 30m')
      expect(duration).not.toContain('NaN')
    })

    it('devrait retourner "N/A" pour une date d\'ouverture invalide', () => {
      const openedAt = 'invalid-date'
      const closedAt = '2025-01-27T12:30:00Z'
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('N/A')
      expect(duration).not.toContain('NaN')
    })

    it('devrait retourner "N/A" pour une date de fermeture invalide', () => {
      const openedAt = '2025-01-27T10:00:00Z'
      const closedAt = 'invalid-date'
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('N/A')
      expect(duration).not.toContain('NaN')
    })

    it('devrait retourner "N/A" pour une date vide', () => {
      const duration = dashboardService.calculateSessionDuration('', null, 'closed')
      
      expect(duration).toBe('N/A')
      expect(duration).not.toContain('NaN')
    })

    it('devrait calculer la durée pour une session ouverte', () => {
      const openedAt = new Date(Date.now() - 3600000).toISOString() // 1 heure avant
      const duration = dashboardService.calculateSessionDuration(openedAt, null, 'open')
      
      expect(duration).toMatch(/^\d+h \d{2}m$/)
      expect(duration).not.toContain('NaN')
    })

    it('devrait retourner "0h 00m" pour une durée négative', () => {
      const openedAt = '2025-01-27T12:00:00Z'
      const closedAt = '2025-01-27T10:00:00Z' // Avant l'ouverture
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('0h 00m')
      expect(duration).not.toContain('NaN')
    })
  })

  describe('formatDate', () => {
    it('devrait formater correctement une date valide', () => {
      const dateString = '2025-01-27T10:30:00Z'
      const formatted = dashboardService.formatDate(dateString)
      
      expect(formatted).not.toBe('Invalid Date')
      expect(formatted).not.toContain('NaN')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('devrait retourner "N/A" pour une date invalide', () => {
      const dateString = 'invalid-date'
      const formatted = dashboardService.formatDate(dateString)
      
      expect(formatted).toBe('N/A')
      expect(formatted).not.toBe('Invalid Date')
    })

    it('devrait retourner "N/A" pour une chaîne vide', () => {
      const formatted = dashboardService.formatDate('')
      
      expect(formatted).toBe('N/A')
      expect(formatted).not.toBe('Invalid Date')
    })

    it('devrait retourner "N/A" pour null', () => {
      const formatted = dashboardService.formatDate(null as any)
      
      expect(formatted).toBe('N/A')
      expect(formatted).not.toBe('Invalid Date')
    })
  })

  describe('Robustesse des calculs', () => {
    it('ne devrait jamais retourner NaN dans les durées', () => {
      const testCases = [
        { openedAt: '', closedAt: null, status: 'open' },
        { openedAt: 'invalid', closedAt: 'invalid', status: 'closed' },
        { openedAt: '2025-01-27T10:00:00Z', closedAt: '', status: 'closed' },
        { openedAt: null as any, closedAt: null, status: 'open' },
      ]

      testCases.forEach(({ openedAt, closedAt, status }) => {
        const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, status)
        expect(duration).not.toContain('NaN')
      })
    })

    it('ne devrait jamais retourner "Invalid Date"', () => {
      const testCases = [
        '',
        'invalid-date',
        '2025-13-45T99:99:99Z', // Date impossible
        null as any,
        undefined as any,
      ]

      testCases.forEach((dateString) => {
        const formatted = dashboardService.formatDate(dateString)
        expect(formatted).not.toBe('Invalid Date')
        expect(formatted).not.toContain('Invalid')
      })
    })
  })

  describe('Cas limites', () => {
    it('devrait gérer les dates très anciennes', () => {
      const openedAt = '1970-01-01T00:00:00Z'
      const closedAt = '1970-01-01T01:00:00Z'
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('1h 00m')
      expect(duration).not.toContain('NaN')
    })

    it('devrait gérer les dates futures', () => {
      const openedAt = '2099-12-31T23:00:00Z'
      const closedAt = '2099-12-31T23:59:00Z'
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toBe('0h 59m')
      expect(duration).not.toContain('NaN')
    })

    it('devrait gérer les durées de plusieurs jours', () => {
      const openedAt = '2025-01-27T10:00:00Z'
      const closedAt = '2025-01-29T14:30:00Z' // 2 jours et 4h30 plus tard
      const duration = dashboardService.calculateSessionDuration(openedAt, closedAt, 'closed')
      
      expect(duration).toMatch(/^\d+h \d{2}m$/)
      expect(duration).not.toContain('NaN')
      
      // Vérifier que la durée est supérieure à 48 heures
      const hours = parseInt(duration.split('h')[0])
      expect(hours).toBeGreaterThanOrEqual(48)
    })
  })
})
