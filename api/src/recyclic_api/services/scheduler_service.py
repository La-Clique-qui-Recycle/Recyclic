"""
Service de planification des tâches pour le système Recyclic.

Ce service gère l'exécution périodique des tâches de maintenance,
de monitoring et de rapports automatiques.
"""

import logging
import asyncio
from typing import Dict, List, Callable, Any, Optional
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager

from recyclic_api.core.database import get_db
from recyclic_api.core.database import SessionLocal
from recyclic_api.services.anomaly_detection_service import get_anomaly_detection_service
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.user import User
from recyclic_api.models.sync_log import SyncLog
from sqlalchemy import and_

logger = logging.getLogger(__name__)


class ScheduledTask:
    """Représente une tâche planifiée."""

    def __init__(self, name: str, func: Callable, interval_minutes: int, enabled: bool = True):
        self.name = name
        self.func = func
        self.interval_minutes = interval_minutes
        self.enabled = enabled
        self.last_run: Optional[datetime] = None
        self.next_run: Optional[datetime] = None
        self.running = False

    def should_run(self) -> bool:
        """Détermine si la tâche doit être exécutée maintenant."""
        if not self.enabled or self.running:
            return False

        if self.next_run is None:
            return True

        return datetime.now(timezone.utc) >= self.next_run

    def update_next_run(self):
        """Met à jour la prochaine exécution."""
        now = datetime.now(timezone.utc)
        self.last_run = now
        self.next_run = now + timedelta(minutes=self.interval_minutes)

    async def execute(self, *args, **kwargs):
        """Exécute la tâche."""
        if self.running:
            logger.warning(f"Tâche {self.name} déjà en cours d'exécution")
            return

        try:
            self.running = True
            logger.info(f"Démarrage de la tâche {self.name}")

            result = await self.func(*args, **kwargs)

            self.update_next_run()
            logger.info(f"Tâche {self.name} terminée avec succès")

            return result

        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de la tâche {self.name}: {e}")
            self.update_next_run()  # On planifie quand même la prochaine exécution
            raise
        finally:
            self.running = False


class SchedulerService:
    """
    Service de planification des tâches.

    Gère l'exécution périodique des tâches de maintenance et de monitoring.
    """

    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.running = False
        self._task = None

    def add_task(self, name: str, func: Callable, interval_minutes: int, enabled: bool = True):
        """Ajoute une nouvelle tâche planifiée."""
        task = ScheduledTask(name, func, interval_minutes, enabled)
        self.tasks[name] = task
        logger.info(f"Tâche ajoutée: {name} (interval: {interval_minutes} minutes)")

    async def run_anomaly_detection_task(self):
        """Tâche de détection d'anomalies."""
        logger.info("Exécution de la détection d'anomalies")

        # Utiliser un context manager sync pour la session DB
        try:
            with SessionLocal() as db:
                service = get_anomaly_detection_service(db)
                anomalies = await service.run_anomaly_detection()

                # Envoyer les notifications si des anomalies sont détectées
                await service.send_anomaly_notifications(anomalies)

                return anomalies
        except Exception as e:
            logger.error(f"Erreur lors de la détection d'anomalies: {e}")
            raise

    async def run_health_check_task(self):
        """Tâche de vérification de la santé du système."""
        logger.info("Exécution de la vérification de santé")

        # TODO: Implémenter la vérification de santé
        # - Vérifier la connectivité DB
        # - Vérifier la connectivité Redis
        # - Vérifier la connectivité API externe
        # - Vérifier les services critiques

        return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

    async def run_cleanup_task(self):
        """Tâche de nettoyage des données."""
        logger.info("Exécution du nettoyage des données")

        # TODO: Implémenter le nettoyage
        # - Supprimer les logs anciens
        # - Archiver les données anciennes
        # - Nettoyer les fichiers temporaires

        return {"status": "completed", "timestamp": datetime.now(timezone.utc)}

    async def run_weekly_reports_task(self):
        """Tâche de génération des rapports hebdomadaires."""
        logger.info("Exécution de la génération des rapports hebdomadaires")

        try:
            # Calculer la période du rapport (derniers 7 jours)
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=7)

            # Récupérer les statistiques principales
            report_data = await self._generate_weekly_report_data(start_date, end_date)

            # Générer le rapport formaté
            report_text = self._format_weekly_report(report_data, start_date, end_date)

            # Envoyer le rapport par email si possible
            success = await self._send_weekly_report_email(report_text, start_date, end_date)

            return {
                "status": "completed",
                "report_generated": True,
                "email_sent": success,
                "timestamp": datetime.now(timezone.utc)
            }

        except Exception as e:
            logger.error(f"Erreur lors de la génération du rapport hebdomadaire: {e}")
            raise

    async def _generate_weekly_report_data(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Génère les données du rapport hebdomadaire."""
        with SessionLocal() as db:
            # Statistiques des sessions de caisse
            cash_sessions = db.query(CashSession).filter(
                and_(
                    CashSession.opened_at >= start_date,
                    CashSession.opened_at <= end_date
                )
            ).all()

            # Statistiques des ventes
            total_sales = sum(session.total_sales or 0 for session in cash_sessions)
            total_items = sum(session.total_items or 0 for session in cash_sessions)
            session_count = len(cash_sessions)

            # Statistiques des dépôts
            deposits = db.query(Deposit).filter(
                and_(
                    Deposit.created_at >= start_date,
                    Deposit.created_at <= end_date
                )
            ).all()

            # Statistiques des utilisateurs
            users = db.query(User).all()

            # Statistiques des erreurs de synchronisation
            sync_errors = db.query(SyncLog).filter(
                and_(
                    SyncLog.created_at >= start_date,
                    SyncLog.created_at <= end_date,
                    SyncLog.status == 'error'
                )
            ).count()

            return {
                'period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'cash_sessions': {
                    'count': session_count,
                    'total_sales': total_sales,
                    'total_items': total_items,
                    'average_session_value': total_sales / session_count if session_count > 0 else 0
                },
                'deposits': {
                    'count': len(deposits)
                },
                'users': {
                    'total': len(users),
                    'active': len([u for u in users if u.is_active])
                },
                'system': {
                    'sync_errors': sync_errors
                }
            }

    def _format_weekly_report(self, data: Dict[str, Any], start_date: datetime, end_date: datetime) -> str:
        """Formate les données du rapport en texte lisible."""
        report = f"""
# Rapport Hebdomadaire Recyclic
## Période: {start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}

## 📊 Résumé des Activités

### Sessions de Caisse
- **Nombre de sessions**: {data['cash_sessions']['count']}
- **Chiffre d'affaires total**: {data['cash_sessions']['total_sales']:.2f}€
- **Nombre total d'articles**: {data['cash_sessions']['total_items']}
- **Valeur moyenne par session**: {data['cash_sessions']['average_session_value']:.2f}€

### Dépôts
- **Nombre de dépôts**: {data['deposits']['count']}

### Utilisateurs
- **Total utilisateurs**: {data['users']['total']}
- **Utilisateurs actifs**: {data['users']['active']}

### Système
- **Erreurs de synchronisation**: {data['system']['sync_errors']}

## 📈 Tendances

Ce rapport montre l'activité de la semaine écoulée.
Le système de monitoring détecte automatiquement les anomalies
et envoie des notifications en cas de problème.

---
*Rapport généré automatiquement le {datetime.now(timezone.utc).strftime('%d/%m/%Y à %H:%M')}*
        """.strip()

        return report

    async def _send_weekly_report_email(self, report_text: str, start_date: datetime, end_date: datetime) -> bool:
        """Envoie le rapport hebdomadaire par email."""
        try:
            # TODO: Implémenter l'envoi d'email
            # Pour l'instant, on logue le rapport
            logger.info("Rapport hebdomadaire généré:")
            logger.info(report_text)

            # Ici on pourrait utiliser le service email existant
            # Pour l'instant, on retourne True pour indiquer que le rapport a été généré
            return True

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du rapport hebdomadaire: {e}")
            return False

    def setup_default_tasks(self):
        """Configure les tâches par défaut."""
        # Détection d'anomalies toutes les 30 minutes
        self.add_task(
            name="anomaly_detection",
            func=self.run_anomaly_detection_task,
            interval_minutes=30,
            enabled=True
        )

        # Vérification de santé toutes les 5 minutes
        self.add_task(
            name="health_check",
            func=self.run_health_check_task,
            interval_minutes=5,
            enabled=True
        )

        # Nettoyage quotidien à 2h du matin
        self.add_task(
            name="cleanup",
            func=self.run_cleanup_task,
            interval_minutes=1440,  # 24h
            enabled=True
        )

        # Rapports hebdomadaires tous les lundis à 8h
        self.add_task(
            name="weekly_reports",
            func=self.run_weekly_reports_task,
            interval_minutes=10080,  # 7 jours
            enabled=True
        )

    async def run_scheduler_loop(self):
        """Boucle principale du scheduler."""
        logger.info("Démarrage du scheduler")

        while self.running:
            try:
                now = datetime.now(timezone.utc)

                # Exécuter les tâches qui doivent l'être
                for task in self.tasks.values():
                    if task.should_run():
                        try:
                            await task.execute()
                        except Exception as e:
                            logger.error(f"Erreur dans la tâche {task.name}: {e}")

                # Attendre 1 minute avant la prochaine vérification
                await asyncio.sleep(60)

            except Exception as e:
                logger.error(f"Erreur dans la boucle du scheduler: {e}")
                await asyncio.sleep(60)  # Attendre avant de réessayer

    async def start(self):
        """Démarre le scheduler."""
        if self.running:
            logger.warning("Le scheduler est déjà en cours d'exécution")
            return

        self.running = True
        self._task = asyncio.create_task(self.run_scheduler_loop())

        # Configuration initiale des tâches
        self.setup_default_tasks()

        logger.info("Scheduler démarré avec succès")

    async def stop(self):
        """Arrête le scheduler."""
        if not self.running:
            logger.warning("Le scheduler n'est pas en cours d'exécution")
            return

        logger.info("Arrêt du scheduler")
        self.running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("Scheduler arrêté")

    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut du scheduler."""
        tasks_status = []
        for task in self.tasks.values():
            tasks_status.append({
                'name': task.name,
                'enabled': task.enabled,
                'last_run': task.last_run.isoformat() if task.last_run else None,
                'next_run': task.next_run.isoformat() if task.next_run else None,
                'running': task.running,
                'interval_minutes': task.interval_minutes
            })

        return {
            'running': self.running,
            'tasks': tasks_status,
            'total_tasks': len(self.tasks)
        }

    def enable_task(self, name: str):
        """Active une tâche."""
        if name in self.tasks:
            self.tasks[name].enabled = True
            logger.info(f"Tâche {name} activée")

    def disable_task(self, name: str):
        """Désactive une tâche."""
        if name in self.tasks:
            self.tasks[name].enabled = False
            logger.info(f"Tâche {name} désactivée")


# Instance globale du scheduler
scheduler_service = SchedulerService()


def get_scheduler_service() -> SchedulerService:
    """Factory function pour récupérer l'instance du scheduler."""
    return scheduler_service
