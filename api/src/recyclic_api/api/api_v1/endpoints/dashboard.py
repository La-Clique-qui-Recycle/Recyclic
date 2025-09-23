import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from recyclic_api.core.audit import log_admin_access
from recyclic_api.core.auth import require_admin_role
from recyclic_api.core.config import settings
from recyclic_api.core.database import get_db
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.cash_session import CashSessionFilters, CashSessionSummary
from recyclic_api.schemas.dashboard import DashboardMetrics, DashboardStatsResponse, RecentReport
from recyclic_api.services.cash_session_service import CashSessionService
from recyclic_api.utils.financial_security import encrypt_string
from recyclic_api.utils.rate_limit import conditional_rate_limit

router = APIRouter(prefix="/dashboard", tags=["admin", "dashboard"])

RECENT_SESSION_LIMIT = 5
RECENT_REPORT_LIMIT = 5
_REPORT_FILENAME_PATTERN = re.compile(r"^cash_session_([0-9a-fA-F-]{36})_")


def _cash_session_service(db: Session) -> CashSessionService:
    return CashSessionService(db)


def _to_summary(session: CashSession) -> CashSessionSummary:
    operator_label = str(session.operator_id)
    operator = getattr(session, "operator", None)
    if operator is not None:
        full_name = getattr(operator, "full_name", None)
        username = getattr(operator, "username", None)
        telegram = getattr(operator, "telegram_id", None)
        operator_label = full_name or username or telegram or str(session.operator_id)

    return CashSessionSummary(
        session_id=str(session.id),
        site_id=str(session.site_id),
        operator=operator_label,
        opened_at=session.opened_at,
        closed_at=session.closed_at,
        initial_amount=session.initial_amount,
        current_amount=session.current_amount,
        total_sales=session.total_sales or 0.0,
        total_items=session.total_items or 0,
        status=session.status,
    )


def _recent_reports(service: CashSessionService, site_id: Optional[str]) -> List[RecentReport]:
    reports_dir = Path(settings.CASH_SESSION_REPORT_DIR)
    reports_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        [item for item in reports_dir.glob("*.csv") if item.is_file()],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )

    normalised_site: Optional[str] = None
    if site_id:
        try:
            normalised_site = str(UUID(str(site_id)))
        except (ValueError, TypeError) as exc:
            raise HTTPException(status_code=400, detail="site_id invalide") from exc

    selected: List[RecentReport] = []
    for file in files:
        if len(selected) >= RECENT_REPORT_LIMIT:
            break
        match = _REPORT_FILENAME_PATTERN.match(file.name)
        if not match:
            continue
        session_id = match.group(1)
        if normalised_site:
            session = service.get_session_by_id(session_id)
            if not session or str(session.site_id) != normalised_site:
                continue
        stat = file.stat()
        generated_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
        selected.append(
            RecentReport(
                filename=file.name,
                download_url=f"{settings.API_V1_STR}/admin/reports/cash-sessions/{file.name}",
                generated_at=generated_at,
                size_bytes=stat.st_size,
            )
        )
    return selected


@conditional_rate_limit("15/minute")
@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    request: Request,
    site_id: Optional[str] = Query(None, description="Filtrer les statistiques par site"),
    date_from: Optional[datetime] = Query(None, description="Date de debut (ISO 8601)"),
    date_to: Optional[datetime] = Query(None, description="Date de fin (ISO 8601)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role),
) -> DashboardStatsResponse:
    service = _cash_session_service(db)

    normalised_site: Optional[str] = None
    if site_id:
        try:
            normalised_site = str(UUID(str(site_id)))
        except (ValueError, TypeError) as exc:
            log_admin_access(
                str(current_user.id),
                current_user.username or "Unknown",
                "/admin/dashboard/stats",
                success=False,
                error_message="invalid_site_id",
            )
            raise HTTPException(status_code=400, detail="site_id invalide") from exc

    stats = service.get_session_stats(date_from=date_from, date_to=date_to, site_id=normalised_site)

    metrics_model = DashboardMetrics(**stats)
    encrypted_metrics = encrypt_string(json.dumps(metrics_model.model_dump()))

    filters = CashSessionFilters(
        skip=0,
        limit=RECENT_SESSION_LIMIT,
        site_id=normalised_site,
        status=None,
        operator_id=None,
        date_from=date_from,
        date_to=date_to,
    )
    sessions, _ = service.get_sessions_with_filters(filters)
    recent_sessions_models = [_to_summary(session) for session in sessions]

    reports_models = _recent_reports(service, normalised_site)

    log_admin_access(
        str(current_user.id),
        current_user.username or "Unknown",
        "/admin/dashboard/stats",
        success=True,
    )

    payload = DashboardStatsResponse(
        metrics=metrics_model.model_dump(),
        encrypted_metrics=encrypted_metrics,
        recent_reports=[report.model_dump() if hasattr(report, "model_dump") else report for report in reports_models],
        recent_sessions=[summary.model_dump() if hasattr(summary, "model_dump") else summary for summary in recent_sessions_models],
    )
    return payload.model_dump(by_alias=True)

