import React from 'react';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';

const BreadcrumbContainer = styled.div`
  background: #f8f9fa;
  border: 2px solid #2c5530;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BreadcrumbTitle = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BreadcrumbPath = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1rem;
`;

const BreadcrumbItem = styled.span`
  color: #2c5530;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const BreadcrumbSeparator = styled.span`
  color: #6c757d;
  display: flex;
  align-items: center;
`;

const EmptyState = styled.span`
  color: #adb5bd;
  font-style: italic;
`;

export interface StagingItemData {
  categoryName?: string;
  subcategoryName?: string;
  quantity?: number;
  weight?: number;
  price?: number;
}

export interface StagingItemProps {
  data: StagingItemData;
}

/**
 * StagingItem Component (Wizard Breadcrumb)
 *
 * Displays a summary of the item being entered in the sale wizard.
 * Updates at each step to show the information already entered.
 *
 * @param data - The current staging item data (category, quantity, weight, price)
 */
export const StagingItem: React.FC<StagingItemProps> = ({ data }) => {
  const { categoryName, subcategoryName, quantity, weight, price } = data;

  // Build the breadcrumb path
  const breadcrumbParts: string[] = [];

  if (categoryName) {
    breadcrumbParts.push(categoryName);
  }

  if (subcategoryName) {
    breadcrumbParts.push(subcategoryName);
  }

  if (quantity !== undefined && quantity > 0) {
    breadcrumbParts.push(`Qté: ${quantity}`);
  }

  if (weight !== undefined && weight > 0) {
    breadcrumbParts.push(`Poids: ${weight.toFixed(2)} kg`);
  }

  if (price !== undefined && price > 0) {
    breadcrumbParts.push(`Prix: ${price.toFixed(2)} €`);
  }

  return (
    <BreadcrumbContainer data-testid="staging-item">
      <BreadcrumbTitle>Article en cours de saisie</BreadcrumbTitle>
      <BreadcrumbPath>
        {breadcrumbParts.length === 0 ? (
          <EmptyState data-testid="staging-item-empty">Aucune information saisie</EmptyState>
        ) : (
          breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight size={16} />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem data-testid={`staging-item-part-${index}`}>
                {part}
              </BreadcrumbItem>
            </React.Fragment>
          ))
        )}
      </BreadcrumbPath>
    </BreadcrumbContainer>
  );
};

export default StagingItem;
