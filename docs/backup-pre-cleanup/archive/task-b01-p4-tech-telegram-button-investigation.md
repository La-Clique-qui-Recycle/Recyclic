# Tâche (Technique): Investigation du Bouton d'Inscription Telegram

**ID:** TASK-TECH-TELEGRAM-BUTTON
**Titre:** Investigation du Comportement du Bouton d'Inscription Telegram
**Priorité:** Basse

---

## Objectif

**En tant que** Développeur,  
**Je veux** investiguer et documenter les conditions exactes sous lesquelles l'API de Telegram affiche une URL sous forme de bouton "inline" cliquable par rapport à un simple lien texte,  
**Afin de** pouvoir prendre une décision éclairée sur les améliorations futures et de ne pas considérer le comportement actuel comme un bug.

## Contexte

- **Problème Constaté :** Le bot envoie actuellement le lien d'inscription sous forme de texte brut. L'hypothèse est que cela est dû au fait que l'URL de développement (`http://...`) n'est pas en HTTPS.
- **Objectif de la tâche :** Confirmer cette hypothèse et documenter officiellement cette contrainte technique.

## Critères d'Acceptation

1.  Le développeur confirme (par exemple en testant avec une URL HTTPS temporaire type `ngrok` ou en se référant à la documentation officielle de Telegram) que les boutons "inline" contenant des URLs ne fonctionnent que si l'URL est en `https`.
2.  Une note est ajoutée à la documentation technique du bot (par exemple dans `bot/docs/README.md`) pour expliquer ce comportement.
3.  La tâche est considérée comme terminée une fois la confirmation et la documentation effectuées. Aucune modification du code de production n'est requise pour cette tâche.

## Notes

- Cette tâche est une investigation, pas une correction de bug. Le but est d'améliorer notre connaissance du système et de documenter ses contraintes.
