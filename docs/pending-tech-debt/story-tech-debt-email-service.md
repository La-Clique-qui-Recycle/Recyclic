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

### Mise à jour - Service Email Testé (2025-01-14)

**Tests du service email validés :**
- ✅ **`test_email_service.py`** : 13/13 tests passent
- ✅ **Mocking Brevo SDK** : Tests unitaires avec mocks fonctionnels
- ✅ **Gestion d'erreurs** : Fallbacks et gestion des exceptions testés
- ✅ **Configuration** : Variables d'environnement et clés API mockées

**Améliorations techniques :**
- Shim pour `sib_api_v3_sdk` pour éviter les erreurs d'import en test
- Tests isolés qui ne dépendent pas de l'API réelle
- Configuration de test robuste avec `TESTING=true`

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

---

### Validation Finale du Scrum Master (2025-09-17)

**Statut :** ✅ **VALIDÉ ET FERMÉ**

**Vérification :** Le travail de l'agent est exemplaire. Le service d'email est implémenté, testé, et a passé la revue QA avec succès. Les stories de suivi créées sont pertinentes. La fonctionnalité est considérée comme terminée et prête à être utilisée par d'autres stories.

---

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

---

## Dev Agent Record

### Tasks
- [x] Mettre à jour requirements.txt avec sib-api-v3-sdk==7.6.0
- [x] Mettre à jour config.py pour charger BREVO_API_KEY
- [x] Créer email_service.py avec classe EmailService et fonction send_email
- [x] Créer répertoire templates/emails et fichier test_email.html
- [x] Ajouter endpoint POST /api/v1/monitoring/test-email
- [x] Écrire tests unitaires complets avec mocking

### File List
- `api/requirements.txt` - Ajout de sib-api-v3-sdk==7.6.0
- `api/src/recyclic_api/core/config.py` - Ajout de BREVO_API_KEY
- `api/src/recyclic_api/core/email_service.py` - Service d'envoi d'emails via Brevo
- `api/src/templates/emails/test_email.html` - Template d'email de test
- `api/src/recyclic_api/api/api_v1/endpoints/monitoring.py` - Endpoint de test
- `api/tests/test_email_service.py` - Tests unitaires complets

### Completion Notes
- Service email fonctionnel avec Brevo API v3
- Initialisation lazy pour éviter les erreurs de configuration lors des tests
- Template HTML professionnel avec styling CSS inline
- Endpoint de test accessible via POST /api/v1/monitoring/test-email
- Couverture de tests complète (8 tests passants)
- Gestion d'erreurs robuste avec logging approprié

### Change Log
- 2025-09-17: Implémentation complète du service d'envoi d'emails

### Status
Ready for Review

---

### QA Results

**Gate**: PASS

**Raisons**:
- Tous les artefacts requis sont présents et fonctionnels (`email_service.py`, template HTML, endpoint de test, configuration clé API, dépendance SDK).
- Tests unitaires complets avec mocking du client Brevo; cas de succès/erreurs couverts.
- Respect des standards de code: type hints, docstrings, gestion d’erreurs et logging.

**Traçabilité AC**:
- AC1: Compte/service et clé d’API pris en charge via `BREVO_API_KEY`.
- AC2: Clé chargée via config backend (variable d’environnement).
- AC3: Service réutilisable `recyclic_api/core/email_service.py` implémenté.
- AC4: Envoi d’un email de test via template `templates/emails/test_email.html`.
- AC5: Tests unitaires avec mocks (`api/tests/test_email_service.py`).

**NFR**:
- Sécurité: OK (clé via env, aucune fuite dans le code).
- Fiabilité: OK (gestion ApiException et exceptions génériques, valeurs de retour booléennes).
- Maintenabilité: OK (service dédié, initialisation lazy, séparation logique/endpoint).
- Performance: OK (appel externe ponctuel; impact négligeable sur le chemin critique).

**Recommandations (futur)**:
- Ajouter métriques/traçage d’envoi (compteur succès/échec).
- Gérer bounces/spam via webhooks Brevo.
- Paramétrer expéditeur par environnement et activer la rotation de secrets.

**Évidence**:
- Dépendance: `sib-api-v3-sdk==7.6.0` dans `api/requirements.txt`.
- Dépendance: `email-validator==2.3.0` ajoutée pour Pydantic `EmailStr`.
- Endpoint: `POST /api/v1/monitoring/test-email`.
- Tests: 8 tests passants (avec mocks Brevo).

Reviewer: Quinn (Test Architect)
Date: 2025-09-17

---

### Tickets de suivi (pour DEV / Dave)

1) Observabilité des envois d’emails (métriques & logs)
   - Référence: `docs/stories/story-email-observability.md`
   - Objectif: Disposer de compteurs succès/échec et de latences pour diagnostiquer rapidement.
   - Importance: Élevée (exploitation/incident)
   - Estimation: S (≈ 0.5 j simple logs+compteurs) à M (≈ 1 j avec export Prometheus + dashboard)
   - Critères d’acceptation:
     - Exposer compteurs `emails_sent_total`, `emails_failed_total`, `email_send_latency_ms` (min/p50/p95)
     - Logs structurés (niveau info/erreur) avec `message_id`, `to_email`, `elapsed_ms`, `provider` (Brevo)
     - (Optionnel) Endpoint/Exporter pour scraping métriques (Prometheus)
   - Tâches:
     - Ajouter timers/compteurs autour de `EmailService.send_email`
     - Enrichir logging structuré (success/error)
     - (Optionnel) Intégrer un exporter Prometheus et un dashboard minimal

2) Gestion des bounces/spam via webhooks Brevo
   - Référence: `docs/stories/story-email-brevo-webhooks.md`
   - Objectif: Mettre à jour l’état d’envoi et gérer bounces/spam complaints.
   - Importance: Élevée (fiabilité des campagnes/notifications)
   - Estimation: M (0.5–1.5 j selon persistance et sécurité)
   - Critères d’acceptation:
     - Endpoint webhook sécurisé (signature/secret) qui accepte les événements Brevo pertinents
     - Persistance des événements (au minimum: `email`, `event`, `timestamp`, `reason`)
     - Mise à jour d’un statut d’envoi consultable (ex: `DELIVERED`, `BOUNCED`, `SPAM`, `BLOCKED`)
     - Logs d’audit et tests unitaires du parseur d’événements
   - Tâches:
     - Créer route `POST /api/v1/email/webhook` (Brevo)
     - Vérifier signature/secret et parser payload
     - Stocker événement et mettre à jour le statut d’envoi
     - Écrire tests unitaires (cas happy/erreur, signature invalide)

3) Paramétrage expéditeur par environnement + rotation de secrets
   - Référence: `docs/stories/story-email-sender-secrets.md`
   - Objectif: Standardiser l’expéditeur (`from_email`, `from_name`) par env et formaliser la rotation de `BREVO_API_KEY`.
   - Importance: Moyenne (hygiène sécurité/ops)
   - Estimation: S (≈ 0.5 j) — M si rotation automatisée
   - Critères d’acceptation:
     - Variables `EMAIL_FROM_NAME` et `EMAIL_FROM_ADDRESS` chargées via config et utilisées par défaut
     - Documentation “runbook” rotation `BREVO_API_KEY` (étapes, rollback)
     - Tests unitaires: vérif du fallback défaut et override custom
   - Tâches:
     - Étendre `config.py` pour `EMAIL_FROM_NAME`/`EMAIL_FROM_ADDRESS`
     - Adapter `EmailService.send_email` pour consommer ces valeurs
     - Ajouter tests d’injection expéditeur et MAJ README/dev-notes

---

### Notes de configuration (Email)

- Variables ajoutées dans `env.example`:
  - `BREVO_API_KEY` (placeholder possible en dev)
  - `BREVO_WEBHOOK_SECRET` (laisser vide en dev → signature ignorée)
  - `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`
- Documentation “Secrets Email (Brevo)” ajoutée dans `README.md`.