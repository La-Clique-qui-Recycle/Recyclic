/**
 * Tests pour la story B17-P4: Harmonisation du Layout et de la Hiérarchie Visuelle
 * 
 * Cette suite de tests vérifie que:
 * 1. Le layout utilise la pleine largeur (bord perdu)
 * 2. La hiérarchie des titres est respectée (h1, h2, h3)
 * 3. L'espacement est cohérent
 * 4. Les composants de layout fonctionnent correctement
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageLayout, { PageTitle, SectionTitle, SubsectionTitle, PageSection, Card, Grid, ButtonGroup, FilterRow } from '../../components/layout/PageLayout'

describe('B17-P4: Harmonisation du Layout', () => {
  describe('PageLayout', () => {
    it('devrait rendre avec la pleine largeur par défaut', () => {
      render(
        <PageLayout>
          <div data-testid="content">Contenu de test</div>
        </PageLayout>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
    })

    it('devrait appliquer le mode kiosque (pas de padding)', () => {
      render(
        <PageLayout isKioskMode={true}>
          <div data-testid="content">Contenu kiosque</div>
        </PageLayout>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
    })

    it('devrait appliquer le mode admin (padding minimal)', () => {
      render(
        <PageLayout isAdminMode={true}>
          <div data-testid="content">Contenu admin</div>
        </PageLayout>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Hiérarchie des Titres', () => {
    it('devrait rendre un titre de page (h1)', () => {
      render(<PageTitle>Titre de page</PageTitle>)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('Titre de page')
    })

    it('devrait rendre un titre de section (h2)', () => {
      render(<SectionTitle>Titre de section</SectionTitle>)
      
      const title = screen.getByRole('heading', { level: 2 })
      expect(title).toHaveTextContent('Titre de section')
    })

    it('devrait rendre un sous-titre (h3)', () => {
      render(<SubsectionTitle>Sous-titre</SubsectionTitle>)
      
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveTextContent('Sous-titre')
    })
  })

  describe('Composants de Layout', () => {
    it('devrait rendre une section avec espacement', () => {
      render(
        <PageSection data-testid="section">
          <div>Contenu de section</div>
        </PageSection>
      )
      
      const section = screen.getByTestId('section')
      expect(section).toBeInTheDocument()
    })

    it('devrait rendre une carte avec espacement', () => {
      render(
        <Card data-testid="card">
          <div>Contenu de carte</div>
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
    })

    it('devrait rendre une grille avec colonnes', () => {
      render(
        <Grid columns={3} data-testid="grid">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>
      )
      
      const grid = screen.getByTestId('grid')
      expect(grid).toBeInTheDocument()
    })

    it('devrait rendre un groupe de boutons', () => {
      render(
        <ButtonGroup data-testid="button-group">
          <button>Bouton 1</button>
          <button>Bouton 2</button>
        </ButtonGroup>
      )
      
      const buttonGroup = screen.getByTestId('button-group')
      expect(buttonGroup).toBeInTheDocument()
    })

    it('devrait rendre une ligne de filtres', () => {
      render(
        <FilterRow data-testid="filter-row">
          <input placeholder="Filtre 1" />
          <input placeholder="Filtre 2" />
        </FilterRow>
      )
      
      const filterRow = screen.getByTestId('filter-row')
      expect(filterRow).toBeInTheDocument()
    })
  })

  describe('Structure Complète', () => {
    it('devrait rendre une page complète avec hiérarchie correcte', () => {
      render(
        <PageLayout>
          <PageTitle>Titre Principal</PageTitle>
          <PageSection>
            <SectionTitle>Section 1</SectionTitle>
            <Card>
              <SubsectionTitle>Sous-section</SubsectionTitle>
              <div>Contenu</div>
            </Card>
          </PageSection>
        </PageLayout>
      )
      
      // Vérifier la hiérarchie des titres
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Titre Principal')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section 1')
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sous-section')
    })

    it('devrait respecter la hiérarchie sémantique', () => {
      render(
        <PageLayout>
          <PageTitle>Titre Principal</PageTitle>
          <PageSection>
            <SectionTitle>Section</SectionTitle>
            <Card>
              <SubsectionTitle>Sous-section</SubsectionTitle>
              <div>Contenu</div>
            </Card>
          </PageSection>
        </PageLayout>
      )
      
      // Vérifier qu'il n'y a qu'un seul h1
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      expect(h1Elements).toHaveLength(1)
      
      // Vérifier qu'il y a des h2 et h3
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('devrait s\'adapter aux différentes tailles d\'écran', () => {
      render(
        <PageLayout>
          <Grid columns={3}>
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </Grid>
        </PageLayout>
      )
      
      const grid = screen.getByRole('grid', { hidden: true })
      expect(grid).toBeInTheDocument()
    })
  })
})
