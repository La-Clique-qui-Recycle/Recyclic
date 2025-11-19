# Requirements

### Functional Requirements
FR1: L'interface caisse doit afficher 4 boutons prédéfinis (Don 0€, Don -18, Recyclage, Déchèterie) à l'étape de prix, permettant de valider rapidement sans saisie manuelle
FR2: Les catégories doivent inclure une case à cocher pour contrôler l'affichage dans les tickets d'entrée, avec logique automatique pour les catégories principales
FR3: Les tickets de vente doivent implémenter un ascenseur fonctionnel gardant visible le bloc total/prix/bouton "finaliser" en bas d'écran
FR4: Toutes les catégories et sous-catégories doivent afficher leur raccourci clavier (A Z E R T Y U I O P) dans le coin inférieur gauche avec style visuel distinctif
FR5: L'interface doit afficher des signaux visuels clairs (encadrements colorés) indiquant l'étape en cours du processus de saisie
FR6: Le bloc central doit être remanié avec destination + notes + bouton "Ajouter" à droite du pavé numérique réduit
FR7: Toutes les références "Recyclic" dans le code doivent être renommées "RecyClique" de manière cohérente
FR8: Le système de sauvegarde automatique de base de données doit être vérifié, documenté et validé

### Non Functional Requirements
NFR1: L'interface doit maintenir ses performances actuelles avec l'ajout d'ascenseur et boutons supplémentaires
NFR2: Les raccourcis clavier doivent fonctionner de manière fiable sur tous les navigateurs supportés
NFR3: Les signaux visuels doivent être perceptibles dans l'environnement d'utilisation réel (lumière, distance)
NFR4: Le renommage global ne doit pas casser les fonctionnalités existantes
NFR5: La stabilité des sauvegardes automatiques doit être garantie

### Compatibility Requirements
CR1: Toutes les APIs existantes doivent rester compatibles avec les modifications frontend
CR2: Le schéma de base de données existant doit être préservé lors des modifications de catégories
CR3: L'apparence et les interactions UI doivent rester cohérentes avec le design system existant
CR4: Les intégrations avec services externes (Redis, PostgreSQL) doivent être maintenues

---
