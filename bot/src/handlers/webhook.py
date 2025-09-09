from fastapi import APIRouter, Request, HTTPException
from telegram import Update
from telegram.ext import Application
import logging
import json
from ..services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/webhook/telegram")
async def telegram_webhook(request: Request, application: Application):
    """Handle incoming Telegram webhook updates"""
    try:
        # Parse the incoming update
        update_data = await request.json()
        update = Update.de_json(update_data, application.bot)
        
        # Process the update
        await application.process_update(update)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook Telegram: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook/registration-created")
async def registration_created_webhook(request: Request):
    """Handle notification when a new registration request is created"""
    try:
        data = await request.json()
        
        # Notifier les admins
        success = await notification_service.notify_new_registration_request(data)
        
        if success:
            return {"status": "notifications_sent", "admin_count": len(notification_service.admin_ids)}
        else:
            return {"status": "notification_failed"}
            
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook d'inscription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook/registration-approved")
async def registration_approved_webhook(request: Request):
    """Handle notification when a registration request is approved"""
    try:
        data = await request.json()
        
        # Notifier l'utilisateur
        success = await notification_service.notify_registration_approved(
            data.get("telegram_id"),
            data.get("user_name", "utilisateur")
        )
        
        return {"status": "notification_sent" if success else "notification_failed"}
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook d'approbation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook/registration-rejected")
async def registration_rejected_webhook(request: Request):
    """Handle notification when a registration request is rejected"""
    try:
        data = await request.json()
        
        # Notifier l'utilisateur
        success = await notification_service.notify_registration_rejected(
            data.get("telegram_id"),
            data.get("user_name", "utilisateur"),
            data.get("reason")
        )
        
        return {"status": "notification_sent" if success else "notification_failed"}
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook de rejet: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
