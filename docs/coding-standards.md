# Coding Standards - Recyclic

**Author:** Sarah (Product Owner)  
**Date:** 2025-09-09  
**Version:** 1.0  
**Status:** Active

---

## Coding Standards & Best Practices

### Code Quality Requirements
- **TypeScript :** Strict mode, no any types sauf cas exceptionnels documentés
- **Python :** Type hints obligatoires, Black formatting, mypy validation
- **Testing :** Coverage >80% pour code métier, >60% pour UI components
- **Documentation :** JSDoc/docstrings pour toutes fonctions publiques

### Architecture Patterns
- **Repository pattern :** Toujours utiliser pour accès données
- **Service layer :** Business logic séparée des controllers
- **Error handling :** Standard ErrorHandler class, logging structuré
- **State management :** Zustand stores, éviter state mutations directes

---

## Technical Debt Management Strategy

### Definition & Classification

**Technical Debt Categories:**
- **Type 1 - Intentional Debt :** Choix conscients MVP (ex: SQLite → PostgreSQL)
- **Type 2 - Unintentional Debt :** Code non-optimal découvert post-implementation  
- **Type 3 - Environmental Debt :** Dependencies obsolètes, security patches
- **Type 4 - Knowledge Debt :** Manque de documentation, knowledge silos

### Tracking & Monitoring

**Technical Debt Register:**
- Fichier `docs/tech-debt-register.md` maintenu par l'équipe
- Items avec priorité (Critical/High/Medium/Low), effort, impact business
- Review hebdomadaire en équipe pour priorisation

**Automated Detection:**
- SonarQube/CodeClimate pour code smells automatiques
- Dependabot pour dependencies obsolètes  
- Documentation coverage dans CI/CD

### Resolution Strategy

**Sprint Allocation Rule:**
- **20% de capacity** minimum dédiée à technical debt chaque sprint
- **1 story de debt** obligatoire par sprint si debt register non-vide
- **Debt paydown** prioritaire sur new features si debt Critical

**Refactoring Guidelines:**
- **Red-Green-Refactor :** Tests pass → Refactor → Tests pass
- **Strangler Fig Pattern :** Replacement progressif legacy code
- **Feature Flags :** Protection pour refactoring majeurs

### Prevention Strategies

**Code Reviews:**
- **Debt assessment :** Chaque PR évaluée pour debt potentielle
- **Documentation requirement :** Architecture decisions documentées
- **Testing requirement :** New code avec tests appropriés

**Architecture Evolution:**
- **Monthly architecture review :** Team review des decisions
- **Spike stories :** Investigation avant implementation complexe
- **Proof of Concept :** Validation avant patterns nouveaux

### Maintenance Windows

**Regular Maintenance:**
- **Weekly :** Dependencies updates, security patches
- **Monthly :** Code quality review, refactoring candidates
- **Quarterly :** Architecture review, major dependencies upgrade

**Debt Prioritization Matrix:**
```
           Impact High    Impact Medium    Impact Low
Effort Low    DO NOW        DO NEXT        MAYBE
Effort Med    DO NEXT       PLAN            LATER
Effort High   PLAN          LATER           NEVER
```

---

## MVP Specific Debt Acknowledgment

### Accepted Technical Debt for MVP

**Database Evolution:**
- **Current :** SQLite pour développement/petits sites
- **Planned :** Migration PostgreSQL automatisée post-MVP
- **Timeline :** Q1 2026
- **Risk :** Low - migration path définie

**AI Provider Dependence:**
- **Current :** Gemini API uniquement  
- **Planned :** Multi-provider architecture (OpenAI, Groq, local)
- **Timeline :** Post-MVP phase 2
- **Risk :** Medium - fallback rules locales en place

**Frontend Architecture:**
- **Current :** Single PWA pour tous devices
- **Planned :** App native mobile possible
- **Timeline :** TBD selon feedback utilisateur
- **Risk :** Low - PWA couvre besoins essentiels

### Post-MVP Debt Resolution Plan

**Phase 2 Priorities:**
1. Multi-provider IA architecture
2. Enhanced testing coverage (E2E scenarios)
3. Performance optimization (caching layers)
4. Security hardening (audit complet)

**Long-term Technical Vision:**
- Microservices architecture evolution
- Multi-tenant architecture
- Advanced monitoring & observability
- Automated deployment pipeline enhancement

---

## Debt Register Template

**Issue ID :** TD-001  
**Category :** Type 2 - Unintentional  
**Priority :** High  
**Description :** Hardcoded EEE categories dans frontend components  
**Impact :** Code duplication, maintenance difficile  
**Effort :** 2 jours  
**Solution :** Shared constants package  
**Status :** Planned Sprint 3  
**Owner :** Frontend team  

---

*📋 Document maintenu par l'équipe développement - Review mensuel obligatoire*