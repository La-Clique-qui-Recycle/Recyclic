import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import Button from '../../../components/ui/Button'

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should render with primary variant by default', () => {
    render(<Button>Primary Button</Button>)
    
    const button = screen.getByRole('button', { name: /primary button/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle('background: #2c5530')
  })

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    
    const button = screen.getByRole('button', { name: /secondary button/i })
    expect(button).toHaveStyle('background: #6c757d')
  })

  it('should render with danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>)
    
    const button = screen.getByRole('button', { name: /danger button/i })
    expect(button).toHaveStyle('background: #dc3545')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="small">Small Button</Button>)
    let button = screen.getByRole('button', { name: /small button/i })
    expect(button).toHaveStyle('padding: 8px 16px')
    expect(button).toHaveStyle('font-size: 14px')

    rerender(<Button size="large">Large Button</Button>)
    button = screen.getByRole('button', { name: /large button/i })
    expect(button).toHaveStyle('padding: 16px 32px')
    expect(button).toHaveStyle('font-size: 18px')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
    expect(button).toHaveStyle('background: #ccc')
  })

  it('should show loading spinner when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>)
    
    const button = screen.getByRole('button', { name: /loading button/i })
    expect(button).toBeDisabled()
    // Le spinner est un div avec animation, on vérifie sa présence
    expect(button.querySelector('div')).toBeInTheDocument()
  })

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    
    const button = screen.getByRole('button', { name: /clickable button/i })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
    
    const button = screen.getByRole('button', { name: /disabled button/i })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    const button = screen.getByRole('button', { name: /loading button/i })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should have proper focus styles', () => {
    render(<Button>Focusable Button</Button>)
    
    const button = screen.getByRole('button', { name: /focusable button/i })
    button.focus()
    
    expect(button).toHaveFocus()
  })

  it('should accept additional props', () => {
    render(<Button data-testid="custom-button" type="submit">Submit Button</Button>)
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
