"""
Service for managing email logs.
"""
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from recyclic_api.models.email_log import EmailLog, EmailStatus, EmailType
from recyclic_api.models.user import User


class EmailLogService:
    """Service for managing email logs."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_email_log(
        self,
        recipient_email: str,
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
        email_type: EmailType = EmailType.OTHER,
        user_id: Optional[str] = None,
        recipient_name: Optional[str] = None,
        external_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EmailLog:
        """Create a new email log entry."""
        
        email_log = EmailLog(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            email_type=email_type,
            user_id=user_id,
            external_id=external_id,
            additional_data=json.dumps(metadata) if metadata else None,
            status=EmailStatus.PENDING
        )
        
        self.db.add(email_log)
        self.db.commit()
        self.db.refresh(email_log)
        
        return email_log
    
    def update_email_status(
        self,
        email_log_id: str,
        status: EmailStatus,
        external_id: Optional[str] = None,
        error_message: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> Optional[EmailLog]:
        """Update the status of an email log entry."""
        
        email_log = self.db.query(EmailLog).filter(EmailLog.id == email_log_id).first()
        if not email_log:
            return None
        
        email_log.status = status
        if external_id:
            email_log.external_id = external_id
        if error_message:
            email_log.error_message = error_message
        
        # Update appropriate timestamp based on status
        now = timestamp or datetime.utcnow()
        if status == EmailStatus.SENT:
            email_log.sent_at = now
        elif status == EmailStatus.DELIVERED:
            email_log.delivered_at = now
        elif status == EmailStatus.OPENED:
            email_log.opened_at = now
        elif status == EmailStatus.CLICKED:
            email_log.clicked_at = now
        elif status == EmailStatus.BOUNCED:
            email_log.bounced_at = now
        
        self.db.commit()
        self.db.refresh(email_log)
        
        return email_log
    
    def update_email_status_by_external_id(
        self,
        external_id: str,
        status: EmailStatus,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Met à jour le statut d'un email par son external_id (ID Brevo).
        
        Args:
            external_id: ID externe de l'email (ID Brevo)
            status: Nouveau statut
            additional_data: Données supplémentaires du webhook
            
        Returns:
            bool: True si l'email a été trouvé et mis à jour, False sinon
        """
        from sqlalchemy import and_
        from datetime import datetime, timezone
        
        # Rechercher l'email par external_id
        email_log = self.db.query(EmailLog).filter(
            EmailLog.external_id == external_id
        ).first()
        
        if not email_log:
            return False
        
        # Mettre à jour le statut
        email_log.status = status
        now = datetime.now(timezone.utc)
        
        # Mettre à jour les timestamps selon le statut
        if status == EmailStatus.SENT:
            email_log.sent_at = now
        elif status == EmailStatus.DELIVERED:
            email_log.delivered_at = now
        elif status == EmailStatus.OPENED:
            email_log.opened_at = now
        elif status == EmailStatus.CLICKED:
            email_log.clicked_at = now
        elif status == EmailStatus.BOUNCED:
            email_log.bounced_at = now
        
        # Mettre à jour les données supplémentaires si fournies
        if additional_data:
            import json
            current_data = json.loads(email_log.additional_data) if email_log.additional_data else {}
            current_data.update(additional_data)
            email_log.additional_data = json.dumps(current_data)
        
        self.db.commit()
        self.db.refresh(email_log)
        
        return True
    
    def get_email_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        recipient_email: Optional[str] = None,
        status: Optional[EmailStatus] = None,
        email_type: Optional[EmailType] = None,
        user_id: Optional[str] = None
    ) -> List[EmailLog]:
        """Get email logs with optional filtering."""
        
        query = self.db.query(EmailLog)
        
        # Apply filters
        if recipient_email:
            query = query.filter(EmailLog.recipient_email.ilike(f"%{recipient_email}%"))
        
        if status:
            query = query.filter(EmailLog.status == status)
        
        if email_type:
            query = query.filter(EmailLog.email_type == email_type)
        
        if user_id:
            query = query.filter(EmailLog.user_id == user_id)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(EmailLog.created_at))
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def get_email_log_by_id(self, email_log_id: str) -> Optional[EmailLog]:
        """Get a specific email log by ID."""
        return self.db.query(EmailLog).filter(EmailLog.id == email_log_id).first()
    
    def get_email_logs_by_user(self, user_id: str, limit: int = 50) -> List[EmailLog]:
        """Get email logs for a specific user."""
        return (
            self.db.query(EmailLog)
            .filter(EmailLog.user_id == user_id)
            .order_by(desc(EmailLog.created_at))
            .limit(limit)
            .all()
        )
    
    def get_email_logs_count(
        self,
        recipient_email: Optional[str] = None,
        status: Optional[EmailStatus] = None,
        email_type: Optional[EmailType] = None,
        user_id: Optional[str] = None
    ) -> int:
        """Get the total count of email logs matching the filters."""
        
        query = self.db.query(EmailLog)
        
        # Apply filters
        if recipient_email:
            query = query.filter(EmailLog.recipient_email.ilike(f"%{recipient_email}%"))
        
        if status:
            query = query.filter(EmailLog.status == status)
        
        if email_type:
            query = query.filter(EmailLog.email_type == email_type)
        
        if user_id:
            query = query.filter(EmailLog.user_id == user_id)
        
        return query.count()


