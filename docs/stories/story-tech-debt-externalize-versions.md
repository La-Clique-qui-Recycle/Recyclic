# Story Technique: Externaliser les versions de Node.js et Python du workflow CI/CD

- **Statut**: Draft
- **Type**: Dette Technique (Infrastructure)
- **Sévérité**: Basse

---

## Story

**En tant que** Développeur,
**Je veux** que le workflow CI/CD lise les versions des langages depuis des fichiers de configuration dédiés dans le projet,
**Afin de** centraliser la gestion des versions et de simplifier les futures mises à jour.

---

## Contexte et Problème à Résoudre

Les numéros de version pour Node.js (18) et Python (3.11) sont inscrits en dur dans le fichier de workflow. Mettre à jour une version de langage requiert de modifier le workflow CI/CD, ce qui est moins pratique et plus sujet à l'oubli.

---

## Critères d'Acceptation

1.  La version de Node.js est lue depuis un fichier `.nvmrc` (ou équivalent) à la racine du projet frontend.
2.  La version de Python est lue depuis un fichier `.python-version` (ou `pyproject.toml`) à la racine du projet api.
3.  Le fichier `.github/workflows/deploy.yaml` est mis à jour pour utiliser ces fichiers comme source pour les actions `setup-node` et `setup-python`.
4.  La pipeline CI/CD reste fonctionnelle après la modification.

---

## Fichier Concerné

- `.github/workflows/deploy.yaml`
