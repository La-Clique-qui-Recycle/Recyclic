# Story (Dette Technique): Durcissement de l'API des Sessions de Caisse

**ID:** STORY-TECH-DEBT-CASH-SESSIONS
**Titre:** Durcissement de l'API des Sessions de Caisse suite à la review QA
**Epic:** Maintenance & Dette Technique
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur,  
**Je veux** implémenter les recommandations de la revue QA pour la story `STORY-B02-P1`,  
**Afin de** rendre l'API des sessions de caisse plus robuste, observable et plus facile à utiliser pour les futurs développements.

## Contexte

Lors de la validation de la story `STORY-B02-P1`, l'agent QA a identifié trois points d'amélioration non-bloquants qui constituent une dette technique mineure. Cette story a pour but de les adresser.

## Critères d'Acceptation

1.  **Contrainte d'unicité renforcée :** Une contrainte au niveau de la base de données (index partiel ou contrainte de table) est ajoutée pour garantir qu'il ne peut y avoir qu'une seule session de caisse active (`status = 'OPEN'`) pour un `register_id` donné. Un test de concurrence qui tente d'ouvrir deux sessions simultanément est ajouté et doit échouer avec le code d'erreur attendu (ex: 409 Conflict).

2.  **Documentation OpenAPI améliorée :** La spécification OpenAPI est mise à jour pour inclure des exemples de réponses pour les cas d'erreur courants (ex: 409 pour une session déjà ouverte, 404 pour un `register_id` inconnu).

3.  **Observabilité améliorée :** Des logs structurés ou des métriques sont ajoutés pour tracer spécifiquement les événements d'ouverture de session réussis et échoués, incluant le `register_id` et l' `operator_id`.

## Notes Techniques

- Cette story peut être traitée indépendamment et n'est pas bloquante pour les autres stories de l'epic multi-caisse.
- Elle regroupe les recommandations du rapport QA de la story `STORY-B02-P1`.

## Definition of Done

- [ ] La contrainte de base de données est en place et testée.
- [ ] La documentation OpenAPI est enrichie avec les exemples d'erreurs.
- [ ] Les logs/métriques de session sont implémentés.
- [ ] La story a été validée par le PO.
