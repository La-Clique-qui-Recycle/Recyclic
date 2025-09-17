"""
API endpoints pour recevoir les notifications de l'API backend
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import logging
from ..services.notification_service import notification_service
from ..webhook_server import get_telegram_app

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notify", tags=["notifications"])

class ApprovalNotificationRequest(BaseModel):
    telegram_id: str
    user_name: str
    message: Optional[str] = None

class RejectionNotificationRequest(BaseModel):
    telegram_id: str
    user_name: str
    reason: Optional[str] = None

class AdminNotificationRequest(BaseModel):
    admin_user_id: str
    target_user_name: str
    action: str

@router.post("/approval")
async def notify_approval(request: ApprovalNotificationRequest):
    """Notifier un utilisateur que son inscription a été approuvée"""
    try:
        success = await notification_service.notify_registration_approved(
            telegram_id=request.telegram_id,
            user_name=request.user_name
        )
        
        if success:
            return {"status": "success", "message": "Notification d'approbation envoyée"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible d'envoyer la notification d'approbation"
            )
            
    except Exception as e:
        logger.error(f"Erreur lors de la notification d'approbation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de la notification: {str(e)}"
        )

@router.post("/rejection")
async def notify_rejection(request: RejectionNotificationRequest):
    """Notifier un utilisateur que son inscription a été rejetée"""
    try:
        success = await notification_service.notify_registration_rejected(
            telegram_id=request.telegram_id,
            user_name=request.user_name,
            reason=request.reason
        )
        
        if success:
            return {"status": "success", "message": "Notification de rejet envoyée"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible d'envoyer la notification de rejet"
            )
            
    except Exception as e:
        logger.error(f"Erreur lors de la notification de rejet: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de la notification: {str(e)}"
        )

@router.post("/admin")
async def notify_admin(request: AdminNotificationRequest):
    """Notifier les admins qu'un utilisateur a été traité"""
    try:
        # Pour l'instant, on log l'action
        # TODO: Implémenter la notification aux autres admins
        logger.info(f"Admin {request.admin_user_id} a {request.action} l'utilisateur {request.target_user_name}")
        
        return {"status": "success", "message": "Notification admin enregistrée"}
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de la notification admin: {str(e)}"
        )
