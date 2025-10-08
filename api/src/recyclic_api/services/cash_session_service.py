from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta, timezone

from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.cash_register import CashRegister
from uuid import UUID
from recyclic_api.models.user import User
from recyclic_api.schemas.cash_session import CashSessionFilters


class CashSessionService:
    """Service pour la gestion des sessions de caisse."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self, operator_id: str, site_id: str, initial_amount: float, register_id: Optional[str] = None) -> CashSession:
        """Crée une nouvelle session de caisse."""
        # Vérifier que l'opérateur existe
        # Ensure UUID types for DB comparisons
        operator_uuid = UUID(str(operator_id)) if not isinstance(operator_id, UUID) else operator_id
        site_uuid = UUID(str(site_id)) if not isinstance(site_id, UUID) else site_id
        register_uuid: Optional[UUID]
        if register_id is not None:
            register_uuid = UUID(str(register_id)) if not isinstance(register_id, UUID) else register_id
        else:
            register_uuid = None

        operator = self.db.query(User).filter(User.id == operator_uuid).first()
        if not operator:
            raise ValueError("Opérateur non trouvé")

        # Déterminer le registre à utiliser si non fourni (compatibilité tests existants)
        if register_uuid is None:
            # Chercher un poste actif pour le site, sinon en créer un par défaut
            default_register = (
                self.db.query(CashRegister)
                .filter(
                    CashRegister.is_active.is_(True),
                    CashRegister.site_id == site_uuid,
                )
                .first()
            )
            if default_register is None:
                default_register = CashRegister(name="Default Register", site_id=site_uuid, is_active=True)
                self.db.add(default_register)
                self.db.commit()
                self.db.refresh(default_register)
            register_uuid = default_register.id  # type: ignore[assignment]

        # Unicité: pas de session ouverte pour ce registre
        existing_register_open = self.db.query(CashSession).filter(
            CashSession.register_id == register_uuid,
            CashSession.status == CashSessionStatus.OPEN
        ).first()
        if existing_register_open:
            raise ValueError("Une session est déjà ouverte pour ce poste de caisse")
        
        # Créer la session
        cash_session = CashSession(
            operator_id=operator_uuid,
            site_id=site_uuid,
            register_id=register_uuid,
            initial_amount=initial_amount,
            current_amount=initial_amount,
            status=CashSessionStatus.OPEN
        )
        
        self.db.add(cash_session)
        self.db.commit()
        self.db.refresh(cash_session)
        
        return cash_session
    
    def get_session_by_id(self, session_id: str) -> Optional[CashSession]:
        """Récupère une session par son ID."""
        sid = UUID(str(session_id)) if not isinstance(session_id, UUID) else session_id
        return self.db.query(CashSession).filter(CashSession.id == sid).first()
    
    def get_session_with_details(self, session_id: str) -> Optional[CashSession]:
        """Récupère une session avec toutes ses relations (opérateur, site, ventes)."""
        from sqlalchemy.orm import selectinload
        
        sid = UUID(str(session_id)) if not isinstance(session_id, UUID) else session_id
        return (
            self.db.query(CashSession)
            .options(
                selectinload(CashSession.operator),
                selectinload(CashSession.site),
                selectinload(CashSession.sales)
            )
            .filter(CashSession.id == sid)
            .first()
        )
    
    def get_open_session_by_operator(self, operator_id: str) -> Optional[CashSession]:
        """Récupère la session ouverte d'un opérateur."""
        oid = UUID(str(operator_id)) if not isinstance(operator_id, UUID) else operator_id
        return self.db.query(CashSession).filter(
            and_(
                CashSession.operator_id == oid,
                CashSession.status == CashSessionStatus.OPEN
            )
        ).first()

    def get_open_session_by_register(self, register_id: str) -> Optional[CashSession]:
        """Récupère la session ouverte pour un poste de caisse donné."""
        rid = UUID(str(register_id)) if not isinstance(register_id, UUID) else register_id
        return (
            self.db.query(CashSession)
            .filter(
                and_(
                    CashSession.register_id == rid,
                    CashSession.status == CashSessionStatus.OPEN,
                )
            )
            .first()
        )
    
    def get_sessions_with_filters(self, filters: CashSessionFilters) -> Tuple[List[CashSession], int]:
        """Récupère les sessions avec filtres et pagination."""
        query = self.db.query(CashSession)
        
        # Appliquer les filtres
        if filters.status:
            query = query.filter(CashSession.status == filters.status)
        
        if filters.operator_id:
            oid = UUID(str(filters.operator_id)) if not isinstance(filters.operator_id, UUID) else filters.operator_id
            query = query.filter(CashSession.operator_id == oid)
        
        if filters.site_id:
            sid = UUID(str(filters.site_id)) if not isinstance(filters.site_id, UUID) else filters.site_id
            query = query.filter(CashSession.site_id == sid)

        if getattr(filters, 'register_id', None):
            rid = UUID(str(filters.register_id)) if not isinstance(filters.register_id, UUID) else filters.register_id
            query = query.filter(CashSession.register_id == rid)

        if filters.date_from:
            query = query.filter(CashSession.opened_at >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(CashSession.opened_at <= filters.date_to)
        
        # Compter le total
        total = query.count()
        
        # Appliquer la pagination et l'ordre
        sessions = query.order_by(desc(CashSession.opened_at)).offset(filters.skip).limit(filters.limit).all()
        
        return sessions, total
    
    def update_session(self, session_id: str, update_data: Dict[str, Any]) -> Optional[CashSession]:
        """Met à jour une session de caisse."""
        session = self.get_session_by_id(session_id)
        if not session:
            return None
        
        # Mettre à jour les champs fournis
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(session, field) and value is not None:
                setattr(session, field, value)
        
        # Si on ferme la session, mettre à jour la date de fermeture
        if update_data.status == CashSessionStatus.CLOSED:
            session.closed_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def close_session(self, session_id: str) -> Optional[CashSession]:
        """Ferme une session de caisse."""
        session = self.get_session_by_id(session_id)
        if not session:
            return None
        
        if session.status == CashSessionStatus.CLOSED:
            return session
        
        session.status = CashSessionStatus.CLOSED
        session.closed_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(session)
        
        return session

    def close_session_with_amounts(self, session_id: str, actual_amount: float, variance_comment: str = None) -> Optional[CashSession]:
        """Ferme une session de caisse avec contrôle des montants."""
        session = self.get_session_by_id(session_id)
        if not session:
            return None
        
        if session.status == CashSessionStatus.CLOSED:
            return session
        
        # Utiliser la nouvelle méthode du modèle
        session.close_with_amounts(actual_amount, variance_comment)
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def add_sale_to_session(self, session_id: str, amount: float) -> bool:
        """Ajoute une vente à une session."""
        session = self.get_session_by_id(session_id)
        if not session or session.status != CashSessionStatus.OPEN:
            return False
        
        session.add_sale(amount)
        self.db.commit()
        
        return True
    
    def get_session_stats(self, date_from: Optional[datetime] = None,
                         date_to: Optional[datetime] = None,
                         site_id: Optional[str] = None) -> Dict[str, Any]:
        """Récupère les statistiques des sessions."""
        query = self.db.query(CashSession)
        
        if site_id:
            sid = UUID(str(site_id)) if not isinstance(site_id, UUID) else site_id
            query = query.filter(CashSession.site_id == sid)
        
        # Appliquer les filtres de date
        if date_from:
            query = query.filter(CashSession.opened_at >= date_from)
        if date_to:
            query = query.filter(CashSession.opened_at <= date_to)
        
        # Statistiques de base
        total_sessions = query.count()
        open_sessions = query.filter(CashSession.status == CashSessionStatus.OPEN).count()
        closed_sessions = query.filter(CashSession.status == CashSessionStatus.CLOSED).count()
        
        # Totaux des ventes
        total_sales_result = query.filter(CashSession.status == CashSessionStatus.CLOSED).with_entities(
            func.sum(CashSession.total_sales)
        ).scalar()
        total_sales = total_sales_result or 0.0
        
        # Total des articles
        total_items_result = query.filter(CashSession.status == CashSessionStatus.CLOSED).with_entities(
            func.sum(CashSession.total_items)
        ).scalar()
        total_items = total_items_result or 0
        
        # Durée moyenne des sessions fermées
        closed_sessions_with_duration = query.filter(
            and_(
                CashSession.status == CashSessionStatus.CLOSED,
                CashSession.closed_at.isnot(None)
            )
        ).all()
        
        if closed_sessions_with_duration:
            total_duration = sum(
                (session.closed_at - session.opened_at).total_seconds() / 3600
                for session in closed_sessions_with_duration
            )
            average_duration = total_duration / len(closed_sessions_with_duration)
        else:
            average_duration = None
        
        return {
            "total_sessions": total_sessions,
            "open_sessions": open_sessions,
            "closed_sessions": closed_sessions,
            "total_sales": total_sales,
            "total_items": total_items,
            "average_session_duration": average_duration
        }
    
    def get_operator_sessions(self, operator_id: str, limit: int = 10) -> List[CashSession]:
        """Récupère les dernières sessions d'un opérateur."""
        oid = UUID(str(operator_id)) if not isinstance(operator_id, UUID) else operator_id
        return self.db.query(CashSession).filter(
            CashSession.operator_id == oid
        ).order_by(desc(CashSession.opened_at)).limit(limit).all()
    
    def get_daily_sessions(self, date: datetime) -> List[CashSession]:
        """Récupère les sessions d'une journée donnée."""
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        return self.db.query(CashSession).filter(
            and_(
                CashSession.opened_at >= start_of_day,
                CashSession.opened_at < end_of_day
            )
        ).order_by(CashSession.opened_at).all()
