import { useState, useEffect } from 'react'

interface OfflineState {
  isOnline: boolean
  isOffline: boolean
  lastOnline: Date | null
  offlineQueue: any[]
}

export const useOffline = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
    offlineQueue: []
  })

  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        lastOnline: new Date()
      }))
    }

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addToQueue = (item: any) => {
    setOfflineState(prev => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, { ...item, timestamp: new Date() }]
    }))
  }

  const removeFromQueue = (index: number) => {
    setOfflineState(prev => ({
      ...prev,
      offlineQueue: prev.offlineQueue.filter((_, i) => i !== index)
    }))
  }

  const clearQueue = () => {
    setOfflineState(prev => ({
      ...prev,
      offlineQueue: []
    }))
  }

  const getQueueSize = () => {
    return offlineState.offlineQueue.length
  }

  const getQueueItems = () => {
    return offlineState.offlineQueue
  }

  const syncQueue = async (syncFunction: (item: any) => Promise<boolean>) => {
    if (offlineState.isOffline) {
      return { success: false, error: 'Cannot sync while offline' }
    }

    const results = []
    const successfulItems = []

    for (let i = 0; i < offlineState.offlineQueue.length; i++) {
      try {
        const success = await syncFunction(offlineState.offlineQueue[i])
        results.push({ index: i, success })
        if (success) {
          successfulItems.push(i)
        }
      } catch (error) {
        results.push({ index: i, success: false, error })
      }
    }

    // Remove successfully synced items
    successfulItems.reverse().forEach(index => {
      removeFromQueue(index)
    })

    return {
      success: true,
      results,
      syncedCount: successfulItems.length,
      remainingCount: offlineState.offlineQueue.length - successfulItems.length
    }
  }

  return {
    ...offlineState,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueueSize,
    getQueueItems,
    syncQueue
  }
}
