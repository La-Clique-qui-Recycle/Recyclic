---
story_id: tech-debt.email
epic_id: auth-refactoring
title: "Story Tech-Debt: Mise en place du service d'envoi d'emails"
status: Ready
---

### User Story

**En tant que** système,
**Je veux** pouvoir envoyer des emails transactionnels de manière fiable via un service tiers,
**Afin de** supporter des fonctionnalités critiques comme la réinitialisation de mot de passe et les notifications.

### Critères d'Acceptation

1.  Un compte pour un service d'email est créé et une clé d'API est générée.
2.  La clé d'API est stockée de manière sécurisée comme variable d'environnement pour le backend.
3.  Un service réutilisable `email_service.py` est créé dans le backend.
4.  Le service peut envoyer un email de test en utilisant un template HTML simple.
5.  Le service est couvert par des tests unitaires qui mockent l'appel réel à l'API du fournisseur.

---

### Dev Notes

Cette story construit la fondation pour tous les envois d'emails futurs. Elle est un prérequis pour finaliser la Story E (Mot de passe oublié).

**Le workflow se déroule en deux parties : une partie manuelle pour le propriétaire du projet, et une partie implémentation pour l'agent de développement.**

---

### Partie 1 : Actions Manuelles (Pour Vous)

**L'agent de développement ne pourra commencer qu'une fois ces étapes terminées.**

1.  **Accéder à vos clés d'API Brevo :**
    -   Connectez-vous à votre compte Brevo.
    -   Cliquez sur le nom de votre profil en haut à droite, puis sur **"SMTP & API"**.

2.  **Générer une Clé d'API :**
    -   Vous êtes sur la page des clés API. Cliquez sur le bouton **"+ NOUVELLE CLÉ API"**.
    -   Donnez-lui un nom (ex: `recyclic-api-key`) et cliquez sur **"GÉNÉRER"**.
    -   **ATTENTION :** Brevo n'affichera cette clé qu'**une seule fois**. Copiez-la et conservez-la en lieu sûr immédiatement.

3.  **Configurer le Secret pour l'Application :**
    -   Dans le répertoire `api/`, créez un fichier nommé `.env` (s'il n'existe pas déjà).
    -   Ajoutez la ligne suivante dans ce fichier `.env`, en remplaçant `xkeysib-xxxx...` par la clé que vous venez de copier :
        ```
        BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ```
    -   **Sécurité :** Assurez-vous que le fichier `.gitignore` à la racine du projet contient bien une ligne avec `.env` pour qu'il ne soit jamais envoyé sur votre dépôt Git.

**Une fois ces trois étapes terminées, informez-moi pour que je puisse lancer la partie 2.**

---

### Note du Scrum Master (2025-09-17)

**Statut :** ✅ **PRÊT POUR LE DÉVELOPPEMENT**

**Confirmation :** Le propriétaire du projet a confirmé que la clé d'API Brevo a été configurée dans l'environnement. La Partie 2 peut commencer.

---

---

### Partie 2 : Tâches d'Implémentation (Pour l'Agent Développeur)

*Ne pas commencer avant que la Partie 1 ne soit confirmée comme terminée.*

1.  **Mettre à jour la configuration :**
    -   Ajouter la librairie Python du service choisi (ex: `pip install sib-api-v3-sdk`) au fichier `api/requirements.txt`.
    -   Mettre à jour `api/src/recyclic_api/core/config.py` pour charger la clé d'API depuis l'environnement.

2.  **Créer le service d'email :**
    -   Créer le fichier `api/src/recyclic_api/core/email_service.py`.
    -   Y implémenter une fonction `send_email(to_email: str, subject: str, html_content: str)` qui utilise le client du service choisi.

3.  **Créer un template d'email de test :**
    -   Créer un fichier `api/src/templates/emails/test_email.html`.

4.  **Créer un endpoint de test (temporaire) :**
    -   Ajouter une route de test (ex: `GET /test-email`) pour valider le bon fonctionnement.

5.  **Écrire les tests unitaires :**
    -   Créer un fichier de test pour `email_service.py`.
    -   Utiliser `unittest.mock.patch` pour **mocker** le client du service et vérifier que la fonction `send_email` est appelée correctement.