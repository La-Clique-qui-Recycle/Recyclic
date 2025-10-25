# Story b37-p6: Chore: Ajuster le layout du dashboard admin au schéma final

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Tâche Technique / Refactorisation
**Dépendance :** `b37-p1`

## 1. Contexte

Le layout initial du nouveau dashboard admin a été implémenté (story `b37-p1`). Cependant, une dernière clarification de l'agent UX a fourni un schéma visuel plus détaillé et précis. Cette story vise à aligner parfaitement le layout existant sur ce schéma final.

## 2. Objectif

**Ajuster le contenu et l'organisation des zones du dashboard admin** pour qu'ils correspondent exactement au dernier schéma visuel fourni par Sally.

## 3. Critères d'Acceptation

1.  Le composant `DashboardHomePage.jsx` DOIT être modifié.
2.  **Zone 2 (Navigation Principale) :** Les boutons DOIVENT correspondre exactement aux 6 sections du schéma :
    *   `Utilisateurs & Groupes`
    *   `Réceptions`
    *   `Caisse`
    *   `Rapports`
    *   `Paramètres`
    *   `Santé Système`
3.  **Zone 3 (Administration Super-Admin) :** Les boutons DOIVENT correspondre exactement aux 3 sections du schéma :
    *   `Sites & Caisses`
    *   `Paramètres Avancés`
    *   `Audit & Logs`

## 4. Référence Visuelle

*Se référer au schéma final dans la story `b34-p37` pour la disposition exacte.*

## 5. Prérequis de Test

- Se connecter en tant que `super-admin` (`superadmintest1`).
- Aller sur la page `/admin`.
- **Vérification :** Les boutons dans les Zones 2 et 3 doivent correspondre exactement à la liste ci-dessus.
