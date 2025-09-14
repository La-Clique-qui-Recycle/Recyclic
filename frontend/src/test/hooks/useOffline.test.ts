import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOffline } from '../../hooks/useOffline'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock window event listeners
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener
})

describe('useOffline Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigator.onLine = true
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with online status', () => {
    navigator.onLine = true
    
    const { result } = renderHook(() => useOffline())
    
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.lastOnline).toBeDefined()
    expect(result.current.offlineQueue).toEqual([])
  })

  it('should initialize with offline status', () => {
    navigator.onLine = false
    
    const { result } = renderHook(() => useOffline())
    
    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
    expect(result.current.lastOnline).toBeNull()
    expect(result.current.offlineQueue).toEqual([])
  })

  it('should register event listeners on mount', () => {
    renderHook(() => useOffline())
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should unregister event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOffline())
    
    unmount()
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should handle online event', () => {
    const { result } = renderHook(() => useOffline())
    
    // Simulate going offline first
    act(() => {
      result.current.isOnline = false
      result.current.isOffline = true
    })
    
    // Simulate online event
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )?.[1]
    
    expect(onlineHandler).toBeDefined()
    
    act(() => {
      onlineHandler()
    })
    
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.lastOnline).toBeDefined()
  })

  it('should handle offline event', () => {
    const { result } = renderHook(() => useOffline())
    
    // Simulate offline event
    const offlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'offline'
    )?.[1]
    
    expect(offlineHandler).toBeDefined()
    
    act(() => {
      offlineHandler()
    })
    
    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it('should add items to offline queue', () => {
    const { result } = renderHook(() => useOffline())
    
    const testItem = { action: 'create', data: { id: 1, name: 'Test' } }
    
    act(() => {
      result.current.addToQueue(testItem)
    })
    
    expect(result.current.offlineQueue).toHaveLength(1)
    expect(result.current.offlineQueue[0]).toEqual({
      ...testItem,
      timestamp: expect.any(Date)
    })
  })

  it('should remove items from offline queue', () => {
    const { result } = renderHook(() => useOffline())
    
    const testItems = [
      { action: 'create', data: { id: 1 } },
      { action: 'update', data: { id: 2 } },
      { action: 'delete', data: { id: 3 } }
    ]
    
    // Add items
    act(() => {
      testItems.forEach(item => result.current.addToQueue(item))
    })
    
    expect(result.current.offlineQueue).toHaveLength(3)
    
    // Remove middle item
    act(() => {
      result.current.removeFromQueue(1)
    })
    
    expect(result.current.offlineQueue).toHaveLength(2)
    expect(result.current.offlineQueue[0].action).toBe('create')
    expect(result.current.offlineQueue[1].action).toBe('delete')
  })

  it('should clear offline queue', () => {
    const { result } = renderHook(() => useOffline())
    
    // Add items
    act(() => {
      result.current.addToQueue({ action: 'create', data: { id: 1 } })
      result.current.addToQueue({ action: 'update', data: { id: 2 } })
    })
    
    expect(result.current.offlineQueue).toHaveLength(2)
    
    // Clear queue
    act(() => {
      result.current.clearQueue()
    })
    
    expect(result.current.offlineQueue).toHaveLength(0)
  })

  it('should return correct queue size', () => {
    const { result } = renderHook(() => useOffline())
    
    expect(result.current.getQueueSize()).toBe(0)
    
    act(() => {
      result.current.addToQueue({ action: 'create', data: { id: 1 } })
      result.current.addToQueue({ action: 'update', data: { id: 2 } })
    })
    
    expect(result.current.getQueueSize()).toBe(2)
  })

  it('should return queue items', () => {
    const { result } = renderHook(() => useOffline())
    
    const testItems = [
      { action: 'create', data: { id: 1 } },
      { action: 'update', data: { id: 2 } }
    ]
    
    act(() => {
      testItems.forEach(item => result.current.addToQueue(item))
    })
    
    const queueItems = result.current.getQueueItems()
    expect(queueItems).toHaveLength(2)
    expect(queueItems[0]).toEqual({
      ...testItems[0],
      timestamp: expect.any(Date)
    })
  })

  it('should sync queue with success', async () => {
    const { result } = renderHook(() => useOffline())
    
    const testItem = { action: 'create', data: { id: 1 } }
    const mockSyncFunction = vi.fn().mockResolvedValue(true)
    
    // Add item to queue
    act(() => {
      result.current.addToQueue(testItem)
    })
    
    expect(result.current.getQueueSize()).toBe(1)
    
    // Sync queue
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(mockSyncFunction).toHaveBeenCalledWith({
      ...testItem,
      timestamp: expect.any(Date)
    })
    expect(result.current.getQueueSize()).toBe(0)
  })

  it('should sync queue with failure', async () => {
    const { result } = renderHook(() => useOffline())
    
    const testItem = { action: 'create', data: { id: 1 } }
    const mockSyncFunction = vi.fn().mockResolvedValue(false)
    
    // Add item to queue
    act(() => {
      result.current.addToQueue(testItem)
    })
    
    expect(result.current.getQueueSize()).toBe(1)
    
    // Sync queue
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(mockSyncFunction).toHaveBeenCalledWith({
      ...testItem,
      timestamp: expect.any(Date)
    })
    expect(result.current.getQueueSize()).toBe(1) // Item should remain in queue
  })

  it('should handle sync errors gracefully', async () => {
    const { result } = renderHook(() => useOffline())
    
    const testItem = { action: 'create', data: { id: 1 } }
    const mockSyncFunction = vi.fn().mockRejectedValue(new Error('Sync error'))
    
    // Add item to queue
    act(() => {
      result.current.addToQueue(testItem)
    })
    
    expect(result.current.getQueueSize()).toBe(1)
    
    // Sync queue
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(mockSyncFunction).toHaveBeenCalled()
    expect(result.current.getQueueSize()).toBe(1) // Item should remain in queue
  })

  it('should handle multiple items in sync', async () => {
    const { result } = renderHook(() => useOffline())
    
    const testItems = [
      { action: 'create', data: { id: 1 } },
      { action: 'update', data: { id: 2 } },
      { action: 'delete', data: { id: 3 } }
    ]
    
    const mockSyncFunction = vi.fn()
      .mockResolvedValueOnce(true)  // First item succeeds
      .mockResolvedValueOnce(false) // Second item fails
      .mockResolvedValueOnce(true)  // Third item succeeds
    
    // Add items to queue
    act(() => {
      testItems.forEach(item => result.current.addToQueue(item))
    })
    
    expect(result.current.getQueueSize()).toBe(3)
    
    // Sync queue
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(mockSyncFunction).toHaveBeenCalledTimes(3)
    expect(result.current.getQueueSize()).toBe(1) // Only failed item remains
  })

  it('should maintain queue order during sync', async () => {
    const { result } = renderHook(() => useOffline())
    
    const testItems = [
      { action: 'create', data: { id: 1 } },
      { action: 'update', data: { id: 2 } },
      { action: 'delete', data: { id: 3 } }
    ]
    
    const syncOrder: any[] = []
    const mockSyncFunction = vi.fn().mockImplementation((item) => {
      syncOrder.push(item.action)
      return Promise.resolve(true)
    })
    
    // Add items to queue
    act(() => {
      testItems.forEach(item => result.current.addToQueue(item))
    })
    
    // Sync queue
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(syncOrder).toEqual(['create', 'update', 'delete'])
  })

  it('should handle empty queue sync', async () => {
    const { result } = renderHook(() => useOffline())
    
    const mockSyncFunction = vi.fn()
    
    await act(async () => {
      await result.current.syncQueue(mockSyncFunction)
    })
    
    expect(mockSyncFunction).not.toHaveBeenCalled()
    expect(result.current.getQueueSize()).toBe(0)
  })

  it('should preserve timestamps in queue items', () => {
    const { result } = renderHook(() => useOffline())
    
    const testItem = { action: 'create', data: { id: 1 } }
    const beforeAdd = new Date()
    
    act(() => {
      result.current.addToQueue(testItem)
    })
    
    const afterAdd = new Date()
    const queueItem = result.current.getQueueItems()[0]
    
    expect(queueItem.timestamp).toBeInstanceOf(Date)
    expect(queueItem.timestamp.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime())
    expect(queueItem.timestamp.getTime()).toBeLessThanOrEqual(afterAdd.getTime())
  })
})