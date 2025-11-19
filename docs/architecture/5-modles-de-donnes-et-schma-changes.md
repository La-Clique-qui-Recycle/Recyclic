# 5. Modèles de Données et Schéma Changes

### Nouveaux Modèles de Données

#### Modèle Catégorie Amélioré
**Purpose:** Gestion flexible des catégories avec cases à cocher d'affichage
**Integration:** Extension du modèle Deposit existant

**Nouveaux Attributs:**
- `display_order`: Integer - Ordre d'affichage personnalisable
- `is_visible`: Boolean - Contrôle d'affichage par défaut (true)
- `shortcut_key`: String - Raccourci clavier associé (optionnel)
- `is_preset`: Boolean - Marque les catégories prédéfinies pour dons/recyclage

**Relationships:**
- **With Existing:** Extension 1:1 avec Deposit.category
- **With New:** Relation avec PresetButtons pour boutons prédéfinis

#### Modèle PresetButton
**Purpose:** Gestion des boutons de prix prédéfinis pour dons et recyclage
**Integration:** Nouvelle entité liée aux catégories

**Key Attributes:**
- `name`: String - Nom du bouton (ex: "Don Petit", "Recyclage Moyen")
- `category_id`: UUID - Catégorie associée
- `preset_price`: Decimal - Prix prédéfini
- `button_type`: Enum - "donation" ou "recycling"
- `sort_order`: Integer - Ordre d'affichage dans l'interface

**Relationships:**
- **With Existing:** FK vers Category pour association
- **With New:** Utilisé par les composants UI pour génération dynamique

#### Extension CashSession
**Purpose:** Support pour les signaux visuels d'étape en cours
**Integration:** Champs additionnels au modèle existant

**Nouveaux Attributs:**
- `current_step`: Enum - Étape actuelle (entry/sale/exit)
- `last_activity`: DateTime - Dernière activité pour timeout
- `step_start_time`: DateTime - Début de l'étape actuelle pour métriques

### Stratégie d'Intégration Schéma

**Changements Base de Données:**
- **New Tables:** `preset_buttons` (liée aux catégories existantes)
- **Modified Tables:** `categories` (nouveaux champs optionnels), `cash_sessions` (champs métriques)
- **New Indexes:** Index sur `display_order`, `is_visible`, `shortcut_key` pour performance UI

**Migration Strategy:** Migrations Alembic additives avec rollback automatique
**Backward Compatibility:** Tous les nouveaux champs ont des valeurs par défaut appropriées

---
