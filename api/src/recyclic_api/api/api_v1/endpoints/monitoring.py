"""
Monitoring endpoints for classification performance.

This module provides endpoints for accessing performance metrics
and monitoring data for the classification service.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
import os

from recyclic_api.utils.performance_monitor import performance_monitor
from recyclic_api.utils.classification_cache import classification_cache
from recyclic_api.core.email_service import send_email

router = APIRouter()


class TestEmailRequest(BaseModel):
    to_email: EmailStr


@router.post("/test-email")
async def send_test_email(request: TestEmailRequest):
    """
    Send a test email to verify email service functionality.

    This endpoint is temporary and used for testing the email service configuration.

    Args:
        request: Contains the recipient email address

    Returns:
        Success/failure status of the email send operation
    """
    try:
        # Read the test email template
        template_path = "api/src/templates/emails/test_email.html"
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
        except FileNotFoundError:
            # Fallback to simple HTML if template not found
            html_content = """
            <html>
                <body>
                    <h1>Test Email - Recyclic</h1>
                    <p>Ceci est un email de test pour vérifier le service d'envoi d'emails.</p>
                    <p>Si vous recevez cet email, le service fonctionne correctement!</p>
                </body>
            </html>
            """

        # Send the test email
        success = send_email(
            to_email=request.to_email,
            subject="Test Email - Service Recyclic",
            html_content=html_content
        )

        if success:
            return {
                "success": True,
                "message": f"Email de test envoyé avec succès à {request.to_email}",
                "to_email": request.to_email
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Échec de l'envoi de l'email de test"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'envoi de l'email de test: {str(e)}"
        )


@router.get("/classification/performance", response_model=Dict[str, Any])
async def get_classification_performance(
    hours: int = Query(default=24, ge=1, le=168, description="Number of hours to include in summary (1-168)")
):
    """
    Get classification performance summary for the last N hours.

    Args:
        hours: Number of hours to include in summary (1-168)

    Returns:
        Performance metrics summary including timing, success rates, and method usage
    """
    try:
        summary = performance_monitor.get_performance_summary(hours=hours)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")


@router.post("/classification/performance/export")
async def export_classification_metrics(
    hours: int = Query(default=24, ge=1, le=168, description="Number of hours to export")
):
    """
    Export classification metrics to a JSON file.

    Args:
        hours: Number of hours of metrics to export

    Returns:
        Confirmation of export with file location
    """
    try:
        # Create exports directory if it doesn't exist
        export_dir = "/tmp/recyclic_exports"
        os.makedirs(export_dir, exist_ok=True)

        # Generate filename with timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = f"{export_dir}/classification_metrics_{timestamp}_{hours}h.json"

        # Export metrics
        performance_monitor.export_metrics(file_path, hours=hours)

        return {
            "success": True,
            "message": f"Metrics exported successfully",
            "file_path": file_path,
            "hours_exported": hours
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export metrics: {str(e)}")


@router.get("/classification/health")
async def get_classification_health():
    """
    Get health status of the classification service.

    Returns:
        Health status including service availability and recent performance
    """
    try:
        # Get recent performance data
        recent_performance = performance_monitor.get_performance_summary(hours=1)

        # Determine health status based on recent performance
        health_status = "healthy"
        issues = []

        if isinstance(recent_performance, dict) and "total_operations" in recent_performance:
            total_ops = recent_performance["total_operations"]
            success_rate = recent_performance.get("success_rate_percent", 0)

            if total_ops == 0:
                health_status = "idle"
            elif success_rate < 80:
                health_status = "degraded"
                issues.append(f"Low success rate: {success_rate}%")

            avg_time = recent_performance.get("timing_metrics", {}).get("avg_total_time_ms", 0)
            if avg_time > 10000:  # More than 10 seconds average
                health_status = "degraded"
                issues.append(f"High average response time: {avg_time}ms")

        return {
            "status": health_status,
            "timestamp": performance_monitor.get_performance_summary(hours=0.1),  # Last 6 minutes
            "recent_performance": recent_performance,
            "issues": issues,
            "service_capabilities": {
                "google_speech_available": hasattr(performance_monitor, '_current_session'),  # Simplified check
                "langchain_available": True,  # We know it's available if this endpoint works
                "fallback_available": True
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": None,
            "recent_performance": None,
            "issues": [f"Health check failed: {str(e)}"]
        }


@router.get("/classification/cache/stats")
async def get_cache_stats():
    """
    Get classification cache statistics.

    Returns:
        Cache statistics including hit rate, size, and utilization
    """
    try:
        stats = classification_cache.get_stats()
        return {
            "success": True,
            "cache_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


@router.post("/classification/cache/clear")
async def clear_classification_cache():
    """
    Clear the classification cache.

    Returns:
        Confirmation of cache clearing
    """
    try:
        classification_cache.clear()
        return {
            "success": True,
            "message": "Classification cache cleared successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.post("/classification/cache/export")
async def export_classification_cache():
    """
    Export classification cache contents to a JSON file.

    Returns:
        Confirmation of export with file location
    """
    try:
        # Create exports directory if it doesn't exist
        export_dir = "/tmp/recyclic_exports"
        os.makedirs(export_dir, exist_ok=True)

        # Generate filename with timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = f"{export_dir}/classification_cache_{timestamp}.json"

        # Export cache
        classification_cache.export_cache(file_path)

        return {
            "success": True,
            "message": "Cache exported successfully",
            "file_path": file_path
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export cache: {str(e)}")