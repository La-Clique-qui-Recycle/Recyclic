import { useState, useEffect } from 'react'

const CURRENT_SESSION_STORAGE_KEY = 'currentCashSession'
const LAST_CLOSED_SESSION_STORAGE_KEY = 'lastClosedCashSession'

const createSessionId = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return 'session_' + globalThis.crypto.randomUUID()
  }

  return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
}

interface CashSession {
  id: string
  site_id: string
  operator_id: string
  opening_amount: number
  closing_amount?: number
  actual_amount?: number
  variance?: number
  variance_comment?: string
  status: 'opened' | 'closed'
  opened_at: Date
  closed_at?: Date
}

interface CashSessionState {
  currentSession: CashSession | null
  isSessionOpen: boolean
  isLoading: boolean
  error: string | null
}

export const useCashSession = () => {
  const [sessionState, setSessionState] = useState<CashSessionState>({
    currentSession: null,
    isSessionOpen: false,
    isLoading: false,
    error: null
  })

  const openSession = async (operatorId: string, openingAmount: number) => {
    setSessionState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const newSession: CashSession = {
        id: createSessionId(),
        site_id: '1', // Default site
        operator_id: operatorId,
        opening_amount: openingAmount,
        status: 'opened',
        opened_at: new Date()
      }

      // Store in localStorage for persistence
      localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, JSON.stringify(newSession))
      localStorage.removeItem(LAST_CLOSED_SESSION_STORAGE_KEY)

      // Update state synchronously for immediate UI response
      setSessionState(prev => ({
        ...prev,
        currentSession: newSession,
        isSessionOpen: true,
        isLoading: false,
        error: null
      }))

      return { success: true, session: newSession }
    } catch {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to open session'
      }))
      return { success: false, error: 'Failed to open session' }
    }
  }

  const closeSession = async (actualAmount: number, varianceComment?: string) => {
    if (!sessionState.currentSession) {
      return { success: false, error: 'No active session' }
    }

    setSessionState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const variance = actualAmount - sessionState.currentSession.opening_amount

      const closedSession: CashSession = {
        ...sessionState.currentSession,
        closing_amount: actualAmount,
        actual_amount: actualAmount,
        variance,
        variance_comment: varianceComment,
        status: 'closed',
        closed_at: new Date()
      }

      // Persist closed session for future reference
      localStorage.removeItem(CURRENT_SESSION_STORAGE_KEY)
      localStorage.setItem(LAST_CLOSED_SESSION_STORAGE_KEY, JSON.stringify(closedSession))

      // Update state synchronously for immediate UI response
      setSessionState(prev => ({
        ...prev,
        currentSession: closedSession,
        isSessionOpen: false, // Session is closed, so not open
        isLoading: false,
        error: null
      }))

      return { success: true, session: closedSession }
    } catch {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to close session'
      }))
      return { success: false, error: 'Failed to close session' }
    }
  }

  const loadSession = () => {
    try {
      const storedSession = localStorage.getItem(CURRENT_SESSION_STORAGE_KEY)
      if (storedSession) {
        const session = JSON.parse(storedSession)
        setSessionState({
          currentSession: session,
          isSessionOpen: session.status === 'opened',
          isLoading: false,
          error: null
        })
        return
      }

      const lastClosedSession = localStorage.getItem(LAST_CLOSED_SESSION_STORAGE_KEY)
      if (lastClosedSession) {
        const session = JSON.parse(lastClosedSession)
        setSessionState({
          currentSession: session,
          isSessionOpen: false,
          isLoading: false,
          error: null
        })
      }
    } catch {
      setSessionState(prev => ({
        ...prev,
        error: 'Failed to load session'
      }))
    }
  }

  const getSessionSummary = () => {
    if (!sessionState.currentSession) {
      return null
    }

    return {
      id: sessionState.currentSession.id,
      openingAmount: sessionState.currentSession.opening_amount,
      closingAmount: sessionState.currentSession.closing_amount,
      variance: sessionState.currentSession.variance,
      status: sessionState.currentSession.status,
      openedAt: sessionState.currentSession.opened_at,
      closedAt: sessionState.currentSession.closed_at
    }
  }

  const isVarianceSignificant = (threshold: number = 5): boolean => {
    if (!sessionState.currentSession?.variance) {
      return false
    }

    return Math.abs(sessionState.currentSession.variance) > threshold
  }

  useEffect(() => {
    loadSession()
  }, [])

  return {
    ...sessionState,
    openSession,
    closeSession,
    loadSession,
    getSessionSummary,
    isVarianceSignificant
  }
}
