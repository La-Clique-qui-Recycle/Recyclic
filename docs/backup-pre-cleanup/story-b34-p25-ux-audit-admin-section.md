# Story b34-p25: Audit UX complet de la section Administration

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Tâche (Audit UX)
**Assignée à:** Sally (Agent UX Expert)

## 1. Contexte

La section Administration (`/admin`) de l'application a grandi de manière organique et manque de cohérence et d'intuitivité. Avant d'entreprendre une refonte, un audit UX complet est nécessaire pour identifier les problèmes et établir une base factuelle pour les futures recommandations.

## 2. Mission (Phase 1 - Audit)

L'objectif de cette story est de réaliser un **état des lieux exhaustif** de l'expérience utilisateur de la section `/admin`. La mission n'est **pas** de proposer des solutions, mais de collecter des observations brutes et détaillées.

## 3. Méthodologie Impérative

1.  **Création de la Structure d'Audit :**
    *   L'agent DOIT d'abord créer une structure de dossiers qui représente l'intégralité du site dans `docs/audits/full-site-ux-20251024/`.
    *   Cette arborescence DOIT inclure des dossiers pour `admin`, `caisse`, `reception`, `public`, etc., et des fichiers `.md` vides pour chaque page correspondante.

2.  **Audit Itératif de la Section Admin :**
    *   L'agent DOIT se concentrer **uniquement** sur le remplissage des fichiers dans le dossier `/admin/` pour cette story.
    *   Le processus DOIT être itératif : pour chaque page de la section admin visitée, l'agent DOIT immédiatement créer/modifier le fichier `.md` correspondant pour y consigner ses notes.

3.  **Contenu des Fichiers d'Audit :**
    *   Pour chaque page, les notes DOIVENT couvrir au minimum :
        *   **Première Impression :** Clarté, densité de l'information, organisation générale.
        *   **Cohérence Nom/Contenu :** Le titre de la page et le lien correspondent-ils à la fonction réelle ?
        *   **Intuitivité :** Les actions sont-elles faciles à trouver ? Le workflow est-il logique ?
        *   **Hiérarchie d'Information :** Quelles sont les informations/actions qui semblent les plus importantes ? Lesquelles sont secondaires ?
        *   **Notes Visuelles :** Décrire la disposition des éléments. Si une capture d'écran était nécessaire, l'indiquer clairement (ex: `[SCREENSHOT: Tableau des utilisateurs très dense]`).

## 4. Critères d'Acceptation

1.  L'arborescence complète du site DOIT être créée dans `docs/audits/full-site-ux-20251024/`.
2.  Tous les fichiers `.md` correspondant aux pages de la section `/admin` DOIVENT être remplis avec des observations détaillées, conformément à la méthodologie.
3.  Les autres fichiers `.md` (hors `/admin/`) DOIVENT exister mais peuvent rester vides.
4.  L'agent DOIT fournir en conclusion de son travail la liste complète des fichiers qu'il a créés et modifiés.

## 5. Outils et Prérequis

- **Accès :** Utiliser le compte SuperAdmin pour garantir une visibilité complète.
  - **Compte :** `superadmintest1`
  - **Mot de passe :** `Test1234!`
- **Outils :** Utiliser les DevTools du navigateur (F12) pour inspecter le code, les styles, et comprendre la structure des composants React.
- **Checklist :** Pour garantir l'exhaustivité, l'agent peut s'appuyer sur la liste des routes `/admin` définies dans `frontend/src/App.jsx`.
