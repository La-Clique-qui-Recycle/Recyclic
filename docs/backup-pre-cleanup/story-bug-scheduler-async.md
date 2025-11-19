# Story (Bug): Correction du Scheduler - Erreur Async Context Manager

**ID:** STORY-BUG-SCHEDULER-ASYNC
**Titre:** Correction du Bug du Scheduler : Erreur Async Context Manager
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur,  
**Je veux** que les tâches planifiées du scheduler (`anomaly_detection` et `weekly_reports`) s'exécutent sans erreur,  
**Afin de** garantir la fiabilité des rapports automatiques et de la détection d'anomalies.

## Contexte

Lors de la reconstruction des conteneurs Docker, une erreur est apparue dans les logs du scheduler : `‘generator’ object does not support the asynchronous context manager protocol`. Cette erreur indique une incompatibilité entre l'utilisation d'un `async with ...` et un objet synchrone sous-jacent (par exemple, `get_db()` ou un context manager synchrone utilisé de manière asynchrone).

**Impact :** Les tâches `anomaly_detection` et `weekly_reports` échouent en arrière-plan. Cela n'affecte pas directement l'API principale, mais peut entraîner des échecs de tests liés aux rapports/statistiques et compromet la génération de données importantes.

## Critères d'Acceptation

1.  Les tâches `anomaly_detection` et `weekly_reports` s'exécutent jusqu'à leur terme sans générer l'erreur `‘generator’ object does not support the asynchronous context manager protocol`.
2.  Les tests backend liés aux rapports hebdomadaires et à la détection d'anomalies passent avec succès.
3.  La correction est appliquée de manière à respecter les bonnes pratiques d'utilisation des context managers synchrones et asynchrones en Python.

## Notes Techniques

-   **Fichier(s) concerné(s) :** Principalement `recyclic_api/services/scheduler_service.py` et les fonctions qu'il appelle (ex: `get_db()`).
-   **Pistes de correction :**
    -   Remplacer `async with get_db()` par `with SessionLocal() as db:` (ou `with sessionmaker()()`) si la fonction est synchrone.
    -   S'assurer que les fonctions appelées sont bien asynchrones de bout en bout si un `async with` est maintenu.
    -   Utiliser `run_in_threadpool` si une fonction synchrone doit être appelée dans un contexte asynchrone.

## Definition of Done

- [ ] Le bug est corrigé et les tâches du scheduler s'exécutent sans erreur.
- [ ] Les tests pertinents passent.
- [ ] La story a été validée par le PO.
