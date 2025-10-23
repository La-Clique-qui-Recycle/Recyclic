"""
Endpoints pour les webhooks externes (Brevo, etc.)
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import json

from recyclic_api.core.database import get_db
from recyclic_api.services.email_log_service import EmailLogService
from recyclic_api.models.email_log import EmailStatus

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/brevo/email-status")
async def brevo_email_status_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook pour recevoir les mises à jour de statut des emails de Brevo.
    
    Brevo envoie des webhooks pour les événements suivants :
    - sent: Email envoyé
    - delivered: Email livré
    - opened: Email ouvert
    - clicked: Lien cliqué
    - bounced: Email rebondi
    - blocked: Email bloqué
    - invalid: Email invalide
    - complaint: Plainte (spam)
    """
    try:
        # Récupérer le payload JSON
        payload = await request.json()
        logger.info(f"Webhook Brevo reçu: {json.dumps(payload, indent=2)}")
        
        # Extraire les informations importantes
        event_type = payload.get("event")
        message_id = payload.get("message-id")
        email = payload.get("email")
        timestamp = payload.get("timestamp")
        
        if not message_id or not email:
            logger.warning(f"Webhook Brevo incomplet: {payload}")
            raise HTTPException(status_code=400, detail="Message ID et email requis")
        
        # Créer le service de logs d'email
        email_log_service = EmailLogService(db)
        
        # Mapper les événements Brevo vers nos statuts
        status_mapping = {
            "sent": EmailStatus.SENT,
            "delivered": EmailStatus.DELIVERED,
            "opened": EmailStatus.OPENED,
            "clicked": EmailStatus.CLICKED,
            "bounced": EmailStatus.BOUNCED,
            "blocked": EmailStatus.FAILED,
            "invalid": EmailStatus.FAILED,
            "complaint": EmailStatus.BOUNCED
        }
        
        new_status = status_mapping.get(event_type)
        if not new_status:
            logger.warning(f"Événement Brevo non reconnu: {event_type}")
            return {"status": "ignored", "reason": f"Event type {event_type} not supported"}
        
        # Mettre à jour le statut de l'email
        updated = email_log_service.update_email_status_by_external_id(
            external_id=message_id,
            status=new_status,
            additional_data=payload
        )
        
        if updated:
            logger.info(f"Statut email mis à jour: {message_id} -> {new_status}")
            return {"status": "success", "message": f"Email status updated to {new_status}"}
        else:
            logger.warning(f"Email non trouvé pour message-id: {message_id}")
            return {"status": "not_found", "message": "Email not found in logs"}
            
    except json.JSONDecodeError:
        logger.error("Payload JSON invalide reçu du webhook Brevo")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook Brevo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/brevo/test")
async def test_brevo_webhook():
    """
    Endpoint de test pour vérifier que le webhook est accessible.
    """
    return {
        "status": "ok",
        "message": "Brevo webhook endpoint is accessible",
        "endpoint": "/v1/webhooks/brevo/email-status"
    }
