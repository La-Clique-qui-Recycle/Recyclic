---
story_id: email.brevo-webhooks
epic_id: auth-refactoring
title: "Gestion des bounces/spam via webhooks Brevo"
status: Done
parent: tech-debt.email
---

### User Story

En tant que système,
Je veux recevoir et traiter les événements Brevo (bounces/spam/etc.),
Afin de maintenir des statuts d’envoi fiables et éviter les blacklist.

### Critères d'Acceptation

1. Endpoint `POST /api/v1/email/webhook` sécurisé (signature/secret) qui accepte les événements pertinents.
2. Persistance minimale: `email`, `event`, `timestamp`, `reason`.
3. Mise à jour d’un statut d’envoi consultable (`DELIVERED`, `BOUNCED`, `SPAM`, `BLOCKED`).
4. Logs d’audit et tests unitaires (parse/erreurs/signature invalide).

### Tâches

- Créer la route FastAPI (webhook) + vérification de signature.
- Parser payload et stocker l’événement + MAJ du statut d’envoi.
- Écrire tests unitaires (happy path, erreurs, sécurité).

### Notes

Estimation: M (0.5–1.5 j selon persistance et sécurité)

---

### QA Results

Gate: PASS

Raisons:
- Webhook sécurisé (signature/secret) implémenté, persistance et mise à jour des statuts OK.
- Tests unitaires couvrant happy path et erreurs de signature.

Evidence:
- Événements Brevo stockés et statut d’envoi consultable.

Reviewer: Quinn
Date: 2025-09-17

---

## Dev Agent Record

### Tasks
- [x] Créer les modèles de données (EmailEvent, EmailStatusModel)
- [x] Créer le service webhook Brevo avec vérification de signature
- [x] Créer les endpoints webhook et de consultation de statut
- [x] Intégrer le router email à l'API principale
- [x] Enrichir le service email pour créer des statuts
- [x] Écrire tests unitaires complets

### File List
- `api/src/recyclic_api/models/email_event.py` - Modèles pour événements et statuts
- `api/src/recyclic_api/services/email_webhook_service.py` - Service de traitement webhooks
- `api/src/recyclic_api/api/api_v1/endpoints/email.py` - Endpoints webhooks et statuts
- `api/src/recyclic_api/core/config.py` - Configuration BREVO_WEBHOOK_SECRET
- `api/src/recyclic_api/core/email_service.py` - Service enrichi avec création de statut
- `api/tests/test_email_webhook_service.py` - Tests du service webhook (13 tests)

### Completion Notes
- **Endpoint webhook sécurisé :**
  - `POST /api/v1/email/webhook` avec vérification HMAC-SHA256
  - Support signature Brevo via header X-Mailin-Signature
  - Validation et parsing des événements Brevo

- **Persistance complète :**
  - Table `email_events` : événements detaillés avec métadonnées
  - Table `email_statuses` : statut actuel de chaque email
  - Tracking automatique depuis l'envoi jusqu'aux événements

- **Endpoints de consultation :**
  - `GET /api/v1/email/status/{email_address}` - Statut actuel
  - `GET /api/v1/email/events/{email_address}` - Historique des événements
  - `GET /api/v1/email/health` - Santé du service

- **Statuts gérés :**
  - SENT, DELIVERED, BOUNCED, SPAM, BLOCKED, ERROR
  - Mise à jour automatique via webhooks
  - Conservation des raisons de bounce/erreur

- **Sécurité et fiabilité :**
  - Vérification cryptographique des webhooks
  - Logs d'audit structurés
  - Gestion d'erreurs robuste avec rollback
  - Tests de sécurité (signature invalide)

### Change Log
- 2025-09-17: Implémentation complète des webhooks Brevo

### Status
Completed

