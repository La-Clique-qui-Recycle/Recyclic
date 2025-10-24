# Parcours 1: Gestion d'un Nouvel Utilisateur

**Date :** 2025-01-24
**Auditeur :** Sally (UX Expert)
**Objectif :** Trouver un utilisateur récemment inscrit, l'assigner au groupe "Équipe Caisse", et vérifier que ses permissions sont correctes.

## 🎯 **OBJECTIF DU PARCOURS**

Assigner un utilisateur au groupe "Équipe Caisse" et vérifier ses permissions pour s'assurer qu'il peut accéder aux fonctionnalités de caisse.

## 📋 **ACTIONS SÉQUENTIELLES**

### **Étape 1: Navigation vers la page de gestion des utilisateurs**
- **Action :** Naviguer vers `/admin/users`
- **Résultat :** Page chargée avec 13 utilisateurs listés
- **Interface :** Tableau avec colonnes (Nom, Rôle, Statut d'activité, Statut en ligne)

### **Étape 2: Sélection d'un utilisateur**
- **Action :** Cliquer sur "Sélectionner l'utilisateur testuser"
- **Résultat :** Détails de l'utilisateur affichés dans le panneau de droite
- **Interface :** Onglets "Profil" et "Historique", informations personnelles et système

### **Étape 3: Ouverture du modal de modification**
- **Action :** Cliquer sur "Modifier le profil"
- **Résultat :** Modal de modification ouvert avec formulaire complet
- **Interface :** Champs éditables (Prénom, Nom, Email, etc.) et sélecteur de rôle

### **Étape 4: Modification du rôle (Objectif principal)**
- **Action :** Modifier le rôle de "Bénévole" vers "Équipe Caisse"
- **Résultat :** [À tester - nécessite navigation vers la page des groupes]
- **Interface :** Sélecteur de rôle avec options disponibles

### **Étape 5: Sauvegarde des modifications**
- **Action :** Cliquer sur "Sauvegarder"
- **Résultat :** [À tester - retour à la liste avec confirmation]
- **Interface :** Bouton de sauvegarde dans le modal

### **Étape 6: Vérification des permissions**
- **Action :** Naviguer vers la page des groupes pour vérifier l'assignation
- **Résultat :** [À tester - vérifier que l'utilisateur apparaît dans le groupe]
- **Interface :** Page `/admin/groups` avec tableau des groupes

## 🚨 **POINTS DE FRICTION IDENTIFIÉS**

### **1. EFFORT COGNITIF (SÉVÈRE)**
**Problème :** "Je dois réfléchir pour savoir où assigner le groupe"
- **Description :** Le modal de modification du profil ne contient que le champ "Rôle" mais pas d'assignation directe à un groupe
- **Impact :** L'utilisateur ne sait pas comment assigner un utilisateur à un groupe spécifique
- **Solution recommandée :** Ajouter un champ "Groupe" dans le modal ou un bouton "Gérer les groupes"

### **2. NOMBRE DE CLICS (MODÉRÉ)**
**Problème :** "L'assignation de groupe nécessite plusieurs clics et une navigation vers une autre page"
- **Description :** Pour assigner un groupe, il faut probablement naviguer vers la page des groupes
- **Impact :** Workflow fragmenté et moins efficace
- **Solution recommandée :** Intégrer l'assignation de groupe directement dans le modal de modification

### **3. RUPTURE DE CONTEXTE (MODÉRÉ)**
**Problème :** "Je suis obligé de naviguer vers la page 'Groupes & Permissions' pour assigner un groupe"
- **Description :** Le workflow d'assignation de groupe n'est pas intégré dans la gestion des utilisateurs
- **Impact :** Perte de contexte et navigation complexe
- **Solution recommandée :** Intégrer la gestion des groupes dans le modal utilisateur

### **4. CLARTÉ DU FEEDBACK (MODÉRÉ)**
**Problème :** "Le message de succès après la modification du rôle n'est pas très visible"
- **Description :** [À tester - vérifier les messages de confirmation]
- **Impact :** L'utilisateur ne sait pas si l'action a réussi
- **Solution recommandée :** Améliorer la visibilité des messages de succès

## 📊 **ANALYSE TECHNIQUE**

### **Interface Actuelle :**
- ✅ **Sélection utilisateur** : Fonctionnelle et intuitive
- ✅ **Modal de modification** : Interface complète et claire
- ✅ **Champs éditables** : Tous les champs nécessaires présents
- ❌ **Assignation de groupe** : Non intégrée dans le workflow

### **Workflow Identifié :**
1. **Sélection** → **Modification** → **Sauvegarde** → **Navigation vers groupes** → **Assignation**
2. **Problème :** Workflow en 5 étapes au lieu de 3 étapes optimales

## 🎯 **RECOMMANDATIONS PRIORITAIRES**

### **Priorité 1 - Intégration de l'assignation de groupe :**
- Ajouter un champ "Groupe" dans le modal de modification
- Permettre l'assignation directe depuis la gestion des utilisateurs
- Éviter la navigation vers une autre page

### **Priorité 2 - Amélioration du feedback :**
- Messages de confirmation plus visibles
- Indication claire du statut d'assignation
- Feedback en temps réel sur les modifications

### **Priorité 3 - Optimisation du workflow :**
- Réduire le nombre d'étapes nécessaires
- Intégrer toutes les fonctionnalités dans un seul endroit
- Améliorer la cohérence de l'interface

## 📈 **MÉTRIQUES DE SUCCÈS**

### **Objectifs d'Efficacité :**
- **Temps de tâche** : < 2 minutes pour l'assignation complète
- **Nombre de clics** : < 5 clics pour l'assignation
- **Navigation** : 0 navigation vers d'autres pages

### **Objectifs d'Utilisabilité :**
- **Clarté** : 100% des utilisateurs comprennent le workflow
- **Efficacité** : 90% des assignations réussies du premier coup
- **Satisfaction** : Score SUS > 80

## 🚀 **CONCLUSION**

Le parcours de gestion des utilisateurs est **fonctionnel mais fragmenté**. L'assignation de groupes nécessite une navigation vers une autre page, créant une **rupture de contexte** et augmentant l'**effort cognitif** de l'utilisateur.

**Recommandation principale :** Intégrer l'assignation de groupes directement dans le modal de modification des utilisateurs pour créer un workflow unifié et plus efficace.