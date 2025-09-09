# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there - `import { User, Sale } from '@recyclic/shared'`
- **API Calls:** Never make direct HTTP calls - use the service layer - `await cashService.createSale()` not `axios.post()`
- **Environment Variables:** Access only through config objects, never process.env directly - Use config.apiUrl not process.env.VITE_API_URL
- **Error Handling:** All API routes must use the standard error handler - FastAPI HTTPException with proper status codes
- **State Updates:** Never mutate state directly - use proper state management patterns - Zustand set() function or React setState
- **Database Access:** Always use Repository pattern - Never direct SQLAlchemy queries in controllers
- **Authentication:** Check permissions at route level - Use Depends(get_current_user) on every protected route
- **Offline First:** All critical actions must work offline - Cache in IndexedDB and sync later
- **Validation:** Validate on both frontend and backend - Pydantic schemas + frontend form validation

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `CategorySelector.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts`, `useCashSession.ts` |
| Services | camelCase | snake_case | `cashService.ts`, `ai_service.py` |
| API Routes | - | kebab-case | `/api/v1/cash-sessions` |
| Database Tables | - | snake_case | `cash_sessions`, `user_profiles` |
| Store Actions | camelCase | - | `openSession`, `addSaleItem` |
| Environment Variables | SCREAMING_SNAKE | SCREAMING_SNAKE | `VITE_API_URL`, `DATABASE_URL` |

---
