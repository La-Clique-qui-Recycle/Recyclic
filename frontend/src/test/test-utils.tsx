import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'

// Mock providers wrapper avec MemoryRouter et MantineProvider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const theme = {
    primaryColor: 'blue',
    colors: {
      blue: ['#e7f3ff', '#b3d9ff', '#80bfff', '#4da6ff', '#1a8cff', '#0073e6', '#0066cc', '#0059b3', '#004d99', '#004080']
    },
    spacing: {
      xs: 4, sm: 8, md: 16, lg: 24, xl: 32
    },
    fontSizes: {
      xs: 12, sm: 14, md: 16, lg: 18, xl: 20
    }
  };

  return (
    <MemoryRouter initialEntries={['/']}>
      <MantineProvider theme={theme}>
        {children}
      </MantineProvider>
    </MemoryRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Utilitaire pour tester avec des routes spécifiques
export const renderWithRouter = (ui: React.ReactElement, route = '/') =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)

// Mock data factories
export const mockUser = {
  id: 1,
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone: '+33123456789',
  site_id: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
}

export const mockSite = {
  id: 1,
  name: 'Ressourcerie Test',
  address: '123 Test Street',
  city: 'Test City',
  postal_code: '12345',
  phone: '+33123456789',
  email: 'test@ressourcerie.com',
  is_active: true
}

export const mockSites = [
  mockSite,
  {
    id: 2,
    name: 'Ressourcerie Test 2',
    address: '456 Test Avenue',
    city: 'Test City 2',
    postal_code: '54321',
    phone: '+33987654321',
    email: 'test2@ressourcerie.com',
    is_active: true
  }
]

export const mockRegistrationData = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone: '+33123456789',
  site_id: '1',
  notes: 'Test notes'
}

// Mock API responses
export const mockApiResponses = {
  sites: {
    data: mockSites,
    status: 200
  },
  registrationSuccess: {
    data: { message: 'Registration request created successfully' },
    status: 201
  },
  registrationError: {
    response: {
      data: { detail: 'Validation error' },
      status: 400
    }
  }
}

// Test simple pour vérifier MantineProvider
export const TestComponent = () => {
  return <div data-testid="test-component">Test Component</div>;
};

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
