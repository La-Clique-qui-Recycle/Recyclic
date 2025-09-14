# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- XSS Prevention: React built-in + sanitization des inputs utilisateur
- Secure Storage: JWT dans httpOnly cookies, données sensibles chiffrées

**Backend Security:**
- Input Validation: Pydantic schemas + validation métier custom
- Rate Limiting: 100 req/min par IP, 1000 req/min authentifié
- CORS Policy: Origins autorisés uniquement, credentials=true

**Authentication Security:**
- Token Storage: JWT httpOnly cookies + CSRF protection
- Session Management: Redis sessions avec TTL, logout sur tous devices
- Password Policy: N/A (auth Telegram uniquement)

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB gzipped total
- Loading Strategy: Code splitting par routes, lazy loading composants lourds
- Caching Strategy: Service Worker cache API calls, static assets CDN

**Backend Performance:**
- Response Time Target: <200ms API, <3s classification IA
- Database Optimization: Index sur colonnes searchées, connection pooling
- Caching Strategy: Redis cache pour sessions + données référentielles

---
