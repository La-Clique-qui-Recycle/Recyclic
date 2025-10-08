import React from 'react';
import styled from 'styled-components';

/**
 * Composant de layout standardisé pour toutes les pages
 * 
 * Fournit :
 * - Layout pleine largeur (bord perdu)
 * - Système d'espacement cohérent
 * - Support responsive
 * - Hiérarchie des titres standardisée
 */

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Mode spécial pour les pages kiosque (pas de padding) */
  isKioskMode?: boolean;
  /** Mode spécial pour les pages admin (padding minimal) */
  isAdminMode?: boolean;
}

const PageContainer = styled.div<{ $isKioskMode?: boolean; $isAdminMode?: boolean }>`
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding: ${props => {
    if (props.$isKioskMode) return '0';
    if (props.$isAdminMode) return '16px';
    return '24px';
  }};
  margin: 0;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: ${props => {
      if (props.$isKioskMode) return '0';
      if (props.$isAdminMode) return '12px';
      return '16px';
    }};
  }
`;

const PageContent = styled.div`
  width: 100%;
  max-width: none;
  margin: 0 auto;
`;

/**
 * Composant de titre principal (h1) standardisé
 */
export const PageTitle = styled.h1`
  margin: 0 0 24px 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
`;

/**
 * Composant de titre de section (h2) standardisé
 */
export const SectionTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #374151;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }
`;

/**
 * Composant de sous-titre (h3) standardisé
 */
export const SubsectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #4b5563;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 8px;
  }
`;

/**
 * Container pour les sections avec espacement standardisé
 */
export const PageSection = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

/**
 * Container pour les cartes avec espacement standardisé
 */
export const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 16px;
  }
`;

/**
 * Container pour les grilles avec espacement standardisé
 * @param columns - Nombre de colonnes (optionnel)
 * @param gap - Espacement entre les éléments (optionnel)
 */
export const Grid = styled.div<{ columns?: number; gap?: string }>`
  display: grid;
  grid-template-columns: ${props => 
    props.columns ? `repeat(${props.columns}, 1fr)` : 'repeat(auto-fit, minmax(250px, 1fr))'
  };
  gap: ${props => props.gap || '24px'};
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
`;

/**
 * Container pour les boutons avec espacement standardisé
 * Supporte le responsive design et l'alignement flexible
 */
export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 16px;
  }
`;

/**
 * Container pour les filtres avec espacement standardisé
 * Optimisé pour l'alignement des contrôles de formulaire
 */
export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  align-items: end;
  
  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className, 
  isKioskMode = false, 
  isAdminMode = false 
}) => {
  return (
    <PageContainer 
      className={className}
      $isKioskMode={isKioskMode}
      $isAdminMode={isAdminMode}
    >
      <PageContent>
        {children}
      </PageContent>
    </PageContainer>
  );
};

export default PageLayout;
