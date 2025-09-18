"""
Email endpoints for webhook handling and status tracking.
"""
import logging
from typing import Dict, Any, Optional

from fastapi import APIRouter, Request, HTTPException, Depends, Header, Query
from sqlalchemy.orm import Session

from recyclic_api.core.database import get_db
from recyclic_api.core.config import settings
from recyclic_api.services.email_webhook_service import BrevoWebhookService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook")
async def brevo_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_mailin_signature: Optional[str] = Header(None, alias="X-Mailin-Signature")
):
    """
    Handle Brevo webhook events for email delivery status updates.

    This endpoint receives notifications from Brevo about email events
    like deliveries, bounces, spam complaints, etc.

    Args:
        request: FastAPI request object containing the webhook payload
        db: Database session
        x_mailin_signature: Brevo webhook signature for verification

    Returns:
        Confirmation of webhook processing
    """
    try:
        # Get raw payload for signature verification
        raw_payload = await request.body()

        # Parse JSON payload
        try:
            payload = await request.json()
        except Exception as e:
            logger.error(f"Invalid JSON in webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        # Initialize webhook service
        webhook_service = BrevoWebhookService(db)

        # Verify webhook signature if configured
        if settings.BREVO_WEBHOOK_SECRET and x_mailin_signature:
            if not webhook_service.verify_webhook_signature(
                raw_payload, x_mailin_signature, settings.BREVO_WEBHOOK_SECRET
            ):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        elif settings.BREVO_WEBHOOK_SECRET:
            logger.warning("Webhook secret configured but no signature provided")
            raise HTTPException(status_code=401, detail="Missing webhook signature")

        # Process the webhook event
        result = webhook_service.process_webhook_event(payload)

        return {
            "success": True,
            "message": "Webhook processed successfully",
            "event_id": result.get("event_id"),
            "event_type": result.get("event_type")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing webhook: {str(e)}"
        )


@router.get("/status/{email_address}")
async def get_email_status(
    email_address: str,
    message_id: Optional[str] = Query(None, description="Optional message ID for specific lookup"),
    db: Session = Depends(get_db)
):
    """
    Get the current delivery status of an email.

    Args:
        email_address: Email address to check status for
        message_id: Optional message ID for specific email lookup
        db: Database session

    Returns:
        Email status information
    """
    try:
        webhook_service = BrevoWebhookService(db)
        status = webhook_service.get_email_status(email_address, message_id)

        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"No email status found for {email_address}"
            )

        return {
            "success": True,
            "email_status": status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting email status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting email status: {str(e)}"
        )


@router.get("/events/{email_address}")
async def get_email_events(
    email_address: str,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of events to return"),
    db: Session = Depends(get_db)
):
    """
    Get recent events for an email address.

    Args:
        email_address: Email address to get events for
        limit: Maximum number of events to return (1-100)
        db: Database session

    Returns:
        List of recent email events
    """
    try:
        webhook_service = BrevoWebhookService(db)
        events = webhook_service.get_email_events(email_address, limit)

        return {
            "success": True,
            "email_address": email_address,
            "events_count": len(events),
            "events": events
        }

    except Exception as e:
        logger.error(f"Error getting email events: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting email events: {str(e)}"
        )


@router.get("/health")
async def email_service_health():
    """
    Health check for email service components.

    Returns:
        Health status of email service dependencies
    """
    health_status = {
        "webhook_endpoint": "healthy",
        "database": "unknown",
        "configuration": {}
    }

    # Check configuration
    health_status["configuration"] = {
        "brevo_api_key_configured": bool(settings.BREVO_API_KEY),
        "webhook_secret_configured": bool(settings.BREVO_WEBHOOK_SECRET)
    }

    # Simple database check
    try:
        # This will be expanded when we add the actual database dependency
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"

    # Determine overall status
    overall_status = "healthy"
    if health_status["database"] != "healthy":
        overall_status = "degraded"
    if not health_status["configuration"]["brevo_api_key_configured"]:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "components": health_status,
        "timestamp": "2025-09-17"  # This would be dynamic in real implementation
    }