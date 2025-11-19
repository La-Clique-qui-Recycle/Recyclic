# User Story (Tâche Technique): Produire l'Artefact de Build de Référence

**ID:** STORY-B17-P1
**Titre:** Générer une archive propre du build frontend pour servir de référence
**Epic:** Déploiement & Mise en Production
**Priorité:** P0 (BLOQUANT)

---

## Objectif

**En tant que** Développeur,
**Je veux** produire un artefact de build du frontend dans un environnement local propre et contrôlé,
**Afin de** créer une "pièce à conviction" de référence pour la comparer à l'artefact généré sur le serveur de production.

## Contexte

Dans le cadre de l'opération "Autopsie de l'Artefact", nous devons prouver qu'il existe une divergence entre le build local (supposé correct) et le build du serveur (supposé corrompu). Cette story couvre la création de l'artefact de référence.

## Critères d'Acceptation / Plan d'Action

1.  **Préparation de l'Environnement :**
    - [ ] L'agent doit se placer dans le répertoire `frontend/` du projet.
    - [ ] Exécuter `npm install` pour s'assurer que toutes les dépendances sont à jour.

2.  **Nettoyage :**
    - [ ] Exécuter `rm -rf dist build` pour supprimer tout ancien répertoire de build et garantir un départ à zéro.

3.  **Construction de Production :**
    - [ ] Exécuter la commande de build en injectant la variable d'environnement de production :
      ```bash
      VITE_API_URL="https://recyclic.jarvos.eu/api" npm run build
      ```

4.  **Archivage :**
    - [ ] Le dossier de sortie (`dist/` ou `build/`) doit être compressé dans une archive nommée `frontend_build_local.zip`.

## Livrable Final

- [ ] L'archive `frontend_build_local.zip` contenant le résultat du build.
