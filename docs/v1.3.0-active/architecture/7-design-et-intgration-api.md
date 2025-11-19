# 7. Design et Intégration API

### Stratégie d'Intégration API

**API Integration Strategy:** Extension additive des endpoints existants sans breaking changes
**Authentication:** Authentification existante préservée (Telegram + future email/password)
**Versioning:** API versionnée (v1) maintenue, nouveaux endpoints en v1
**Error Handling:** Patterns d'erreur existants étendus pour nouvelles fonctionnalités

### Nouveaux Endpoints API

#### GET /api/v1/categories/enhanced
- **Purpose:** Récupération des catégories avec métadonnées d'affichage
- **Integration:** Extension de l'endpoint catégories existant
- **Request:** Query params pour filtrage (visible_only, with_presets)
- **Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Électronique",
      "display_order": 1,
      "is_visible": true,
      "shortcut_key": "E",
      "is_preset": false,
      "preset_buttons": [...]
    }
  ]
}
```

#### POST /api/v1/preset-buttons/bulk-update
- **Purpose:** Mise à jour en lot des boutons prédéfinis
- **Integration:** Nouvel endpoint pour gestion administrative
- **Request:**
```json
{
  "buttons": [
    {
      "category_id": "uuid",
      "name": "Don Petit",
      "preset_price": 5.00,
      "button_type": "donation",
      "sort_order": 1
    }
  ]
}
```

#### PUT /api/v1/cash-sessions/{id}/step
- **Purpose:** Mise à jour de l'étape actuelle de session
- **Integration:** Extension des opérations session existantes
- **Request:**
```json
{
  "current_step": "sale",
  "step_start_time": "2025-11-17T10:30:00Z"
}
```

#### GET /api/v1/system/backup-status
- **Purpose:** Audit du système de sauvegarde automatique
- **Integration:** Nouvel endpoint pour monitoring
- **Response:** Statut des sauvegardes, dernières exécutions, métriques

---
