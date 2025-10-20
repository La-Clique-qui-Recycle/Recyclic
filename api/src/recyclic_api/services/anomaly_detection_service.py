"""
Service de détection d'anomalies pour le système Recyclic.

Ce service analyse les données métier pour détecter les anomalies
telles que les écarts de caisse répétés, les échecs de synchronisation,
et les erreurs de classification IA.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, text
import sqlalchemy.orm

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.sync_log import SyncLog
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.sale import Sale
from recyclic_api.models.user import User
from recyclic_api.models.login_history import LoginHistory

from recyclic_api.services.telegram_service import telegram_service

logger = logging.getLogger(__name__)


class AnomalyDetectionService:
    """
    Service de détection d'anomalies métier.

    Ce service analyse périodiquement les données du système pour détecter:
    - Écarts de caisse répétés
    - Échecs de synchronisation fréquents
    - Erreurs de classification IA
    - Anomalies d'authentification
    """

    def __init__(self, db: Session):
        self.db = db
        self.anomaly_thresholds = {
            'cash_variance_threshold': 10.0,  # Écart de caisse en €
            'sync_failure_threshold': 3,      # Nombre d'échecs consécutifs
            'classification_error_threshold': 5,  # % d'erreurs de classification
            'auth_failure_threshold': 5,      # Nombre d'échecs d'auth consécutifs
        }
        # Cache simple pour éviter les requêtes répétées
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes

    def _is_cache_valid(self, key: str) -> bool:
        """Vérifie si le cache est encore valide pour une clé donnée."""
        if key not in self._cache:
            return False
        
        cache_time, _ = self._cache[key]
        return (datetime.now(timezone.utc) - cache_time).total_seconds() < self._cache_ttl

    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache si elle est valide."""
        if self._is_cache_valid(key):
            return self._cache[key][1]
        return None

    def _set_cache(self, key: str, value: Any):
        """Met une valeur en cache."""
        self._cache[key] = (datetime.now(timezone.utc), value)

    async def run_anomaly_detection(self) -> Dict[str, Any]:
        """
        Exécute la détection d'anomalies complète.

        Returns:
            Dict contenant les anomalies détectées et les recommandations
        """
        logger.info("Démarrage de la détection d'anomalies")

        # Vérifier le cache d'abord
        cache_key = "anomaly_detection"
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            logger.info("Utilisation du cache pour la détection d'anomalies")
            return cached_result

        anomalies = {
            'cash_anomalies': await self._detect_cash_anomalies(),
            'sync_anomalies': await self._detect_sync_anomalies(),
            'auth_anomalies': await self._detect_auth_anomalies(),
            'classification_anomalies': await self._detect_classification_anomalies(),
            'timestamp': datetime.now(timezone.utc)
        }

        recommendations = self._generate_recommendations(anomalies)

        result = {
            'anomalies': anomalies,
            'recommendations': recommendations,
            'summary': {
                'total_anomalies': sum(len(v) for v in anomalies.values() if isinstance(v, list)),
                'critical_anomalies': len([a for a in anomalies.values() if isinstance(a, list) and a])
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        # Mettre en cache le résultat
        self._set_cache(cache_key, result)

        logger.info(f"Détection d'anomalies terminée. Anomalies détectées: {result['summary']['total_anomalies']}")
        return result

    async def _detect_cash_anomalies(self) -> List[Dict[str, Any]]:
        """
        Détecte les anomalies dans les sessions de caisse.

        Returns:
            Liste des anomalies détectées avec détails
        """
        anomalies = []

        try:
            # Récupérer les sessions de caisse avec variance significative
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)

            problematic_sessions = self.db.query(CashSession).filter(
                and_(
                    CashSession.closed_at >= cutoff_date,
                    CashSession.status == CashSessionStatus.CLOSED,
                    CashSession.variance.isnot(None),
                    or_(
                        CashSession.variance > self.anomaly_thresholds['cash_variance_threshold'],
                        CashSession.variance < -self.anomaly_thresholds['cash_variance_threshold']
                    )
                )
            ).options(
                # Optimisation: charger les relations en une seule requête
                sqlalchemy.orm.joinedload(CashSession.operator),
                sqlalchemy.orm.joinedload(CashSession.site)
            ).limit(100).all()  # Limiter à 100 résultats pour éviter les surcharges

            for session in problematic_sessions:
                anomaly = {
                    'type': 'cash_variance',
                    'severity': 'high' if abs(session.variance) > 50 else 'medium',
                    'description': f"Écart de caisse détecté: {session.variance:.2f}€",
                    'details': {
                        'session_id': str(session.id),
                        'operator_id': str(session.operator_id)[:8] + '...' if session.operator_id else 'N/A',
                        'operator_name': session.operator.username[:3] + '***' if session.operator and session.operator.username else 'Inconnu',
                        'site': session.site.name if session.site else 'Inconnu',
                        'variance': float(session.variance),
                        'closing_amount': '***.**' if session.closing_amount else 'N/A',
                        'actual_amount': '***.**' if session.actual_amount else 'N/A',
                        'closed_at': session.closed_at.isoformat() if session.closed_at else None
                    }
                }
                anomalies.append(anomaly)

        except Exception as e:
            logger.error(f"Erreur lors de la détection d'anomalies de caisse: {e}")
            anomalies.append({
                'type': 'detection_error',
                'severity': 'critical',
                'description': f"Erreur dans la détection d'anomalies de caisse: {str(e)}",
                'details': {}
            })

        return anomalies

    async def _detect_sync_anomalies(self) -> List[Dict[str, Any]]:
        """
        Détecte les anomalies de synchronisation.

        Returns:
            Liste des anomalies détectées
        """
        anomalies = []

        try:
            # Analyser les logs de synchronisation des dernières 24h
            cutoff_date = datetime.now(timezone.utc) - timedelta(hours=24)

            recent_syncs = self.db.query(SyncLog).filter(
                SyncLog.created_at >= cutoff_date
            ).order_by(desc(SyncLog.created_at)).limit(1000).all()  # Limiter les résultats

            # Compter les échecs par type de sync
            failure_counts = {}
            for sync in recent_syncs:
                if sync.status == 'error':
                    key = sync.sync_type
                    failure_counts[key] = failure_counts.get(key, 0) + 1

            # Identifier les syncs avec trop d'échecs
            for sync_type, count in failure_counts.items():
                if count >= self.anomaly_thresholds['sync_failure_threshold']:
                    anomaly = {
                        'type': 'sync_failure',
                        'severity': 'high' if count >= 5 else 'medium',
                        'description': f"Trop d'échecs de synchronisation {sync_type}: {count}",
                        'details': {
                            'sync_type': sync_type,
                            'failure_count': count,
                            'recent_syncs': len([s for s in recent_syncs if s.sync_type == sync_type]),
                            'time_range': '24h'
                        }
                    }
                    anomalies.append(anomaly)

        except Exception as e:
            logger.error(f"Erreur lors de la détection d'anomalies de sync: {e}")
            anomalies.append({
                'type': 'detection_error',
                'severity': 'critical',
                'description': f"Erreur dans la détection d'anomalies de sync: {str(e)}",
                'details': {}
            })

        return anomalies

    async def _detect_auth_anomalies(self) -> List[Dict[str, Any]]:
        """
        Détecte les anomalies d'authentification.

        Returns:
            Liste des anomalies détectées
        """
        anomalies = []

        try:
            # Analyser les logs d'authentification des dernières 24h
            cutoff_date = datetime.now(timezone.utc) - timedelta(hours=24)

            recent_logins = self.db.query(LoginHistory).filter(
                LoginHistory.created_at >= cutoff_date
            ).limit(1000).all()  # Limiter les résultats

            # Compter les échecs par utilisateur
            user_failures = {}
            for login in recent_logins:
                if not login.success:
                    user_id = str(login.user_id) if login.user_id else 'unknown'
                    user_failures[user_id] = user_failures.get(user_id, 0) + 1

            # Identifier les utilisateurs avec trop d'échecs
            for user_id, count in user_failures.items():
                if count >= self.anomaly_thresholds['auth_failure_threshold']:
                    anomaly = {
                        'type': 'auth_failure',
                        'severity': 'high' if count >= 10 else 'medium',
                        'description': f"Trop d'échecs d'authentification pour l'utilisateur {user_id[:8]}...: {count}",
                        'details': {
                            'user_id': user_id[:8] + '...' if user_id != 'unknown' else 'unknown',
                            'failure_count': count,
                            'total_attempts': len([l for l in recent_logins if str(l.user_id) == user_id]),
                            'time_range': '24h'
                        }
                    }
                    anomalies.append(anomaly)

        except Exception as e:
            logger.error(f"Erreur lors de la détection d'anomalies d'auth: {e}")
            anomalies.append({
                'type': 'detection_error',
                'severity': 'critical',
                'description': f"Erreur dans la détection d'anomalies d'auth: {str(e)}",
                'details': {}
            })

        return anomalies

    async def _detect_classification_anomalies(self) -> List[Dict[str, Any]]:
        """
        Détecte les anomalies de classification IA.

        Note: Cette fonctionnalité nécessiterait des métriques de classification
        qui ne sont pas encore implémentées dans le système actuel.
        """
        anomalies = []

        # TODO: Implémenter la collecte de métriques de classification
        # Pour l'instant, on retourne une liste vide avec une note
        logger.info("Détection d'anomalies de classification - fonctionnalité à implémenter")

        return anomalies

    def _generate_recommendations(self, anomalies: Dict[str, List]) -> List[Dict[str, Any]]:
        """
        Génère des recommandations basées sur les anomalies détectées et l'analyse préventive.

        Args:
            anomalies: Dictionnaire des anomalies détectées

        Returns:
            Liste des recommandations
        """
        recommendations = []

        # Compter les anomalies par type
        anomaly_counts = {}
        for anomaly_type, anomaly_list in anomalies.items():
            if isinstance(anomaly_list, list):
                anomaly_counts[anomaly_type] = len(anomaly_list)

        # Générer des recommandations basées sur les types d'anomalies
        if anomaly_counts.get('cash_anomalies', 0) > 0:
            recommendations.append({
                'type': 'cash_control',
                'priority': 'high',
                'title': 'Améliorer les contrôles de caisse',
                'description': 'Considérer l\'implémentation de doubles contrôles ou de vérifications automatisées pour les sessions de caisse.',
                'actions': [
                    'Former les opérateurs sur les bonnes pratiques de comptage',
                    'Implémenter un système de double vérification pour les montants élevés',
                    'Ajouter des alertes en temps réel pour les écarts détectés'
                ]
            })

        if anomaly_counts.get('sync_anomalies', 0) > 0:
            recommendations.append({
                'type': 'sync_monitoring',
                'priority': 'medium',
                'title': 'Surveiller les synchronisations',
                'description': 'Les échecs de synchronisation répétés indiquent un problème potentiel avec le système de synchronisation.',
                'actions': [
                    'Vérifier la connectivité réseau',
                    'Contrôler les logs de synchronisation détaillés',
                    'Tester manuellement les processus de synchronisation'
                ]
            })

        if anomaly_counts.get('auth_anomalies', 0) > 0:
            recommendations.append({
                'type': 'auth_security',
                'priority': 'high' if anomaly_counts.get('auth_anomalies', 0) >= 3 else 'medium',
                'title': 'Sécuriser l\'authentification',
                'description': 'Les échecs d\'authentification répétés peuvent indiquer une tentative d\'intrusion.',
                'actions': [
                    'Bloquer temporairement les comptes avec trop d\'échecs',
                    'Ajouter un CAPTCHA pour les tentatives répétées',
                    'Surveiller les logs d\'authentification en temps réel'
                ]
            })

        # Recommandations de maintenance préventive (indépendantes des anomalies)
        recommendations.extend(self._generate_preventive_maintenance_recommendations())

        return recommendations

    def _generate_preventive_maintenance_recommendations(self) -> List[Dict[str, Any]]:
        """
        Génère des recommandations de maintenance préventive basées sur l'analyse des données.

        Returns:
            Liste des recommandations de maintenance préventive
        """
        recommendations = []

        try:
            # Analyser les données pour détecter les tendances nécessitant de la maintenance
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

            # Analyser les sessions de caisse pour détecter les problèmes récurrents
            cash_sessions = self.db.query(CashSession).filter(
                CashSession.opened_at >= cutoff_date
            ).all()

            if len(cash_sessions) > 0:
                # Calculer le taux d'écarts de caisse
                total_sessions = len(cash_sessions)
                sessions_with_variance = len([s for s in cash_sessions if s.variance and abs(s.variance) > 1.0])

                if total_sessions > 0:
                    variance_rate = sessions_with_variance / total_sessions

                    if variance_rate > 0.1:  # Plus de 10% des sessions ont des écarts
                        recommendations.append({
                            'type': 'preventive_cash_training',
                            'priority': 'high',
                            'title': 'Formation sur les contrôles de caisse',
                            'description': f'{variance_rate*100:.1f}% des sessions de caisse ont des écarts. Une formation pourrait améliorer la précision.',
                            'actions': [
                                'Organiser une session de formation sur les bonnes pratiques de comptage',
                                'Créer une checklist de fermeture de caisse',
                                'Implémenter un système de vérification croisée'
                            ]
                        })

            # Analyser les logs de synchronisation pour détecter les problèmes récurrents
            sync_logs = self.db.query(SyncLog).filter(
                SyncLog.created_at >= cutoff_date
            ).all()

            if len(sync_logs) > 0:
                error_rate = len([s for s in sync_logs if s.status == 'error']) / len(sync_logs)

                if error_rate > 0.05:  # Plus de 5% d'erreurs de sync
                    recommendations.append({
                        'type': 'preventive_sync_optimization',
                        'priority': 'medium',
                        'title': 'Optimiser les synchronisations',
                        'description': f'{error_rate*100:.1f}% des synchronisations échouent. Une optimisation pourrait améliorer la fiabilité.',
                        'actions': [
                            'Analyser les patterns d\'échec dans les logs',
                            'Optimiser les paramètres de synchronisation',
                            'Implémenter des retries plus intelligents'
                        ]
                    })

            # Recommandations de maintenance générale
            recommendations.append({
                'type': 'preventive_database_maintenance',
                'priority': 'low',
                'title': 'Maintenance préventive de la base de données',
                'description': 'Maintenance régulière recommandée pour optimiser les performances.',
                'actions': [
                    'Vérifier les index et les optimiser si nécessaire',
                    'Archiver les données anciennes (>1 an)',
                    'Vérifier l\'espace disque disponible',
                    'Contrôler les performances des requêtes lentes'
                ]
            })

            recommendations.append({
                'type': 'preventive_security_review',
                'priority': 'low',
                'title': 'Révision de sécurité périodique',
                'description': 'Audit de sécurité recommandé pour maintenir la conformité.',
                'actions': [
                    'Vérifier les logs d\'authentification pour les anomalies',
                    'Contrôler les permissions utilisateur',
                    'Mettre à jour les dépendances de sécurité',
                    'Tester les sauvegardes et restaurations'
                ]
            })

        except Exception as e:
            logger.error(f"Erreur lors de la génération des recommandations préventives: {e}")
            recommendations.append({
                'type': 'preventive_error',
                'priority': 'medium',
                'title': 'Erreur dans l\'analyse préventive',
                'description': f'Une erreur est survenue lors de l\'analyse: {str(e)}',
                'actions': [
                    'Vérifier les logs du système de monitoring',
                    'Tester manuellement les requêtes de base de données',
                    'Contacter l\'administrateur système'
                ]
            })

        return recommendations

    async def send_anomaly_notifications(self, anomalies: Dict[str, Any]) -> bool:
        """
        Envoie des notifications Telegram pour les anomalies détectées.

        Args:
            anomalies: Résultats de la détection d'anomalies

        Returns:
            True si les notifications ont été envoyées avec succès
        """
        try:
            critical_anomalies = anomalies.get('summary', {}).get('critical_anomalies', 0)
            total_anomalies = anomalies.get('summary', {}).get('total_anomalies', 0)

            if critical_anomalies == 0 and total_anomalies == 0:
                logger.info("Aucune anomalie détectée, pas de notification à envoyer")
                return True

            # Construire le message de notification
            message = "[ALERTE SYSTÈME] Anomalies détectées\n\n"

            if critical_anomalies > 0:
                message += f"🚨 {critical_anomalies} anomalies CRITIQUES détectées\n"

            if total_anomalies > 0:
                message += f"⚠️ {total_anomalies} anomalies au total\n"

            message += f"\n📊 Résumé par type:\n"

            for anomaly_type, anomaly_list in anomalies.get('anomalies', {}).items():
                if isinstance(anomaly_list, list) and anomaly_list:
                    message += f"• {anomaly_type}: {len(anomaly_list)} anomalies\n"

            message += "\n🔧 Recommandations disponibles dans le système de monitoring"

            # Envoyer la notification via Telegram
            success = await telegram_service.notify_sync_failure(
                file_path="system-monitoring",
                remote_path="anomaly-detection",
                error_message=message
            )

            if success:
                logger.info("Notification d'anomalies envoyée avec succès")
            else:
                logger.error("Échec de l'envoi de la notification d'anomalies")

            return success

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi des notifications d'anomalies: {e}")
            return False


# Factory function pour créer le service
def get_anomaly_detection_service(db: Session) -> AnomalyDetectionService:
    """Factory function pour créer une instance du service."""
    return AnomalyDetectionService(db)
