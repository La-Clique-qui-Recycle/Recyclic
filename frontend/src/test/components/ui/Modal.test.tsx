import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import Modal from '../../../components/ui/Modal'

// Mock lucide-react X icon
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="close-icon">×</div>
}))

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('should render with title', () => {
    render(<Modal {...defaultProps} title="Test Modal" />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('should render close button when title is provided', () => {
    render(<Modal {...defaultProps} title="Test Modal" />)
    
    expect(screen.getByTestId('close-icon')).toBeInTheDocument()
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} title="Test Modal" onClose={onClose} />)
    
    const closeButton = screen.getByLabelText('Fermer')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const overlay = screen.getByRole('dialog').parentElement
    fireEvent.click(overlay!)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should not call onClose when closeOnOverlayClick is false', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />)
    
    const overlay = screen.getByRole('dialog').parentElement
    fireEvent.click(overlay!)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="small" />)
    let modal = screen.getByRole('dialog')
    expect(modal).toHaveStyle('max-width: 400px')

    rerender(<Modal {...defaultProps} size="large" />)
    modal = screen.getByRole('dialog')
    expect(modal).toHaveStyle('max-width: 800px')
  })

  it('should render footer when provided', () => {
    const footer = <div>Modal footer</div>
    render(<Modal {...defaultProps} footer={footer} />)
    
    expect(screen.getByText('Modal footer')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<Modal {...defaultProps} title="Test Modal" />)
    
    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()
  })

  it('should prevent body scroll when modal is open', () => {
    render(<Modal {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore body scroll when modal is closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(<Modal {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('unset')
  })

  it('should clean up event listeners on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<Modal {...defaultProps} onClose={onClose} />)
    
    unmount()
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
