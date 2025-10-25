# Story b37-11: Amélioration: Ajouter un filtre de statut à l'endpoint des tickets de réception

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Amélioration / Backend

## 1. Contexte

Pour implémenter le widget de notifications, le frontend a besoin d'un moyen de récupérer la liste des tickets de réception qui sont actuellement "en cours" (statut "opened"). L'endpoint existant `GET /v1/reception/tickets` retourne tous les tickets mais ne permet pas de les filtrer par statut.

## 2. User Story (En tant que...)

En tant que **Développeur Frontend**, je veux **pouvoir filtrer la liste des tickets de réception par leur statut**, afin de pouvoir récupérer facilement et efficacement uniquement les tickets qui sont en cours.

## 3. Critères d'Acceptation

1.  L'endpoint `GET /v1/reception/tickets` DOIT être modifié pour accepter un nouveau paramètre de requête optionnel : `status` (de type `str`).
2.  Lorsque ce paramètre est fourni (ex: `GET /v1/reception/tickets?status=opened`), l'API DOIT retourner uniquement les tickets qui correspondent à ce statut.
3.  Si le paramètre n'est pas fourni, l'endpoint DOIT conserver son comportement actuel (retourner tous les tickets, paginés).
4.  La modification DOIT être appliquée au niveau du service (`ReceptionService`) pour que la logique de filtrage soit correctement implémentée avant la requête en base de données.

## 4. Solution Technique Recommandée

-   **Fichier à modifier (Endpoint) :** `api/src/recyclic_api/api/api_v1/endpoints/reception.py`
    -   Ajouter `status: Optional[str] = Query(None, description="Filtrer par statut")` à la signature de la fonction `get_tickets`.
    -   Passer ce nouveau paramètre à la fonction du service.
-   **Fichier à modifier (Service) :** `api/src/recyclic_api/services/reception_service.py`
    -   Modifier la fonction `get_tickets_list` pour qu'elle accepte le paramètre `status`.
    -   Ajouter une condition `query = query.filter(TicketDepot.status == status)` si le paramètre est fourni.

## 5. Prérequis de Test

- L'agent devra créer un test d'intégration pour ce nouveau filtre.
- Le test devra vérifier que l'appel à `GET /v1/reception/tickets?status=opened` retourne bien uniquement les tickets ouverts.
- Le test devra vérifier que l'appel sans paramètre continue de fonctionner comme avant.
