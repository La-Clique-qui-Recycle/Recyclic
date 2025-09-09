import React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger'; size?: 'small' | 'medium' | 'large' }>`
  background: ${props => {
    switch (props.variant) {
      case 'secondary': return '#6c757d'
      case 'danger': return '#dc3545'
      default: return '#2c5530'
    }
  }};
  color: white;
  padding: ${props => {
    switch (props.size) {
      case 'small': return '8px 16px'
      case 'large': return '16px 32px'
      default: return '12px 24px'
    }
  }};
  border: none;
  border-radius: 4px;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px'
      case 'large': return '18px'
      default: return '16px'
    }
  }};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background: ${props => {
      switch (props.variant) {
        case 'secondary': return '#5a6268'
        case 'danger': return '#c82333'
        default: return '#1e3a21'
      }
    }};
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
  
  &:focus {
    outline: 2px solid #2c5530;
    outline-offset: 2px;
  }
`

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: React.ReactNode
}

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'medium', 
  loading = false, 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </StyledButton>
  )
}

export default Button
