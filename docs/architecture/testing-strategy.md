# Testing Strategy

## Testing Pyramid

```
          E2E Tests (Playwright)
         /                    \
    Integration Tests        Integration Tests  
   (Frontend + API)         (API + Database)
  /                \       /                  \
Frontend Unit Tests     Backend Unit Tests
(Vitest + RTL)         (pytest + httpx)
```

## Test Organization

### Frontend Tests

```
apps/web/tests/
├── components/          # Component unit tests
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   └── Input.test.tsx
│   └── business/
│       ├── CategorySelector.test.tsx
│       └── CashRegister.test.tsx
├── pages/              # Page integration tests
│   ├── CashRegister.test.tsx
│   └── Dashboard.test.tsx
├── services/           # Service layer tests
│   ├── api.test.ts
│   ├── auth.test.ts
│   └── sync.test.ts
├── stores/             # State management tests
│   ├── authStore.test.ts
│   └── cashStore.test.ts
└── utils/              # Utility function tests
    ├── formatting.test.ts
    └── validation.test.ts
```

### Backend Tests

```
apps/api/tests/
├── api/                # API endpoint tests
│   ├── test_auth.py
│   ├── test_deposits.py
│   ├── test_sales.py
│   └── test_cash.py
├── services/           # Service layer tests
│   ├── test_ai_service.py
│   ├── test_sync_service.py
│   └── test_export_service.py
├── models/             # Model tests
│   ├── test_user.py
│   ├── test_deposit.py
│   └── test_sale.py
├── conftest.py         # Pytest fixtures
└── factories.py       # Test data factories
```

### E2E Tests

```
tests/e2e/
├── auth.spec.ts        # Authentication flows
├── cash-register.spec.ts # Complete cash workflow
├── deposits.spec.ts    # Telegram bot simulation
├── admin.spec.ts       # Admin dashboard
└── offline.spec.ts     # Offline mode testing
```

## Test Examples

### Frontend Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategorySelector } from '../CategorySelector';

describe('CategorySelector', () => {
  it('should render all EEE categories', () => {
    const onSelect = vi.fn();
    render(<CategorySelector onSelect={onSelect} />);
    
    expect(screen.getByText('EEE-1')).toBeInTheDocument();
    expect(screen.getByText('EEE-2')).toBeInTheDocument();
    // ... test all categories
  });
  
  it('should call onSelect when category clicked', () => {
    const onSelect = vi.fn();
    render(<CategorySelector onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('EEE-3'));
    
    expect(onSelect).toHaveBeenCalledWith('EEE-3');
  });
  
  it('should highlight selected category', () => {
    const onSelect = vi.fn();
    render(<CategorySelector selected="EEE-2" onSelect={onSelect} />);
    
    expect(screen.getByText('EEE-2')).toHaveClass('selected');
  });
});
```

### Backend API Test

```typescript
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories import UserFactory

@pytest.mark.asyncio
async def test_create_sale(
    client: AsyncClient,
    db: AsyncSession,
    authenticated_user: User
):
    # Arrange
    sale_data = {
        "category_eee": "EEE-3",
        "description": "PC portable",
        "quantity": 1,
        "unit_price": 150.00,
        "payment_method": "cash"
    }
    
    # Act
    response = await client.post("/api/v1/sales", json=sale_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["category_eee"] == "EEE-3"
    assert data["total_amount"] == 150.00
    assert data["cashier_id"] == str(authenticated_user.id)

@pytest.mark.asyncio
async def test_create_sale_invalid_category(
    client: AsyncClient,
    authenticated_user: User
):
    # Arrange
    sale_data = {
        "category_eee": "INVALID",
        "description": "Test",
        "quantity": 1,
        "unit_price": 10.00,
        "payment_method": "cash"
    }
    
    # Act
    response = await client.post("/api/v1/sales", json=sale_data)
    
    # Assert
    assert response.status_code == 422
    assert "category_eee" in response.json()["detail"][0]["loc"]
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cash Register Workflow', () => {
  test('should complete full sale process', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=username]', 'testuser');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    
    // Open cash session
    await expect(page).toHaveURL('/cash');
    await page.fill('[data-testid=opening-amount]', '100');
    await page.click('[data-testid=open-session]');
    
    // Add sale item
    await page.click('[data-testid=category-eee-3]');
    await page.fill('[data-testid=quantity]', '1');
    await page.fill('[data-testid=unit-price]', '25.50');
    await page.click('[data-testid=add-to-ticket]');
    
    // Verify ticket
    await expect(page.locator('[data-testid=ticket-total]')).toHaveText('25,50 €');
    
    // Complete sale
    await page.click('[data-testid=payment-cash]');
    await page.click('[data-testid=finalize-sale]');
    
    // Verify success
    await expect(page.locator('[data-testid=sale-success]')).toBeVisible();
  });
  
  test('should work offline', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);
    
    // Perform sale
    await page.goto('/cash');
    // ... same steps as above
    
    // Verify offline indicator
    await expect(page.locator('[data-testid=offline-indicator]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Verify sync
    await expect(page.locator('[data-testid=sync-success]')).toBeVisible();
  });
});
```

---
