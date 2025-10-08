import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StagingItem } from './StagingItem';

describe('StagingItem', () => {
  it('should render empty state when no data is provided', () => {
    render(<StagingItem data={{}} />);

    expect(screen.getByTestId('staging-item')).toBeInTheDocument();
    expect(screen.getByTestId('staging-item-empty')).toBeInTheDocument();
    expect(screen.getByText('Aucune information saisie')).toBeInTheDocument();
  });

  it('should display category name when provided', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Informatique',
        }}
      />
    );

    expect(screen.getByTestId('staging-item')).toBeInTheDocument();
    expect(screen.queryByTestId('staging-item-empty')).not.toBeInTheDocument();
    expect(screen.getByText('Informatique')).toBeInTheDocument();
  });

  it('should display category and subcategory with separator', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Électronique',
          subcategoryName: 'Ordinateurs',
        }}
      />
    );

    expect(screen.getByText('Électronique')).toBeInTheDocument();
    expect(screen.getByText('Ordinateurs')).toBeInTheDocument();
    // Check for ChevronRight separator (2 parts = 1 separator)
    const parts = screen.getAllByTestId(/staging-item-part-/);
    expect(parts).toHaveLength(2);
  });

  it('should display quantity when provided', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Mobilier',
          quantity: 3,
        }}
      />
    );

    expect(screen.getByText('Mobilier')).toBeInTheDocument();
    expect(screen.getByText('Qté: 3')).toBeInTheDocument();
  });

  it('should display weight with correct formatting', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Textile',
          quantity: 2,
          weight: 1.5,
        }}
      />
    );

    expect(screen.getByText('Textile')).toBeInTheDocument();
    expect(screen.getByText('Qté: 2')).toBeInTheDocument();
    expect(screen.getByText('Poids: 1.50 kg')).toBeInTheDocument();
  });

  it('should display price with correct formatting', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Électroménager',
          quantity: 1,
          weight: 5.25,
          price: 12.99,
        }}
      />
    );

    expect(screen.getByText('Électroménager')).toBeInTheDocument();
    expect(screen.getByText('Qté: 1')).toBeInTheDocument();
    expect(screen.getByText('Poids: 5.25 kg')).toBeInTheDocument();
    expect(screen.getByText('Prix: 12.99 €')).toBeInTheDocument();
  });

  it('should display complete breadcrumb path with all information', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Électronique',
          subcategoryName: 'Téléphones',
          quantity: 5,
          weight: 0.75,
          price: 25.5,
        }}
      />
    );

    expect(screen.getByText('Électronique')).toBeInTheDocument();
    expect(screen.getByText('Téléphones')).toBeInTheDocument();
    expect(screen.getByText('Qté: 5')).toBeInTheDocument();
    expect(screen.getByText('Poids: 0.75 kg')).toBeInTheDocument();
    expect(screen.getByText('Prix: 25.50 €')).toBeInTheDocument();

    // Verify we have 5 breadcrumb parts
    const parts = screen.getAllByTestId(/staging-item-part-/);
    expect(parts).toHaveLength(5);
  });

  it('should not display quantity if it is 0', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          quantity: 0,
        }}
      />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText(/Qté:/)).not.toBeInTheDocument();
  });

  it('should not display weight if it is 0', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          quantity: 1,
          weight: 0,
        }}
      />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Qté: 1')).toBeInTheDocument();
    expect(screen.queryByText(/Poids:/)).not.toBeInTheDocument();
  });

  it('should not display price if it is 0', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          quantity: 1,
          weight: 1.5,
          price: 0,
        }}
      />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Qté: 1')).toBeInTheDocument();
    expect(screen.getByText('Poids: 1.50 kg')).toBeInTheDocument();
    expect(screen.queryByText(/Prix:/)).not.toBeInTheDocument();
  });

  it('should handle undefined values gracefully', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          quantity: undefined,
          weight: undefined,
          price: undefined,
        }}
      />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText(/Qté:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Poids:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Prix:/)).not.toBeInTheDocument();
  });

  it('should format weight with 2 decimal places', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          weight: 1.234567,
        }}
      />
    );

    expect(screen.getByText('Poids: 1.23 kg')).toBeInTheDocument();
  });

  it('should format price with 2 decimal places', () => {
    render(
      <StagingItem
        data={{
          categoryName: 'Test',
          price: 9.999,
        }}
      />
    );

    expect(screen.getByText('Prix: 10.00 €')).toBeInTheDocument();
  });
});
