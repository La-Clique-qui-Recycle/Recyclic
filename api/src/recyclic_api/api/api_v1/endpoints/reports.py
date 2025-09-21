import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from recyclic_api.utils.report_tokens import generate_download_token, verify_download_token
from recyclic_api.utils.rate_limit import conditional_rate_limit
from recyclic_api.core.audit import log_cash_session_access, log_admin_access
from recyclic_api.core.auth import require_role_strict
from recyclic_api.core.config import settings
from recyclic_api.core.database import get_db
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.report import ReportEntry, ReportListResponse

router = APIRouter()

logger = logging.getLogger(__name__)

_SESSION_FILENAME_PATTERN = re.compile(r"^cash_session_([0-9a-fA-F-]{36})_")


def _reports_directory() -> Path:
    directory = Path(settings.CASH_SESSION_REPORT_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _extract_session_id(filename: str) -> UUID | None:
    match = _SESSION_FILENAME_PATTERN.match(filename)
    if not match:
        return None
    try:
        return UUID(match.group(1))
    except ValueError:
        return None


def _ensure_session_access(user: User, session: CashSession) -> None:
    if user.role == UserRole.SUPER_ADMIN:
        return
    if user.role == UserRole.ADMIN:
        if user.site_id and session.site_id and user.site_id != session.site_id:
            raise HTTPException(status_code=403, detail="Acces restreint aux rapports de votre site")


@conditional_rate_limit("30/minute")
@router.get("/cash-sessions", response_model=ReportListResponse, summary="Lister les rapports de sessions de caisse")
def list_cash_session_reports(
    request: Request,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> ReportListResponse:
    """Return the available cash session reports for administrators."""
    log_admin_access(str(current_user.id), current_user.username or "Unknown", "/admin/reports/cash-sessions", success=True)
    directory = _reports_directory()

    files = sorted(
        [file for file in directory.glob("*.csv") if file.is_file()],
        key=lambda candidate: candidate.stat().st_mtime,
        reverse=True,
    )

    reports: List[ReportEntry] = []
    for file in files:
        stat_result = file.stat()
        reports.append(
            ReportEntry(
                filename=file.name,
                size_bytes=stat_result.st_size,
                modified_at=datetime.fromtimestamp(stat_result.st_mtime, tz=timezone.utc),
                download_url=f"{settings.API_V1_STR}/admin/reports/cash-sessions/{file.name}?token={generate_download_token(file.name)}",
            )
        )

    return ReportListResponse(reports=reports, total=len(reports))


@conditional_rate_limit("60/minute")
@router.get(
    "/cash-sessions/{filename}",
    response_class=FileResponse,
    summary="Telecharger un rapport de session de caisse",
)
def download_cash_session_report(
    request: Request,
    filename: str,
    token: str = Query(..., description="Jeton d'Acces signe"),
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Serve the requested cash session report as a CSV file."""
    safe_name = Path(filename).name
    endpoint_path = f"/admin/reports/cash-sessions/{safe_name}"

    if safe_name != filename or safe_name.startswith('.'):
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message="filename_validation_failed",
        )
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")

    if not verify_download_token(token, safe_name):
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message="token_invalid_or_expired",
        )
        raise HTTPException(status_code=403, detail="Lien de telechargement invalide ou expire")

    session_id = _extract_session_id(safe_name)
    if session_id is None:
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message="invalid_report_format",
        )
        raise HTTPException(status_code=400, detail="Format de rapport inconnu")

    cash_session = db.query(CashSession).filter(CashSession.id == session_id).first()
    if cash_session is None:
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message="session_not_found",
        )
        raise HTTPException(status_code=404, detail="Session de caisse introuvable")

    try:
        _ensure_session_access(current_user, cash_session)
    except HTTPException as exc:
        log_cash_session_access(
            str(current_user.id),
            current_user.username or "Unknown",
            str(session_id),
            "download_report",
            success=False,
            error_message=exc.detail,
        )
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message=exc.detail,
        )
        raise

    file_path = _reports_directory() / safe_name
    if not file_path.exists() or not file_path.is_file():
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message="report_missing",
        )
        raise HTTPException(status_code=404, detail="Rapport introuvable")

    log_cash_session_access(
        str(current_user.id),
        current_user.username or "Unknown",
        str(session_id),
        "download_report",
    )
    log_admin_access(
        str(current_user.id),
        current_user.username or "Unknown",
        endpoint_path,
        success=True,
    )

    return FileResponse(file_path, media_type="text/csv", filename=safe_name)





