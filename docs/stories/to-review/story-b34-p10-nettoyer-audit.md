---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.348887
original_path: docs/stories/story-b34-p10-nettoyer-audit.md
---

# Story b34-p10: Nettoyer le Journal d'Audit

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah

## 1. Contexte

Lors de l'implémentation du journal d'audit, un événement a été ajouté pour tracer chaque consultation de l'historique d'un utilisateur par un admin. Cette information, bien que potentiellement utile, s'avère trop verbeuse et "pollue" le journal, masquant des actions plus critiques.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux que le journal d'audit **ne contienne que les actions de modification ou de sécurité importantes**, afin de pouvoir me concentrer sur les événements qui requièrent une attention particulière.

## 3. Critères d'Acceptation

1.  Le fichier `api/src/recyclic_api/api/api_v1/endpoints/admin.py` DOIT être modifié.
2.  Dans la fonction (endpoint) `get_user_history`, le bloc de code qui appelle la fonction `log_audit` DOIT être entièrement supprimé.
3.  Aucune autre modification ne doit être apportée à la logique de la fonction `get_user_history`.

## 4. Prérequis de Test

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1`

## 5. Conseils pour l'Agent DEV

- C'est une tâche de suppression de code simple et rapide.
- Pour valider, il suffira de consulter l'historique d'un utilisateur, puis de vérifier que **aucun nouvel événement** n'apparaît dans le Journal d'Audit.
