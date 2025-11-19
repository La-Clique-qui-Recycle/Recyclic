# Story Future: Intégration d'un Chatbot d'Administration avec CopilotKit

- **Statut**: Draft
- **Type**: Feature (Future)
- **Priorité**: Basse (Post-MVP)

---

## Story

**En tant qu**'administrateur,
**Je veux** une interface de chatbot directement dans mon tableau de bord,
**Afin de** pouvoir interroger en langage naturel l'état de l'application (ventes, utilisateurs, dépôts) et exécuter des actions rapidement.

---

## Contexte et Vision

Cette story a pour but d'implémenter une interface de type "Copilot" dans l'application. Plutôt que de naviguer dans des tableaux et des filtres, l'admin pourra simplement "demander" ce qu'il veut.

**Exemples de commandes en langage naturel :**
- "Montre-moi les ventes de la semaine dernière."
- "Quel est le total des dépôts pour le site de Paris ce mois-ci ?"
- "Passe l'utilisateur 'testuser' au rôle d'admin."
- "Exporte le rapport Ecologic pour le dernier trimestre."

Cette fonctionnalité sera construite en utilisant la bibliothèque **CopilotKit**, qui est spécifiquement conçue pour ce cas d'usage.

---

## Critères d'Acceptation (à affiner)

1.  La dépendance `CopilotKit` est ajoutée au projet frontend.
2.  Un nouveau composant "Chatbot" est ajouté au tableau de bord d'administration.
3.  Le chatbot peut répondre à des questions simples en lecture seule (ex: "Combien y a-t-il d'utilisateurs ?").
4.  Le backend est doté d'un endpoint capable de recevoir les requêtes du chatbot et de les traduire en actions ou en requêtes de base de données.
5.  (Stretch Goal) Le chatbot peut exécuter des actions simples de modification (ex: changer un rôle utilisateur) après confirmation.

---

## Notes Préliminaires

- **Dépendance Critique**: Cette story dépendra fortement de la qualité et de la complétude de l'API backend. Une API bien structurée facilitera grandement l'implémentation.
- **Complexité**: L'implémentation d'un chatbot robuste est une tâche complexe. Cette story représente probablement une Epic à part entière qui devra être découpée en plusieurs sous-tâches (connexion au frontend, création du backend conversationnel, implémentation de chaque "compétence" du chatbot).
