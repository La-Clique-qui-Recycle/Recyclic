"""Tests for the kDrive synchronization service (Story 4.2)."""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from recyclic_api.core.config import settings
from recyclic_api.services import sync_service
from recyclic_api.services.sync_service import (
    KDriveSyncService,
    UploadFailedError,
    schedule_periodic_kdrive_sync,
)


class DummyClient:
    """In-memory WebDAV client used for tests."""

    def __init__(self, failures_before_success: int = 0) -> None:
        self.failures_before_success = failures_before_success
        self.uploads: list[tuple[str, str]] = []
        self.mkdir_calls: list[str] = []
        self.check_calls: list[str] = []
        self.existing_dirs: set[str] = {""}  # Root directory
        self.attempts = 0

    def upload_sync(self, remote_path: str, local_path: str) -> None:
        self.attempts += 1
        if self.failures_before_success > 0:
            self.failures_before_success -= 1
            raise RuntimeError("simulated upload failure")
        self.uploads.append((remote_path, local_path))

    def check(self, path: str) -> bool:
        normalized = path.rstrip("/")
        self.check_calls.append(normalized)
        return normalized in self.existing_dirs

    def mkdir(self, path: str) -> None:
        normalized = path.rstrip("/")
        self.mkdir_calls.append(normalized)
        self.existing_dirs.add(normalized)


def _client_factory(client: DummyClient):
    def _factory() -> DummyClient:
        return client

    return _factory


def test_upload_file_to_kdrive_success(tmp_path: Path) -> None:
    local_file = tmp_path / "export.csv"
    local_file.write_text("ok", encoding="utf-8")

    client = DummyClient()
    service = KDriveSyncService(client_factory=_client_factory(client), max_retries=3, retry_delay_seconds=0)

    remote_path = service.upload_file_to_kdrive(local_file, "/exports/export.csv")

    assert remote_path == "/exports/export.csv"
    assert client.uploads == [("/exports/export.csv", str(local_file))]
    assert "/exports" in client.mkdir_calls


def test_upload_file_retries_then_success(tmp_path: Path) -> None:
    local_file = tmp_path / "retry.csv"
    local_file.write_text("retry", encoding="utf-8")

    client = DummyClient(failures_before_success=2)
    service = KDriveSyncService(client_factory=_client_factory(client), max_retries=3, retry_delay_seconds=0)

    remote_path = service.upload_file_to_kdrive(local_file, "/exports/retry.csv")

    assert remote_path == "/exports/retry.csv"
    assert client.attempts == 3
    assert len(client.uploads) == 1


def test_upload_file_failure_triggers_notification(monkeypatch, tmp_path: Path) -> None:
    local_file = tmp_path / "failure.csv"
    local_file.write_text("ko", encoding="utf-8")

    client = DummyClient(failures_before_success=5)
    service = KDriveSyncService(client_factory=_client_factory(client), max_retries=2, retry_delay_seconds=0)

    monkeypatch.setattr(settings, "ADMIN_TELEGRAM_IDS", "123")

    called: dict[str, tuple[str, str, str]] = {}

    async def fake_notify(file_path: str, remote_path: str, error_message: str) -> bool:
        called["args"] = (file_path, remote_path, error_message)
        return True

    monkeypatch.setattr(sync_service.telegram_service, "notify_sync_failure", fake_notify)

    with pytest.raises(UploadFailedError):
        service.upload_file_to_kdrive(local_file, "/exports/failure.csv")

    assert "args" in called
    assert called["args"][0] == str(local_file)
    assert called["args"][1] == "/exports/failure.csv"
    assert "simulated" in called["args"][2]


def test_sync_directory_uploads_all_files(tmp_path: Path) -> None:
    base_dir = tmp_path / "exports"
    base_dir.mkdir()
    file_a = base_dir / "a.csv"
    file_a.write_text("a", encoding="utf-8")
    nested_dir = base_dir / "nested"
    nested_dir.mkdir()
    file_b = nested_dir / "b.csv"
    file_b.write_text("b", encoding="utf-8")

    client = DummyClient()
    service = KDriveSyncService(client_factory=_client_factory(client), max_retries=1, retry_delay_seconds=0)

    uploaded = service.sync_directory(base_dir, "/backup")

    assert set(uploaded) == {file_a, file_b}
    assert ("/backup/a.csv", str(file_a)) in client.uploads
    assert ("/backup/nested/b.csv", str(file_b)) in client.uploads


def test_schedule_periodic_sync_disabled(monkeypatch) -> None:
    monkeypatch.setattr(settings, "KDRIVE_SYNC_ENABLED", False)
    assert schedule_periodic_kdrive_sync() is None


@pytest.mark.asyncio
async def test_schedule_periodic_sync_enabled(monkeypatch):
    monkeypatch.setattr(settings, "KDRIVE_SYNC_ENABLED", True)

    # Replace the sync service to avoid touching real config
    monkeypatch.setattr(sync_service, "KDriveSyncService", lambda: object())

    async def fake_run_periodic_exports_sync() -> None:
        return None

    monkeypatch.setattr(sync_service, "run_periodic_exports_sync", fake_run_periodic_exports_sync)

    task = schedule_periodic_kdrive_sync()
    assert task is not None
    await task
    assert task.done()

