import React from 'react'
import styled from 'styled-components'

const CategoryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`

const CategoryButton = styled.button<{ $selected?: boolean }>`
  padding: 1rem;
  border: 2px solid ${props => props.$selected ? '#2c5530' : '#ddd'};
  background: ${props => props.$selected ? '#e8f5e8' : 'white'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #2c5530;
    background: #f0f8f0;
  }
`

const CategoryName = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`

const CategoryDescription = styled.div`
  font-size: 0.9rem;
  color: #666;
`

interface CategorySelectorProps {
  onSelect: (category: string) => void
  selectedCategory?: string
}

const EEE_CATEGORIES = [
  { id: 'EEE-1', name: 'EEE-1', description: 'Gros électroménager' },
  { id: 'EEE-2', name: 'EEE-2', description: 'Petit électroménager' },
  { id: 'EEE-3', name: 'EEE-3', description: 'Informatique et télécommunications' },
  { id: 'EEE-4', name: 'EEE-4', description: 'Matériel grand public' },
  { id: 'EEE-5', name: 'EEE-5', description: 'Éclairage' },
  { id: 'EEE-6', name: 'EEE-6', description: 'Outils électriques et électroniques' },
  { id: 'EEE-7', name: 'EEE-7', description: 'Jouets et équipements de loisir' },
  { id: 'EEE-8', name: 'EEE-8', description: 'Dispositifs médicaux' }
]

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  onSelect, 
  selectedCategory 
}) => {
  return (
    <CategoryContainer>
      {EEE_CATEGORIES.map((category) => (
        <CategoryButton
          key={category.id}
          $selected={selectedCategory === category.id}
          onClick={() => onSelect(category.id)}
          data-testid={`category-${category.id}`}
        >
          <CategoryName>{category.name}</CategoryName>
          <CategoryDescription>{category.description}</CategoryDescription>
        </CategoryButton>
      ))}
    </CategoryContainer>
  )
}

export default CategorySelector
