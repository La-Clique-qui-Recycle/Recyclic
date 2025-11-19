import React from 'react';
import styled from 'styled-components';
import { Badge, Progress } from '@mantine/core';
import { Check, Circle, Loader } from 'lucide-react';

export type StepState = 'inactive' | 'active' | 'completed';

export interface StepIndicatorProps {
  currentStep: 'category' | 'weight' | 'validation';
  categoryState: StepState;
  weightState: StepState;
  validationState: StepState;
  className?: string;
}

interface StepItemProps {
  state: StepState;
  isActive: boolean;
  label: string;
  stepNumber: number;
}

// Styled components for the step indicator
const StepContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  min-width: fit-content;

  @media (max-width: 768px) {
    padding: 6px 8px;
    gap: 6px;
  }
`;

const StepItemContainer = styled.div<{ state: StepState; isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  opacity: ${props => props.state === 'inactive' ? 0.6 : 1};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    min-width: 50px;
    gap: 2px;
  }
`;

const StepIconContainer = styled.div<{ state: StepState; isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;

  ${props => {
    switch (props.state) {
      case 'completed':
        return `
          background: #2e7d32;
          color: white;
        `;
      case 'active':
        return `
          background: #1976d2;
          color: white;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.3);
        `;
      default:
        return `
          background: #e0e0e0;
          color: #666;
        `;
    }
  }}

  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
  }
`;

const StepLabel = styled.span<{ state: StepState; isActive: boolean }>`
  font-size: 11px;
  font-weight: ${props => props.isActive ? 600 : 500};
  color: ${props => {
    switch (props.state) {
      case 'completed':
        return '#2e7d32';
      case 'active':
        return '#1976d2';
      default:
        return '#666';
    }
  }};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;

  @media (max-width: 768px) {
    font-size: 10px;
    max-width: 50px;
  }
`;

const StepConnector = styled.div<{ state: StepState }>`
  width: 20px;
  height: 2px;
  background: ${props => {
    switch (props.state) {
      case 'completed':
        return '#2e7d32';
      case 'active':
        return '#1976d2';
      default:
        return '#e0e0e0';
    }
  }};
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    width: 15px;
  }
`;

const StepItem: React.FC<StepItemProps> = ({ state, isActive, label, stepNumber }) => {
  const getIcon = () => {
    switch (state) {
      case 'completed':
        return <Check size={12} />;
      case 'active':
        return <Circle size={12} fill="currentColor" />;
      default:
        return <Circle size={12} />;
    }
  };

  return (
    <StepItemContainer state={state} isActive={isActive}>
      <StepIconContainer state={state} isActive={isActive}>
        {getIcon()}
      </StepIconContainer>
      <StepLabel state={state} isActive={isActive}>
        {label}
      </StepLabel>
    </StepItemContainer>
  );
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  categoryState,
  weightState,
  validationState,
  className
}) => {
  const steps = [
    { key: 'category', label: 'Catégorie', state: categoryState },
    { key: 'weight', label: 'Poids', state: weightState },
    { key: 'validation', label: 'Validation', state: validationState }
  ];

  return (
    <StepContainer className={className}>
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <StepItem
            state={step.state}
            isActive={currentStep === step.key}
            label={step.label}
            stepNumber={index + 1}
          />
          {index < steps.length - 1 && (
            <StepConnector state={step.state} />
          )}
        </React.Fragment>
      ))}
    </StepContainer>
  );
};

export default StepIndicator;


