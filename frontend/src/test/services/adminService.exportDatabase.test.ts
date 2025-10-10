/**
 * Tests pour la méthode exportDatabase du service admin
 * Story B11-P2 - Export Manuel de la Base de Données
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { adminService } from '../../services/adminService'
import axiosClient from '../../api/axiosClient'

// Mock axiosClient
vi.mock('../../api/axiosClient')

describe('adminService.exportDatabase', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Mock DOM methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock createElement and document.body
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as any

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)

    // Mock window.alert
    global.alert = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should successfully download database export file', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {
        'content-disposition': 'attachment; filename=recyclic_db_export_20250101_120000.sql'
      }
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(axiosClient.post).toHaveBeenCalledWith(
      '/admin/db/export',
      {},
      {
        responseType: 'blob',
        timeout: 300000
      }
    )

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should use default filename when content-disposition header is missing', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {}
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    const mockLink = { click: vi.fn(), href: '', download: '' } as any
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(mockLink.download).toBe('recyclic_db_export.sql')
  })

  it('should extract filename from content-disposition header', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {
        'content-disposition': 'attachment; filename="custom_export_20250101.sql"'
      }
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    const mockLink = { click: vi.fn(), href: '', download: '' } as any
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(mockLink.download).toBe('custom_export_20250101.sql')
  })

  it('should handle network errors gracefully', async () => {
    // Arrange
    const networkError = new Error('Network error')
    vi.mocked(axiosClient.post).mockRejectedValue(networkError)

    // Act & Assert
    await expect(adminService.exportDatabase()).rejects.toThrow('Network error')
  })

  it('should handle timeout errors', async () => {
    // Arrange
    const timeoutError = new Error('timeout of 300000ms exceeded')
    vi.mocked(axiosClient.post).mockRejectedValue(timeoutError)

    // Act & Assert
    await expect(adminService.exportDatabase()).rejects.toThrow('timeout')
  })

  it('should handle server errors (500)', async () => {
    // Arrange
    const serverError = {
      response: {
        status: 500,
        data: { detail: 'Database export failed' }
      }
    }
    vi.mocked(axiosClient.post).mockRejectedValue(serverError)

    // Act & Assert
    await expect(adminService.exportDatabase()).rejects.toMatchObject({
      response: {
        status: 500
      }
    })
  })

  it('should handle permission errors (403)', async () => {
    // Arrange
    const permissionError = {
      response: {
        status: 403,
        data: { detail: 'Accès refusé - rôle super-administrateur requis' }
      }
    }
    vi.mocked(axiosClient.post).mockRejectedValue(permissionError)

    // Act & Assert
    await expect(adminService.exportDatabase()).rejects.toMatchObject({
      response: {
        status: 403
      }
    })
  })

  it('should create blob with correct MIME type', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {}
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    // Spy on Blob constructor
    const blobSpy = vi.spyOn(global, 'Blob')

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(blobSpy).toHaveBeenCalledWith(
      [mockBlob],
      { type: 'application/sql' }
    )
  })

  it('should cleanup DOM elements after download', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {}
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(document.body.removeChild).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('should trigger download by clicking the link', async () => {
    // Arrange
    const mockBlob = new Blob(['SQL content'], { type: 'application/sql' })
    const mockResponse = {
      data: mockBlob,
      headers: {}
    }

    vi.mocked(axiosClient.post).mockResolvedValue(mockResponse)

    const mockLink = { click: vi.fn(), href: '', download: '' } as any
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)

    // Act
    await adminService.exportDatabase()

    // Assert
    expect(mockLink.click).toHaveBeenCalled()
  })
})
