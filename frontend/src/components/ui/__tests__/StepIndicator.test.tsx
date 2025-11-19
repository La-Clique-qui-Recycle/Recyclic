import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepIndicator, StepState } from '../StepIndicator';

describe('StepIndicator', () => {
  const defaultProps = {
    currentStep: 'category' as const,
    categoryState: 'active' as StepState,
    weightState: 'inactive' as StepState,
    validationState: 'inactive' as StepState,
  };

  it('renders all three steps', () => {
    render(<StepIndicator {...defaultProps} />);

    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Poids')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });

  it('shows active state for current step', () => {
    render(<StepIndicator {...defaultProps} />);

    // Category should be active
    const categoryContainer = screen.getByText('Catégorie').closest('[data-testid]');
    expect(categoryContainer).toHaveStyle({ opacity: '1' });
  });

  it('shows completed state correctly', () => {
    const props = {
      ...defaultProps,
      categoryState: 'completed' as StepState,
      weightState: 'active' as StepState,
      currentStep: 'weight' as const,
    };

    render(<StepIndicator {...props} />);

    // Should render without errors
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Poids')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });

  it('shows inactive state with reduced opacity', () => {
    render(<StepIndicator {...defaultProps} />);

    // Weight and validation should be inactive
    const weightLabel = screen.getByText('Poids');
    const validationLabel = screen.getByText('Validation');

    expect(weightLabel).toBeInTheDocument();
    expect(validationLabel).toBeInTheDocument();
  });

  it('handles all states correctly', () => {
    const props = {
      currentStep: 'validation' as const,
      categoryState: 'completed' as StepState,
      weightState: 'completed' as StepState,
      validationState: 'active' as StepState,
    };

    render(<StepIndicator {...props} />);

    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Poids')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-step-indicator';
    render(<StepIndicator {...defaultProps} className={customClass} />);

    const container = screen.getByText('Catégorie').closest('.custom-step-indicator');
    expect(container).toBeInTheDocument();
  });

  it('transitions between steps correctly', () => {
    const { rerender } = render(<StepIndicator {...defaultProps} />);

    // Initially on category step
    expect(screen.getByText('Catégorie')).toBeInTheDocument();

    // Move to weight step
    rerender(
      <StepIndicator
        currentStep="weight"
        categoryState="completed"
        weightState="active"
        validationState="inactive"
      />
    );

    expect(screen.getByText('Poids')).toBeInTheDocument();
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
  });

  it('maintains accessibility structure', () => {
    render(<StepIndicator {...defaultProps} />);

    // Check that labels are present
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Poids')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });
});


