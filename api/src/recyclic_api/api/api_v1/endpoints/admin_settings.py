from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from recyclic_api.core.audit import log_admin_access
from recyclic_api.core.auth import require_role_strict
from recyclic_api.core.database import get_db
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.admin_settings import AlertThresholds, AlertThresholdsResponse, AlertThresholdsUpdate
from recyclic_api.services.admin_settings_service import AdminSettingsService
from recyclic_api.utils.rate_limit import conditional_rate_limit

router = APIRouter(tags=["admin", "settings"])

DEFAULT_THRESHOLDS = AlertThresholds(cash_discrepancy=10.0, low_inventory=5)


def _service(db: Session) -> AdminSettingsService:
    return AdminSettingsService(db)


@conditional_rate_limit("20/minute")
@router.get("/alert-thresholds", response_model=AlertThresholdsResponse)
def get_alert_thresholds(
    request: Request,
    site_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
) -> AlertThresholdsResponse:
    service = _service(db)
    thresholds = service.get_alert_thresholds(site_id)
    if thresholds is None:
        thresholds = DEFAULT_THRESHOLDS

    log_admin_access(
        str(current_user.id),
        current_user.username or "Unknown",
        "/admin/settings/alert-thresholds",
        success=True,
    )
    payload = AlertThresholdsResponse(thresholds=thresholds, site_id=site_id)
    return payload.model_dump(by_alias=True)


@conditional_rate_limit("10/minute")
@router.put("/alert-thresholds", response_model=AlertThresholdsResponse)
def put_alert_thresholds(
    request: Request,
    payload: AlertThresholdsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
) -> AlertThresholdsResponse:
    service = _service(db)
    try:
        new_thresholds = service.upsert_alert_thresholds(payload.site_id, payload.thresholds)
    except ValueError as exc:
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            "/admin/settings/alert-thresholds",
            success=False,
            error_message=str(exc),
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    log_admin_access(
        str(current_user.id),
        current_user.username or "Unknown",
        "/admin/settings/alert-thresholds",
        success=True,
    )
    payload_response = AlertThresholdsResponse(thresholds=new_thresholds, site_id=payload.site_id)
    return payload_response.model_dump(by_alias=True)
