import { useState, useEffect } from 'react'

interface CashSession {
  id: string
  site_id: string
  cashier_id: string
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

  const openSession = async (cashierId: string, openingAmount: number) => {
    setSessionState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const newSession: CashSession = {
        id: `session_${Date.now()}`,
        site_id: '1', // Default site
        cashier_id: cashierId,
        opening_amount: openingAmount,
        status: 'opened',
        opened_at: new Date()
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('currentCashSession', JSON.stringify(newSession))
      
      setSessionState({
        currentSession: newSession,
        isSessionOpen: true,
        isLoading: false,
        error: null
      })
      
      return { success: true, session: newSession }
    } catch (error) {
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
      
      // Remove from localStorage
      localStorage.removeItem('currentCashSession')
      
      setSessionState({
        currentSession: null,
        isSessionOpen: false,
        isLoading: false,
        error: null
      })
      
      return { success: true, session: closedSession }
    } catch (error) {
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
      const storedSession = localStorage.getItem('currentCashSession')
      if (storedSession) {
        const session = JSON.parse(storedSession)
        setSessionState({
          currentSession: session,
          isSessionOpen: session.status === 'opened',
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
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

  const isVarianceSignificant = (threshold: number = 5) => {
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
