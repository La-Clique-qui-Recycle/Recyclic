"""Services for syncing exports to Infomaniak kDrive (Story 4.2)."""

from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path
from typing import Any, Callable, Optional

try:
    from webdav3.client import Client
except ImportError as import_error:
    Client = Any  # type: ignore[assignment]
    _WEBDAV_IMPORT_ERROR = import_error
else:
    _WEBDAV_IMPORT_ERROR = None

from recyclic_api.core.config import settings
from recyclic_api.services.telegram_service import telegram_service

logger = logging.getLogger(__name__)


class SyncConfigurationError(RuntimeError):
    """Raised when kDrive configuration is incomplete."""


class UploadFailedError(RuntimeError):
    """Raised when a file fails to upload after all retries."""


class KDriveSyncService:
    """Service responsible for pushing local exports to Infomaniak kDrive via WebDAV."""

    def __init__(
        self,
        client_factory: Optional[Callable[[], Client]] = None,
        max_retries: Optional[int] = None,
        retry_delay_seconds: Optional[float] = None,
    ) -> None:
        self._client_factory = client_factory or self._default_client_factory
        self._client: Optional[Client] = None
        self.max_retries = max_retries or settings.KDRIVE_MAX_RETRIES
        self.retry_delay_seconds = retry_delay_seconds or settings.KDRIVE_RETRY_DELAY_SECONDS

    def _default_client_factory(self) -> Client:
        """Instantiate a WebDAV client using environment configuration."""
        if _WEBDAV_IMPORT_ERROR is not None:
            raise SyncConfigurationError(
                "webdavclient3 package is required for kDrive sync"
            ) from _WEBDAV_IMPORT_ERROR

        if not (settings.KDRIVE_WEBDAV_URL and settings.KDRIVE_WEBDAV_USERNAME and settings.KDRIVE_WEBDAV_PASSWORD):
            raise SyncConfigurationError("kDrive credentials are not configured")

        options = {
            "webdav_hostname": settings.KDRIVE_WEBDAV_URL.rstrip("/"),
            "webdav_login": settings.KDRIVE_WEBDAV_USERNAME,
            "webdav_password": settings.KDRIVE_WEBDAV_PASSWORD,
        }
        client = Client(options)
        return client

    def _get_client(self) -> Client:
        if self._client is None:
            self._client = self._client_factory()
        return self._client

    def _reset_client(self) -> None:
        self._client = None

    def upload_file_to_kdrive(self, local_path: Path | str, remote_path: str) -> str:
        """Upload a single file to kDrive with retry logic."""
        local_file = Path(local_path)
        if not local_file.exists() or not local_file.is_file():
            raise FileNotFoundError(f"Local file '{local_file}' does not exist")

        remote_path_normalized = self._normalize_remote_path(remote_path)
        last_error: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            client = self._get_client()
            try:
                self._ensure_remote_directory(client, remote_path_normalized)
                client.upload_sync(remote_path=remote_path_normalized, local_path=str(local_file))
                logger.info(
                    "Uploaded %s to kDrive at %s (attempt %s/%s)",
                    local_file,
                    remote_path_normalized,
                    attempt,
                    self.max_retries,
                )
                return remote_path_normalized
            except Exception as exc:  # noqa: BLE001 - log + retry policy is intentional
                last_error = exc
                logger.warning(
                    "Upload attempt %s/%s failed for %s -> %s: %s",
                    attempt,
                    self.max_retries,
                    local_file,
                    remote_path_normalized,
                    exc,
                )
                self._reset_client()
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay_seconds)

        logger.error(
            "Giving up uploading %s -> %s after %s attempts: %s",
            local_file,
            remote_path_normalized,
            self.max_retries,
            last_error,
        )
        self._schedule_failure_notification(local_file, remote_path_normalized, last_error)
        raise UploadFailedError(
            f"Failed to upload '{local_file}' to '{remote_path_normalized}' after {self.max_retries} attempts"
        ) from last_error

    def sync_directory(self, local_directory: Path | str, remote_directory: str) -> list[Path]:
        """Synchronise every file from a local folder to kDrive."""
        base_dir = Path(local_directory)
        base_dir.mkdir(parents=True, exist_ok=True)

        uploaded: list[Path] = []
        for file_path in sorted(p for p in base_dir.rglob("*") if p.is_file()):
            relative = file_path.relative_to(base_dir).as_posix()
            remote_path = f"{remote_directory.rstrip('/')}/{relative}" if relative else remote_directory.rstrip('/')
            try:
                self.upload_file_to_kdrive(file_path, remote_path)
                uploaded.append(file_path)
            except FileNotFoundError:
                logger.warning("Skipped missing file during sync: %s", file_path)
            except UploadFailedError:
                # Already logged and notification dispatched; continue with next file
                continue

        return uploaded

    def _ensure_remote_directory(self, client: Client, remote_path: str) -> None:
        remote_dir = self._extract_remote_directory(remote_path)
        if not remote_dir:
            return

        try:
            check_path = remote_dir.rstrip("/") + "/"
            if not client.check(check_path):
                client.mkdir(remote_dir)
        except Exception as exc:  # noqa: BLE001 - best effort
            logger.debug("Failed to ensure remote directory %s: %s", remote_dir, exc)

    @staticmethod
    def _extract_remote_directory(remote_path: str) -> str:
        normalized = remote_path.replace("\\", "/").rstrip("/")
        if not normalized or normalized == "/":
            return ""
        parts = normalized.lstrip("/").rsplit("/", 1)
        if len(parts) == 1:
            return ""
        directory = "/" + parts[0]
        return directory

    @staticmethod
    def _normalize_remote_path(remote_path: str) -> str:
        normalized = remote_path.replace("\\", "/")
        if not normalized.startswith("/"):
            normalized = "/" + normalized.lstrip("/")
        return normalized

    def _schedule_failure_notification(
        self,
        local_file: Path,
        remote_path: str,
        error: Exception | None,
    ) -> None:
        if not settings.ADMIN_TELEGRAM_IDS:
            return

        async def _notify() -> None:
            try:
                await telegram_service.notify_sync_failure(
                    file_path=str(local_file),
                    remote_path=remote_path,
                    error_message=str(error) if error else "Unknown error",
                )
            except Exception as exc:  # noqa: BLE001 - avoid crashing callers
                logger.error("Failed to send sync failure notification: %s", exc)

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(_notify())
        except RuntimeError:
            asyncio.run(_notify())


def schedule_periodic_kdrive_sync() -> Optional[asyncio.Task]:
    """Start the periodic background sync if enabled by configuration."""
    if not settings.KDRIVE_SYNC_ENABLED:
        logger.info("kDrive sync disabled; background task not scheduled")
        return None

    try:
        # Instantiate once to validate configuration early.
        KDriveSyncService()
    except SyncConfigurationError as exc:
        logger.error("kDrive sync misconfigured: %s", exc)
        return None

    loop = asyncio.get_running_loop()
    return loop.create_task(run_periodic_exports_sync())


async def run_periodic_exports_sync() -> None:
    """Periodically pushes export files to kDrive."""
    if not settings.KDRIVE_SYNC_ENABLED:
        logger.info("kDrive sync disabled; stopping task")
        return

    try:
        sync_service = KDriveSyncService()
    except SyncConfigurationError as exc:
        logger.error("kDrive sync misconfigured: %s", exc)
        return

    interval = max(int(settings.KDRIVE_SYNC_INTERVAL_SECONDS), 60)
    local_dir = Path(settings.ECOLOGIC_EXPORT_DIR)
    remote_dir = settings.KDRIVE_REMOTE_BASE_PATH or "/"

    logger.info(
        "Starting kDrive sync loop: local=%s remote=%s interval=%ss",
        local_dir,
        remote_dir,
        interval,
    )

    while True:
        try:
            await asyncio.to_thread(sync_service.sync_directory, local_dir, remote_dir)
        except Exception as exc:  # noqa: BLE001 - keep the loop alive while logging
            logger.exception("kDrive sync cycle failed: %s", exc)
        await asyncio.sleep(interval)

