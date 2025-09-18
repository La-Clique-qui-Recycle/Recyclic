# Runbook: Rotation de la clé API Brevo

## Vue d'ensemble

Ce runbook décrit la procédure de rotation sécurisée de la clé API Brevo (`BREVO_API_KEY`) utilisée par le service email de Recyclic.

**Fréquence recommandée :** Tous les 6 mois ou en cas de compromission suspectée.

---

## Pré-requis

- [ ] Accès administrateur au compte Brevo
- [ ] Accès aux environnements de production et staging
- [ ] Outils de déploiement configurés
- [ ] Accès aux logs d'application
- [ ] Fenêtre de maintenance planifiée (recommandée)

---

## Procédure de rotation

### Phase 1: Préparation

1. **Vérifier l'état actuel**
   ```bash
   # Vérifier que le service email fonctionne
   curl -X POST "${API_URL}/api/v1/monitoring/test-email" \
     -H "Content-Type: application/json" \
     -d '{"to_email": "test@recyclic.fr"}'

   # Vérifier les métriques email
   curl "${API_URL}/api/v1/monitoring/email/metrics?hours=1"
   ```

2. **Documenter la configuration actuelle**
   ```bash
   # Noter l'ID de la clé actuelle dans Brevo (pour référence)
   echo "Clé actuelle: BREVO_API_KEY_ID_$(date +%Y%m%d)" >> rotation.log
   ```

### Phase 2: Création de la nouvelle clé

3. **Créer une nouvelle clé API dans Brevo**
   - Se connecter à [Brevo](https://app.brevo.com)
   - Aller dans **Paramètres** → **SMTP & API**
   - Cliquer sur **+ NOUVELLE CLÉ API**
   - Nommer la clé : `recyclic-api-key-$(date +%Y%m%d)`
   - **IMPORTANT :** Copier la clé immédiatement (elle ne sera plus affichée)

4. **Tester la nouvelle clé en staging**
   ```bash
   # Mettre à jour la variable d'environnement en staging
   export BREVO_API_KEY="xkeysib-NEW_KEY_HERE"

   # Redémarrer le service staging
   docker-compose restart api

   # Tester l'envoi d'email
   curl -X POST "${STAGING_API_URL}/api/v1/monitoring/test-email" \
     -H "Content-Type: application/json" \
     -d '{"to_email": "test@recyclic.fr"}'
   ```

### Phase 3: Déploiement en production

5. **Mise à jour de la production**
   ```bash
   # Sauvegarder l'ancienne clé
   echo "Ancienne clé: $BREVO_API_KEY" >> rotation-backup-$(date +%Y%m%d).log

   # Mettre à jour la variable d'environnement
   # Méthode 1: Via fichier .env (si déploiement local)
   sed -i 's/BREVO_API_KEY=.*/BREVO_API_KEY="xkeysib-NEW_KEY_HERE"/' .env

   # Méthode 2: Via système de déploiement (recommandé)
   # Suivre la procédure spécifique à votre infrastructure
   ```

6. **Redémarrage du service**
   ```bash
   # Redémarrer le service API
   docker-compose restart api

   # Vérifier que le service démarre correctement
   docker-compose logs api | tail -20
   ```

### Phase 4: Validation

7. **Tests de validation**
   ```bash
   # Test de santé du service
   curl "${API_URL}/api/v1/email/health"

   # Test d'envoi d'email
   curl -X POST "${API_URL}/api/v1/monitoring/test-email" \
     -H "Content-Type: application/json" \
     -d '{"to_email": "admin@recyclic.fr"}'

   # Vérifier les métriques
   curl "${API_URL}/api/v1/monitoring/email/metrics?hours=1"
   ```

8. **Surveillance post-déploiement**
   ```bash
   # Surveiller les logs pendant 15 minutes
   docker-compose logs -f api | grep -i email

   # Vérifier les métriques d'erreur
   curl "${API_URL}/api/v1/monitoring/email/metrics?hours=1" | \
     jq '.metrics.failure_count'
   ```

### Phase 5: Nettoyage

9. **Révocation de l'ancienne clé**
   - Retourner dans Brevo → **Paramètres** → **SMTP & API**
   - Localiser l'ancienne clé API
   - Cliquer sur **Supprimer** à côté de l'ancienne clé
   - **ATTENTION :** Attendre au moins 1 heure après validation pour éviter les interruptions

10. **Documentation**
    ```bash
    # Documenter la rotation
    echo "$(date): Rotation réussie - Nouvelle clé activée" >> rotation.log
    echo "Ancienne clé révoquée: $(date)" >> rotation.log
    ```

---

## Procédure de rollback d'urgence

En cas de problème avec la nouvelle clé :

### Rollback immédiat

1. **Restaurer l'ancienne clé**
   ```bash
   # Restaurer depuis la sauvegarde
   OLD_KEY=$(cat rotation-backup-$(date +%Y%m%d).log | grep "Ancienne clé" | cut -d: -f2-)
   export BREVO_API_KEY="$OLD_KEY"
   ```

2. **Redémarrer le service**
   ```bash
   docker-compose restart api
   ```

3. **Valider le rollback**
   ```bash
   curl -X POST "${API_URL}/api/v1/monitoring/test-email" \
     -H "Content-Type: application/json" \
     -d '{"to_email": "admin@recyclic.fr"}'
   ```

### Rollback avec nouvelle clé

Si l'ancienne clé a déjà été révoquée :

1. **Créer une nouvelle clé d'urgence dans Brevo**
2. **Suivre la procédure de déploiement rapide**
3. **Documenter l'incident**

---

## Surveillance et alertes

### Métriques à surveiller

- **Taux d'échec d'envoi** : `emails_failed_total` doit rester < 5%
- **Latence d'envoi** : `email_send_latency_ms` doit rester < 2000ms
- **Erreurs d'authentification** : Logs contenant "401" ou "Invalid API key"

### Commandes de surveillance

```bash
# Tableau de bord des métriques email (dernière heure)
curl -s "${API_URL}/api/v1/monitoring/email/metrics?hours=1" | \
  jq '{
    total: .metrics.total_emails,
    success_rate: .metrics.success_rate_percent,
    avg_latency: .metrics.latency_metrics.avg_ms,
    errors: .metrics.error_breakdown
  }'

# Alertes automatiques (exemple avec script)
#!/bin/bash
METRICS=$(curl -s "${API_URL}/api/v1/monitoring/email/metrics?hours=1")
FAILURE_RATE=$(echo $METRICS | jq '.metrics.failure_count / .metrics.total_emails * 100')

if (( $(echo "$FAILURE_RATE > 10" | bc -l) )); then
  echo "ALERTE: Taux d'échec email élevé: ${FAILURE_RATE}%"
  # Envoyer notification d'alerte
fi
```

---

## Troubleshooting

### Erreurs courantes

| Erreur | Cause probable | Solution |
|--------|----------------|----------|
| `401 Unauthorized` | Clé API invalide ou révoquée | Vérifier la clé dans Brevo |
| `403 Forbidden` | Quota dépassé ou compte suspendu | Vérifier le compte Brevo |
| `500 Internal Server Error` | Configuration incorrecte | Vérifier les variables d'environnement |

### Logs utiles

```bash
# Erreurs de service email
docker-compose logs api | grep -i "email.*error"

# Métriques en temps réel
watch -n 5 'curl -s ${API_URL}/api/v1/monitoring/email/metrics?hours=1 | jq .metrics.success_rate_percent'
```

---

## Contacts d'urgence

- **Équipe DevOps** : devops@recyclic.fr
- **Support Brevo** : https://help.brevo.com
- **Responsable produit** : product@recyclic.fr

---

## Historique des rotations

| Date | Opérateur | Statut | Notes |
|------|-----------|--------|-------|
| 2025-09-17 | James (Dev Agent) | Documentation créée | Procédure initiale |
| | | | |

---

**Version du document :** 1.0
**Dernière mise à jour :** 2025-09-17
**Prochaine révision :** 2025-12-17