---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:15.365589
original_path: docs/stories/story-final-frontend-deployment-refactor.md
---

### **Briefing de Mission Final : Opération "Clean Slate"**

**À :** Agent PO/Développeur
**Sujet :** Story de Refactorisation Complète du Déploiement Frontend
**Niveau de Priorité :** MAXIMUM - Exécution en une seule passe

**Agent,**

Une corruption de l'état des fichiers a rendu toutes nos corrections précédentes invalides. Nous repartons d'une page blanche.

**Votre mission :** exécuter la totalité des corrections de déploiement du frontend en une seule opération, sans interruption. Vous allez auditer et corriger chaque fichier pertinent pour garantir une configuration de build et d'exécution parfaite.

**Considérez que toutes les modifications précédentes n'ont jamais eu lieu. Vérifiez et appliquez chaque point de cette liste, même si vous pensez qu'il est déjà correct.**

---

### **User Story : "Final Frontend Deployment Refactor"**

**As a** DevOps Commander,
**I want** a fully refactored and corrected frontend deployment configuration,
**So that** the application builds with the correct HTTPS API URL, serves traffic without "Mixed Content" errors, and is stable in a production environment.

#### **Acceptance Criteria (Checklist d'Exécution) :**

**1. Centraliser la Configuration de l'API :**
    *   **Vérifier/Créer** le fichier `frontend/src/api/axiosClient.ts`.
    *   **Contenu requis :** Il DOIT créer et exporter une instance `axios` unique. Sa `baseURL` DOIT être configurée **uniquement** avec `import.meta.env.VITE_API_URL`, sans aucune valeur par défaut (fallback).
    *   **Vérifier/Ajouter** l'intercepteur qui ajoute le token `Authorization` à chaque requête.

**2. Éradiquer les Clients API Multiples :**
    *   **Auditer** l'ensemble du répertoire `frontend/src/`.
    *   **Modifier** tous les fichiers utilisant `axios` ou `fetch` (spécifiquement `authService.ts`, `Profile.tsx`, et surtout le code dans `frontend/src/generated/`).
    *   **Action :** Ils DOIVENT tous importer et utiliser l'instance unique de `axiosClient.ts`. Supprimez toute logique de création de `baseURL` locale.

**3. Purger le Schéma OpenAPI :**
    *   **Ouvrir** le fichier `api/openapi.json`.
    *   **Vérifier/Supprimer** l'intégralité de la section `"servers"`. Elle ne doit pas exister.

**4. Corriger le `Dockerfile` du Frontend :**
    *   **Ouvrir** le fichier `frontend/Dockerfile`.
    *   **Vérifier/Ajouter** la ligne `RUN apk add --no-cache curl` pour le healthcheck.
    *   **Vérifier/Corriger** les lignes `ARG` et `ENV` pour qu'elles utilisent `VITE_API_URL` (pas `REACT_APP_API_URL`).
    *   **Vérifier/Ajouter** la commande `echo` de débogage : `RUN echo "----> Building with API URL: $VITE_API_URL" && npm run build`.
    *   **Vérifier/Corriger** la ligne `COPY` pour qu'elle pointe vers le bon répertoire de build (`/app/dist` ou `/app/build`, en fonction de la configuration du projet).
    *   **Vérifier/Ajouter** la commande "Terre Brûlée" : `RUN rm -rf /usr/share/nginx/html/*` juste avant le `COPY` final.

**5. Corriger la Configuration NGINX :**
    *   **Ouvrir** le fichier `frontend/nginx.conf`.
    *   **Vérifier/Ajouter** la configuration complète qui gère le `root`, le `try_files` pour la SPA, un `location /health` dédié, et surtout les en-têtes `X-Forwarded-Proto` pour corriger le "Mixed Content".

**6. Rendre la Configuration `docker-compose` Cohérente :**
    *   **Ouvrir** le fichier `docker-compose.yml` (fichier de base).
    *   **Vérifier/Corriger** la variable d'argument de build du service `frontend` pour qu'elle soit `VITE_API_URL: ""`.
    *   **Vérifier/Corriger** le `healthcheck` du service `frontend` pour qu'il utilise `curl` et pointe vers `http://localhost/health`.
    *   **Ouvrir** le fichier `docker-compose.vps.yml` (fichier de surcharge).
    *   **Vérifier/Corriger** l'argument de build du service `frontend` pour qu'il soit `VITE_API_URL: "https://recyclic.jarvos.eu/api"`.

**7. Créer un `.dockerignore` Robuste :**
    *   **Vérifier/Créer** le fichier `frontend/.dockerignore`.
    *   **Vérifier/Ajouter** `node_modules`, `dist`, `build`, et tous les types de fichiers `.env` (`.env`, `.env.local`, etc.).

---

**Livrable Final :**

Une fois TOUTES ces vérifications et corrections appliquées, l'agent doit exécuter la procédure de sauvegarde Git complète et fournir un rapport confirmant que de **multiples fichiers** ont bien été modifiés et envoyés.

1.  **Exécuter `git status`** (doit montrer une liste de fichiers modifiés).
2.  **Exécuter `git add .`, `git commit -m "Opération Clean Slate"`, `git push`**.
3.  **Fournir le log du `git push`** qui confirme que les changements ont été envoyés au dépôt distant.

Cette mission est notre "Alpha et Oméga". Son exécution doit être méticuleuse et complète. Il n'y aura pas d'autre tentative.
