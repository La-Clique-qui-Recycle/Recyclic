import json
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from recyclic_api.models.admin_setting import AdminSetting
from recyclic_api.schemas.admin_settings import AlertThresholds
from recyclic_api.utils.financial_security import encrypt_string, decrypt_string, FinancialDataError


class AdminSettingsService:
    """Service helper to persist encrypted administrative settings."""

    ALERT_KEY = "alert_thresholds"

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalise_site_id(site_id: Optional[str]) -> Optional[UUID]:
        if site_id in (None, ""):
            return None
        if isinstance(site_id, UUID):
            return site_id
        try:
            return UUID(str(site_id))
        except (TypeError, ValueError) as exc:
            raise ValueError("site_id doit ?tre un UUID valide") from exc

    def _build_query(self, key: str, site_id: Optional[str]):
        query = self.db.query(AdminSetting).filter(AdminSetting.key == key)
        normalised = self._normalise_site_id(site_id)
        if normalised is None:
            query = query.filter(AdminSetting.site_id.is_(None))
        else:
            query = query.filter(AdminSetting.site_id == normalised)
        return query, normalised

    def get_alert_thresholds(self, site_id: Optional[str]) -> Optional[AlertThresholds]:
        query, _ = self._build_query(self.ALERT_KEY, site_id)
        record = query.first()
        if not record:
            return None
        try:
            payload = decrypt_string(record.value_encrypted)
        except FinancialDataError:
            return None
        data = json.loads(payload)
        return AlertThresholds.model_validate(data)

    def upsert_alert_thresholds(self, site_id: Optional[str], thresholds: AlertThresholds) -> AlertThresholds:
        payload = json.dumps(thresholds.model_dump())
        encrypted = encrypt_string(payload)

        query, normalised_site = self._build_query(self.ALERT_KEY, site_id)
        record = query.first()

        if record:
            record.value_encrypted = encrypted
        else:
            record = AdminSetting(
                key=self.ALERT_KEY,
                site_id=normalised_site,
                value_encrypted=encrypted,
            )
            self.db.add(record)

        self.db.commit()
        self.db.refresh(record)
        return thresholds

