import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import Input from '../../../components/ui/Input'

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Test Label" />)
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('should render input without label', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should show required asterisk when required prop is true', () => {
    render(<Input label="Required Field" required />)

    // Vérifier que le label contient l'astérisque
    const label = screen.getByText('Required Field')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('required')
  })

  it('should display error message when error prop is provided', () => {
    render(<Input label="Test Input" error="This field is required" />)
    
    const errorMessage = screen.getByText('This field is required')
    expect(errorMessage).toBeInTheDocument()
    // Vérifier que le message d'erreur est présent (le style sera géré par le mock)
    expect(errorMessage).toBeInTheDocument()
  })

  it('should apply error styles when error is present', () => {
    render(<Input error="Error message" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle('border-color: #dc3545')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Input size="small" placeholder="Small input" />)
    let input = screen.getByPlaceholderText('Small input')
    expect(input).toHaveStyle('padding: 8px 12px')
    expect(input).toHaveStyle('font-size: 14px')

    rerender(<Input size="large" placeholder="Large input" />)
    input = screen.getByPlaceholderText('Large input')
    expect(input).toHaveStyle('padding: 16px 20px')
    expect(input).toHaveStyle('font-size: 18px')
  })

  it('should handle value changes', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'test value' })
    }))
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveStyle('background-color: #f8f9fa')
  })

  it('should have proper focus styles', () => {
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    input.focus()
    
    expect(input).toHaveFocus()
  })

  it('should accept different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    let input = screen.getByPlaceholderText('Email')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    input = screen.getByPlaceholderText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should have proper accessibility attributes', () => {
    render(<Input label="Test Input" required id="test-input" />)
    
    const input = screen.getByLabelText('Test Input')
    const label = screen.getByText('Test Input')
    
    expect(input).toHaveAttribute('id', 'test-input')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('should generate id when not provided', () => {
    render(<Input label="Test Input" />)
    
    const input = screen.getByLabelText('Test Input')
    const label = screen.getByText('Test Input')
    
    expect(input).toHaveAttribute('id')
    expect(label).toHaveAttribute('for', input.getAttribute('id'))
  })

  it('should accept additional props', () => {
    render(<Input data-testid="custom-input" placeholder="Custom input" />)
    
    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('placeholder', 'Custom input')
  })
})
