---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.645774
original_path: docs/stories/story-b37-12-spec-dashboard-data.md
---

# Story b37-12: Spécifications techniques pour les données du dashboard admin

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Tâche Technique / Spécification

## 1. Contexte

Pour développer les widgets de statistiques de la nouvelle page d'accueil admin (story `b37-p5`), l'agent de développement a besoin des spécifications techniques précises concernant les endpoints API à utiliser, les paramètres à envoyer, et la structure des données attendues.

## 2. Spécifications Techniques

### Endpoints API à Utiliser

1.  **Statistiques Financières (CA du jour, Dons du jour) et Poids Vendu :**
    *   **Endpoint :** `GET /v1/cash-sessions/stats/summary`
    *   **Champs à utiliser :** `total_sales`, `total_donations`, `total_weight_sold`.

2.  **Poids des Matières Reçues du Jour :**
    *   **Endpoint :** `GET /v1/stats/reception/summary`
    *   **Champ à utiliser :** `total_weight`.

### Paramètres de Date

*   **Format :** Toutes les dates doivent être envoyées au format **ISO 8601 complet**, incluant l'heure et le fuseau horaire (ex: `2025-10-24T00:00:00.000Z`).
*   **Pour filtrer sur la journée en cours, utiliser :**
    *   `date_from` / `start_date` : Début de la journée en UTC.
    *   `date_to` / `end_date` : Fin de la journée en UTC.

### Structure des Données de Réponse

*   La réponse de `GET /v1/cash-sessions/stats/summary` est un objet contenant les clés `total_sales`, `total_donations`, `total_weight_sold`, etc.
*   La réponse de `GET /v1/stats/reception/summary` est un objet contenant les clés `total_weight`, `total_items`, etc.

## 3. Critères d'Acceptation

- L'agent de développement DOIT utiliser ces spécifications pour implémenter la story `b37-p5`.
- Les appels API effectués par le frontend DOIVENT correspondre exactement à ces spécifications.
