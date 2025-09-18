from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from recyclic_api.models.user import User
from recyclic_api.models.user_status_history import UserStatusHistory
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.sale import Sale
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.schemas.admin import ActivityEvent, UserHistoryResponse


class UserHistoryService:
    """Service pour gérer l'historique des utilisateurs"""
    
    def __init__(self, db: Session):
        self.db = db
        
    @staticmethod
    def _aware(dt: Optional[datetime]) -> Optional[datetime]:
        """Ensure datetime is timezone-aware in UTC for consistent comparisons/sorting."""
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    def get_user_activity_history(
        self,
        user_id: str,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        event_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> UserHistoryResponse:
        """
        Récupère l'historique complet d'activité d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            date_from: Date de début du filtre (optionnel)
            date_to: Date de fin du filtre (optionnel)
            event_type: Type d'événement à filtrer (optionnel)
            skip: Nombre d'éléments à ignorer pour la pagination
            limit: Nombre d'éléments par page
            
        Returns:
            UserHistoryResponse: Réponse contenant les événements et métadonnées de pagination
        """
        try:
            # Normaliser les bornes temporelles en UTC, si fournies
            date_from = self._aware(date_from)
            date_to = self._aware(date_to)

            # Vérifier que l'utilisateur existe
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = self.db.query(User).filter(User.id == user_uuid).first()
            if not user:
                raise ValueError(f"Utilisateur avec l'ID {user_id} non trouvé")
            
            # Récupérer tous les événements
            events = []
            
            # 1. Événements d'administration (changements de statut)
            admin_events = self._get_admin_events(user_uuid, date_from, date_to)
            events.extend(admin_events)
            
            # 2. Événements de connexions
            login_events = self._get_login_events(user_uuid, date_from, date_to)
            events.extend(login_events)

            # 3. Sessions de caisse
            cash_session_events = self._get_cash_session_events(user_uuid, date_from, date_to)
            events.extend(cash_session_events)
            
            # 4. Ventes
            sale_events = self._get_sale_events(user_uuid, date_from, date_to)
            events.extend(sale_events)
            
            # 5. Dépôts
            deposit_events = self._get_deposit_events(user_uuid, date_from, date_to)
            events.extend(deposit_events)
            
            # Appliquer le filtre par type d'événement
            if event_type:
                events = [event for event in events if event.event_type == event_type]
            
            # Trier par date (plus récent en premier)
            events.sort(key=lambda x: x.date, reverse=True)
            
            # Calculer la pagination
            total_count = len(events)
            page = (skip // limit) + 1
            has_next = (skip + limit) < total_count
            has_prev = skip > 0
            
            # Appliquer la pagination
            paginated_events = events[skip:skip + limit]
            
            return UserHistoryResponse(
                user_id=user_id,
                events=paginated_events,
                total_count=total_count,
                page=page,
                limit=limit,
                has_next=has_next,
                has_prev=has_prev
            )
            
        except ValueError:
            # Propager les erreurs métier (ex: utilisateur introuvable)
            raise
        except Exception as e:
            # Préserver un message clair mais laisser l'endpoint mapper en 500
            raise Exception(f"Erreur lors de la récupération de l'historique utilisateur: {str(e)}")
    
    def _get_admin_events(
        self, 
        user_id: uuid.UUID, 
        date_from: Optional[datetime] = None, 
        date_to: Optional[datetime] = None
    ) -> List[ActivityEvent]:
        """Récupère les événements d'administration (changements de statut)"""
        query = self.db.query(UserStatusHistory).filter(UserStatusHistory.user_id == user_id)
        
        # Appliquer les filtres de date
        if date_from:
            query = query.filter(UserStatusHistory.change_date >= date_from)
        if date_to:
            query = query.filter(UserStatusHistory.change_date <= date_to)
        
        history_records = query.order_by(desc(UserStatusHistory.change_date)).all()
        
        events = []
        for record in history_records:
            # Déterminer la description basée sur le changement
            if record.old_status is None:
                description = f"Statut initial défini: {'Actif' if record.new_status else 'Inactif'}"
            else:
                old_status_text = "Actif" if record.old_status else "Inactif"
                new_status_text = "Actif" if record.new_status else "Inactif"
                description = f"Statut modifié de {old_status_text} vers {new_status_text}"
            
            if record.reason:
                description += f" (Raison: {record.reason})"
            
            events.append(ActivityEvent(
                id=record.id,
                event_type="ADMINISTRATION",
                description=description,
                date=self._aware(record.change_date),
                metadata={
                    "old_status": record.old_status,
                    "new_status": record.new_status,
                    "reason": record.reason,
                    "changed_by_admin_id": str(record.changed_by_admin_id)
                }
            ))
        
        return events

    def _get_login_events(
        self,
        user_id: uuid.UUID,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> List[ActivityEvent]:
        """Récupère les événements de connexion (succès/échec)"""
        query = self.db.query(LoginHistory).filter(LoginHistory.user_id == user_id)

        if date_from:
            query = query.filter(LoginHistory.created_at >= date_from)
        if date_to:
            query = query.filter(LoginHistory.created_at <= date_to)

        records = query.order_by(desc(LoginHistory.created_at)).all()

        events: List[ActivityEvent] = []
        for record in records:
            status_text = "CONNECTÉ" if record.success else "ÉCHEC CONNEXION"
            reason_text = f" (Raison: {record.error_type})" if record.error_type else ""
            description = f"{status_text} depuis {record.client_ip or 'IP inconnue'}{reason_text}"

            events.append(ActivityEvent(
                id=record.id,
                event_type="LOGIN",
                description=description,
                date=self._aware(record.created_at),
                metadata={
                    "success": record.success,
                    "client_ip": record.client_ip,
                    "error_type": record.error_type,
                    "username": record.username,
                }
            ))

        return events
    
    def _get_cash_session_events(
        self, 
        user_id: uuid.UUID, 
        date_from: Optional[datetime] = None, 
        date_to: Optional[datetime] = None
    ) -> List[ActivityEvent]:
        """Récupère les événements de sessions de caisse"""
        # Récupérer les sessions de l'utilisateur; filtrage appliqué par événement (open/close)
        sessions = (
            self.db.query(CashSession)
            .filter(CashSession.operator_id == user_id)
            .order_by(desc(CashSession.opened_at))
            .all()
        )
        
        events = []
        for session in sessions:
            # Événement d'ouverture de session
            # Inclure l'événement d'ouverture si dans fenêtre temporelle
            include_open = (
                (date_from is None or (session.opened_at and session.opened_at >= date_from)) and
                (date_to is None or (session.opened_at and session.opened_at <= date_to))
            )
            if include_open:
                events.append(ActivityEvent(
                    id=session.id,
                    event_type="SESSION CAISSE",
                    description=f"Session de caisse ouverte (Montant initial: {session.initial_amount}€)",
                    date=self._aware(session.opened_at),
                    metadata={
                        "session_id": str(session.id),
                        "status": session.status.value,
                        "initial_amount": session.initial_amount,
                        "site_id": str(session.site_id) if session.site_id else None
                    }
                ))
            
            # Événement de fermeture de session (si applicable)
            if session.closed_at:
                include_close = (
                    (date_from is None or (session.closed_at and session.closed_at >= date_from)) and
                    (date_to is None or (session.closed_at and session.closed_at <= date_to))
                )
                if include_close:
                    events.append(ActivityEvent(
                        id=f"{session.id}_closed",
                        event_type="SESSION CAISSE",
                        description=f"Session de caisse fermée (Total ventes: {session.total_sales or 0}€, Items: {session.total_items or 0})",
                        date=self._aware(session.closed_at),
                        metadata={
                            "session_id": str(session.id),
                            "status": session.status.value,
                            "initial_amount": session.initial_amount,
                            "total_sales": session.total_sales,
                            "total_items": session.total_items,
                            "final_amount": session.current_amount
                        }
                    ))
        
        return events
    
    def _get_sale_events(
        self, 
        user_id: uuid.UUID, 
        date_from: Optional[datetime] = None, 
        date_to: Optional[datetime] = None
    ) -> List[ActivityEvent]:
        """Récupère les événements de ventes via les sessions de caisse"""
        # Récupérer les sessions de caisse de l'utilisateur
        cash_sessions = self.db.query(CashSession).filter(CashSession.operator_id == user_id).all()
        session_ids = [session.id for session in cash_sessions]
        
        if not session_ids:
            return []
        
        query = self.db.query(Sale).filter(Sale.cash_session_id.in_(session_ids))
        
        # Appliquer les filtres de date
        if date_from:
            query = query.filter(Sale.created_at >= date_from)
        if date_to:
            query = query.filter(Sale.created_at <= date_to)
        
        sales = query.order_by(desc(Sale.created_at)).all()
        
        events = []
        for sale in sales:
            events.append(ActivityEvent(
                id=sale.id,
                event_type="VENTE",
                description=f"Vente effectuée (Montant: {sale.total_amount}€)",
                date=self._aware(sale.created_at),
                metadata={
                    "sale_id": str(sale.id),
                    "total_amount": sale.total_amount,
                    "cash_session_id": str(sale.cash_session_id)
                }
            ))
        
        return events
    
    def _get_deposit_events(
        self, 
        user_id: uuid.UUID, 
        date_from: Optional[datetime] = None, 
        date_to: Optional[datetime] = None
    ) -> List[ActivityEvent]:
        """Récupère les événements de dépôts"""
        query = self.db.query(Deposit).filter(Deposit.user_id == user_id)
        
        # Appliquer les filtres de date
        if date_from:
            query = query.filter(Deposit.created_at >= date_from)
        if date_to:
            query = query.filter(Deposit.created_at <= date_to)
        
        deposits = query.order_by(desc(Deposit.created_at)).all()
        
        events = []
        for deposit in deposits:
            # Déterminer la description basée sur le statut
            if deposit.status.value == "completed":
                description = f"Dépôt validé: {deposit.description or 'Objet non spécifié'}"
                if deposit.category:
                    description += f" (Catégorie: {deposit.category.value})"
            elif deposit.status.value == "classified":
                description = f"Dépôt classifié: {deposit.description or 'Objet non spécifié'}"
                if deposit.eee_category:
                    description += f" (Catégorie EEE: {deposit.eee_category.value})"
            else:
                description = f"Dépôt créé: {deposit.description or 'Objet non spécifié'} (Statut: {deposit.status.value})"
            
            events.append(ActivityEvent(
                id=deposit.id,
                event_type="DEPOT",
                description=description,
                date=self._aware(deposit.created_at),
                metadata={
                    "deposit_id": str(deposit.id),
                    "status": deposit.status.value,
                    "category": deposit.category.value if deposit.category else None,
                    "eee_category": deposit.eee_category.value if deposit.eee_category else None,
                    "weight": deposit.weight,
                    "confidence_score": deposit.confidence_score,
                    "site_id": str(deposit.site_id) if deposit.site_id else None
                }
            ))
        
        return events
