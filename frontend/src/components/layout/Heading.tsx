import React from 'react';
import styled from 'styled-components';

/**
 * Système de composants de titres standardisés
 * 
 * Respecte la hiérarchie sémantique :
 * - PageTitle (h1) : Titre principal de la page
 * - SectionTitle (h2) : Titre de section
 * - SubsectionTitle (h3) : Titre de sous-section
 * - CardTitle (h4) : Titre de carte
 */

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  /** ID pour l'accessibilité */
  id?: string;
}

/**
 * Titre principal de page (h1)
 * Utilisé une seule fois par page
 */
export const PageTitle = styled.h1<HeadingProps>`
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
 * Titre de section (h2)
 * Utilisé pour les sections principales de la page
 */
export const SectionTitle = styled.h2<HeadingProps>`
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
 * Titre de sous-section (h3)
 * Utilisé pour les sous-sections
 */
export const SubsectionTitle = styled.h3<HeadingProps>`
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
 * Titre de carte (h4)
 * Utilisé pour les titres de cartes ou de composants
 */
export const CardTitle = styled.h4<HeadingProps>`
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
`;

/**
 * Composant Heading avec validation de hiérarchie
 * Assure la cohérence sémantique des titres
 */
interface HeadingComponentProps extends HeadingProps {
  level: 1 | 2 | 3 | 4;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

const HeadingComponent: React.FC<HeadingComponentProps> = ({ 
  level, 
  as, 
  children, 
  ...props 
}) => {
  const Component = as || `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Component {...props}>
      {children}
    </Component>
  );
};

export default HeadingComponent;
