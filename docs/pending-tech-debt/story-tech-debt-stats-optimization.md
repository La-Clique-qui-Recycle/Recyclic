# Story (Dette Technique): Optimisation des Endpoints de Statistiques

**ID:** STORY-TECH-DEBT-STATS-OPTIMIZATION
**Titre:** Optimisation des Endpoints de Statistiques (Cache et Métriques)
**Epic:** Maintenance & Dette Technique
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur,  
**Je veux** implémenter les recommandations d'optimisation du QA pour les endpoints de statistiques,  
**Afin de** garantir leur performance à très grande échelle et d'améliorer leur observabilité.

## Contexte

Lors de la revue de la story `STORY-B05-P1`, le QA a recommandé deux optimisations non-bloquantes pour les nouveaux endpoints de statistiques : l'ajout d'un cache Redis et de métriques de performance.

## Critères d'Acceptation

1.  Un cache Redis est implémenté pour les endpoints `GET /api/v1/stats/reception/summary` et `GET /api/v1/stats/reception/by-category`. Le cache a une durée de vie raisonnable (ex: 15 minutes) pour éviter de surcharger la base de données avec des requêtes répétitives.
2.  Des métriques de performance (ex: temps de réponse de la requête) sont ajoutées pour ces deux endpoints, afin de pouvoir monitorer leur performance dans le temps.

## Notes Techniques

-   Utiliser le client Redis déjà configuré dans le projet.
-   Pour les métriques, s'intégrer avec le système de monitoring existant (Prometheus/Grafana si disponible).

## Definition of Done

- [ ] Le cache Redis est en place pour les endpoints de statistiques.
- [ ] Les métriques de performance sont implémentées.
- [ ] La story a été validée par le Product Owner.
