import React from 'react'
import styled from 'styled-components'

const StyledInput = styled.input<{ error?: boolean; size?: 'small' | 'medium' | 'large' }>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return '8px 12px'
      case 'large': return '16px 20px'
      default: return '12px 16px'
    }
  }};
  border: 2px solid ${props => props.error ? '#dc3545' : '#ddd'};
  border-radius: 4px;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px'
      case 'large': return '18px'
      default: return '16px'
    }
  }};
  width: 100%;
  transition: border-color 0.3s, box-shadow 0.3s;
  
  &:focus {
    outline: none;
    border-color: #2c5530;
    box-shadow: 0 0 0 3px rgba(44, 85, 48, 0.1);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: #6c757d;
  }
`

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

const Label = styled.label<{ required?: boolean }>`
  font-weight: 600;
  color: #333;
  
  ${props => props.required && `
    &::after {
      content: ' *';
      color: #dc3545;
    }
  `}
`

const ErrorMessage = styled.span`
  color: #dc3545;
  font-size: 14px;
  font-weight: 500;
`

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  size?: 'small' | 'medium' | 'large'
  required?: boolean
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  size = 'medium', 
  required = false,
  id,
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <InputContainer>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <StyledInput
        id={inputId}
        size={size}
        error={!!error}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  )
}

export default Input
