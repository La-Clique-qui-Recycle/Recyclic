# Guide des Tests Frontend

**Auteur:** Bob (Scrum Master)
**Date:** 2025-09-18
**Objectif:** Fournir une source de vérité unique pour la configuration, l'écriture et l'exécution des tests frontend pour le projet Recyclic.

---

## 1. Stack de Test

Notre environnement de test pour le frontend est basé sur les technologies suivantes :

-   **Framework de Test :** [Vitest](https://vitest.dev/) - Un framework de test rapide et moderne, compatible avec Vite.
-   **Tests de Composants :** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Pour tester les composants React de la manière dont un utilisateur les utiliserait.
-   **Simulation d'Interactions :** `user-event` - Pour simuler des interactions utilisateur réalistes (clics, saisie clavier).
-   **Environnement DOM :** `jsdom` - Pour simuler un environnement de navigateur en ligne de commande.
-   **Assertions :** La syntaxe d'assertion de Vitest est compatible avec `expect` de Jest/Chai.

---

## 2. Configuration Globale

La configuration centrale des tests se trouve dans deux fichiers clés :

-   `frontend/vitest.config.js` : Configure l'environnement de test global pour Vitest.
-   `frontend/src/test/setup.ts` : Ce fichier est crucial. Il est exécuté avant chaque suite de tests et est utilisé pour configurer les **mocks globaux**.

### Mocks Globaux (`setup.ts`)

Pour éviter les répétitions et les erreurs, les dépendances communes sont mockées dans ce fichier. **Ne pas mocker ces librairies dans les fichiers de test individuels.**

-   **`styled-components`**
-   **`react-router-dom`**
-   **`@mantine/notifications`**
-   **`@tabler/icons-react`**

---

## 3. Comment Lancer les Tests

Placez-vous dans le répertoire `frontend/` pour exécuter ces commandes.

-   **Lancer tous les tests en une seule fois :**
    ```bash
    npm test -- --run
    ```

-   **Lancer les tests en mode "watch" (interactif) :**
    ```bash
    npm test
    ```

-   **Générer un rapport de couverture de code :**
    ```bash
    npm run test:coverage
    ```

---

## 4. Bonnes Pratiques

1.  **Prioriser `user-event` :** Pour simuler les interactions, préférez `@testing-library/user-event` à `fireEvent`, car il simule le comportement du navigateur de manière plus fidèle.

2.  **Tester comme un utilisateur :** Ne testez pas les détails d'implémentation d'un composant. Testez ce que l'utilisateur voit et ce qu'il peut faire. Cherchez les éléments par leur rôle, leur texte, ou leur label.

3.  **Gérer l'Asynchronisme :** Utilisez `async/await` et les fonctions `waitFor` ou `findBy*` de Testing Library pour gérer les mises à jour d'état asynchrones.

4.  **Isoler les Tests :** Chaque test doit être indépendant. Utilisez les fonctions `beforeEach` et `afterEach` pour nettoyer les mocks et les états entre les tests.
