from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from recyclic_api.core.auth import get_current_user
from recyclic_api.core.database import get_db
from recyclic_api.models.user import User
from recyclic_api.services.activity_service import ActivityService

router = APIRouter(tags=["activity"])


@router.post("/ping", status_code=status.HTTP_200_OK, summary="Enregistrer l'activité")
async def activity_ping(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Endpoint de ping pour enregistrer l'activité en temps réel."""
    service = ActivityService(db)

    metadata = {
        "last_endpoint": str(request.url.path),
        "last_method": request.method,
        "last_ip": request.client.host if request.client else "unknown",
        "last_user_agent": request.headers.get("user-agent", "unknown"),
    }

    service.record_user_activity(str(current_user.id), metadata=metadata)

    return JSONResponse(content={"status": "ok"})
