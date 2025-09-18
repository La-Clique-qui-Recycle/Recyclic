---
story_id: email.observability
epic_id: auth-refactoring
title: "Observabilité des envois d’emails (métriques & logs)"
status: Done
parent: tech-debt.email
---

### User Story

En tant qu’équipe d’exploitation,
Je veux des métriques et logs structurés pour les envois d’emails,
Afin de diagnostiquer rapidement les incidents et suivre la fiabilité.

### Critères d'Acceptation

1. Compteurs exposés: `emails_sent_total`, `emails_failed_total`.
2. Latences mesurées et exportables: `email_send_latency_ms` (min/p50/p95).
3. Logs structurés sur succès/erreur incluant `message_id`, `to_email`, `elapsed_ms`, `provider`.
4. Optionnel: export Prometheus et dashboard minimal.

### Tâches

- Instrumenter `recyclic_api/core/email_service.py` (timers/compteurs).
- Ajouter logs structurés côté succès/erreurs.
- (Optionnel) Intégrer exporter Prometheus + dashboard.
- Écrire tests unitaires couvrant métriques et logs (mocks).

### Notes

Estimation: S (~0.5 j) à M (~1 j avec Prometheus+dashboard)

---

### QA Results

Gate: PASS

Raisons:
- Instrumentation et logs conformes; tests unitaires couvrent succès/erreurs.
- Aucun impact négatif sur perfs; code clair et maintenable.

Evidence:
- Compteurs/latences exposés et vérifiés via tests.
- Logs structurés présents.

Reviewer: Quinn
Date: 2025-09-17

---

## Dev Agent Record

### Tasks
- [x] Créer le système de métriques email (`email_metrics.py`)
- [x] Enrichir le service email avec timing et métriques
- [x] Créer les endpoints de métriques dans monitoring
- [x] Écrire tests unitaires complets

### File List
- `api/src/recyclic_api/utils/email_metrics.py` - Système de collecte de métriques
- `api/src/recyclic_api/core/email_service.py` - Service enrichi avec métriques et timing
- `api/src/recyclic_api/api/api_v1/endpoints/monitoring.py` - Endpoints de métriques
- `api/tests/test_email_metrics.py` - Tests du système de métriques (10 tests)
- `api/tests/test_email_service.py` - Tests enrichis du service email (10 tests)

### Completion Notes
- **Métriques implémentées :**
  - `emails_sent_total` par provider et status
  - `emails_failed_total` par provider et error_type
  - `email_send_latency_ms` avec min/max/avg/p50/p95
  - Support Prometheus avec endpoint dédié

- **Logs structurés :**
  - INFO pour succès : message_id, to_email, elapsed_ms, provider
  - ERROR pour échecs : error_type, error_detail, elapsed_ms, provider

- **Endpoints créés :**
  - `GET /api/v1/monitoring/email/metrics` - Métriques JSON
  - `GET /api/v1/monitoring/email/metrics/prometheus` - Format Prometheus
  - `POST /api/v1/monitoring/email/metrics/reset` - Reset (pour tests)

- **Fonctionnalités avancées :**
  - Collecteur thread-safe avec gestion de l'historique
  - Filtrage temporel flexible (1-168 heures)
  - Métriques de latence avec percentiles
  - Breakdown par provider et type d'erreur

### Change Log
- 2025-09-17: Implémentation complète de l'observabilité email

### Status
Completed

