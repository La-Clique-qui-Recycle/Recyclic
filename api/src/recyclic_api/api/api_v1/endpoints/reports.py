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

# Pattern pour extraire l'UUID de session depuis le nom de fichier
# Supporte les deux formats :
# - Ancien: cash_session_{uuid}_{timestamp}.csv
# - Nouveau: session_caisse_{date}_{operator}_{site}_{uuid}_{timestamp}.csv
_SESSION_FILENAME_PATTERN = re.compile(r"(?:cash_session_|session_caisse_[^_]+_[^_]+_[^_]+_)([0-9a-fA-F-]{36})_")


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
    "/cash-sessions/by-session/{session_id}",
    response_class=FileResponse,
    summary="Télécharger un rapport de session de caisse par ID de session",
)
def download_cash_session_report_by_id(
    request: Request,
    session_id: UUID,
    current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Génère et télécharge le rapport CSV d'une session de caisse par son ID."""
    cash_session = db.query(CashSession).filter(CashSession.id == session_id).first()
    if cash_session is None:
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            f"/admin/reports/cash-sessions/by-session/{session_id}",
            success=False,
            error_message="session_not_found",
        )
        raise HTTPException(status_code=404, detail="Session de caisse introuvable")

    try:
        _ensure_session_access(current_user, cash_session)
    except HTTPException as exc:
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            f"/admin/reports/cash-sessions/by-session/{session_id}",
            success=False,
            error_message=exc.detail,
        )
        raise

    # Générer le rapport avec le nouveau format
    from recyclic_api.services.export_service import generate_cash_session_report
    
    try:
        report_path = generate_cash_session_report(db, cash_session)
        
        log_cash_session_access(
            str(current_user.id),
            current_user.username or "Unknown",
            str(session_id),
            "download_report",
        )
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            f"/admin/reports/cash-sessions/by-session/{session_id}",
            success=True,
        )
        
        return FileResponse(report_path, media_type="text/csv", filename=report_path.name)
    except Exception as e:
        logger.error(f"Error generating report for session {session_id}: {e}", exc_info=True)
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            f"/admin/reports/cash-sessions/by-session/{session_id}",
            success=False,
            error_message=f"report_generation_failed: {str(e)}",
        )
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du rapport")


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

    # Régénérer le rapport avec le nouveau format (au lieu de servir l'ancien fichier)
    # Cela garantit que tous les rapports téléchargés utilisent le nouveau format amélioré
    from recyclic_api.services.export_service import generate_cash_session_report
    
    try:
        # Régénérer le rapport avec le nouveau format
        report_path = generate_cash_session_report(db, cash_session)
        download_token = generate_download_token(report_path.name)
        
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
        
        return FileResponse(report_path, media_type="text/csv", filename=report_path.name)
    except Exception as e:
        logger.error(f"Error regenerating report for session {session_id}: {e}", exc_info=True)
        # Fallback: essayer de servir l'ancien fichier s'il existe
        file_path = _reports_directory() / safe_name
        if file_path.exists() and file_path.is_file():
            log_admin_access(
                str(current_user.id),
                current_user.username or "Unknown",
                endpoint_path,
                success=True,
            )
            return FileResponse(file_path, media_type="text/csv", filename=safe_name)
        
        log_admin_access(
            str(current_user.id),
            current_user.username or "Unknown",
            endpoint_path,
            success=False,
            error_message=f"report_generation_failed: {str(e)}",
        )
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du rapport")





