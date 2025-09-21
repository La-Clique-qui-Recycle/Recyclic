"""Services for generating Ecologic-compliant CSV exports (Story 4.1)."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from recyclic_api.core.config import settings
from recyclic_api.models.deposit import Deposit, DepositStatus, EEECategory
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.user import User
from recyclic_api.models.site import Site


@dataclass(frozen=True)
class EcologicCategory:
    code: str
    label: str
    deposit_categories: Tuple[EEECategory, ...]


# Ordered list so CSV rows stay deterministic
ECOLOGIC_CATEGORIES: Tuple[EcologicCategory, ...] = (
    EcologicCategory(
        code="EEE-1",
        label="Gros électroménager",
        deposit_categories=(EEECategory.LARGE_APPLIANCE, EEECategory.AUTOMATIC_DISPENSERS),
    ),
    EcologicCategory(
        code="EEE-2",
        label="Petits appareils ménagers",
        deposit_categories=(EEECategory.SMALL_APPLIANCE,),
    ),
    EcologicCategory(
        code="EEE-3",
        label="Équipements informatiques et télécoms",
        deposit_categories=(EEECategory.IT_EQUIPMENT,),
    ),
    EcologicCategory(
        code="EEE-4",
        label="Équipements d'éclairage",
        deposit_categories=(EEECategory.LIGHTING,),
    ),
    EcologicCategory(
        code="EEE-5",
        label="Outils électriques et électroniques",
        deposit_categories=(EEECategory.TOOLS,),
    ),
    EcologicCategory(
        code="EEE-6",
        label="Jouets et équipements de loisir",
        deposit_categories=(EEECategory.TOYS,),
    ),
    EcologicCategory(
        code="EEE-7",
        label="Dispositifs médicaux",
        deposit_categories=(EEECategory.MEDICAL_DEVICES,),
    ),
    EcologicCategory(
        code="EEE-8",
        label="Instruments de surveillance et autres",
        deposit_categories=(EEECategory.MONITORING_CONTROL, EEECategory.OTHER),
    ),
)

# Deposit statuses considered as finalized for exports
ELIGIBLE_DEPOSIT_STATUSES = (
    DepositStatus.VALIDATED,
    DepositStatus.COMPLETED,
)

CSV_HEADERS: Tuple[str, ...] = (
    "category_code",
    "category_label",
    "deposit_count",
    "deposit_weight_kg",
    "sales_quantity",
    "sales_amount_eur",
    "period_start",
    "period_end",
    "generated_at",
)


def _normalize_datetime(value: date | datetime, end_of_day: bool = False) -> datetime:
    if isinstance(value, datetime):
        return value
    boundary_time = time.max if end_of_day else time.min
    return datetime.combine(value, boundary_time)


def _category_from_deposit(category: Optional[EEECategory], fallback: Optional[EEECategory]) -> Optional[str]:
    resolved = category or fallback
    if not resolved:
        return None
    mapping = _deposit_category_map()
    return mapping.get(resolved.value)


def _deposit_category_map() -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for eco_category in ECOLOGIC_CATEGORIES:
        for deposit_category in eco_category.deposit_categories:
            mapping[deposit_category.value] = eco_category.code
    return mapping


def _initialize_export_totals() -> Dict[str, Dict[str, float]]:
    totals: Dict[str, Dict[str, float]] = {}
    for eco_category in ECOLOGIC_CATEGORIES:
        totals[eco_category.code] = {
            "deposit_count": 0,
            "deposit_weight_kg": 0.0,
            "sales_quantity": 0,
            "sales_amount_eur": 0.0,
        }
    return totals


def generate_ecologic_csv(
    db: Session,
    date_from: date | datetime,
    date_to: date | datetime,
    export_dir: Optional[Path | str] = None,
) -> Path:
    """Generate the Ecologic CSV export for the given period."""
    if date_to < date_from:
        raise ValueError("date_to must be greater than or equal to date_from")

    start_dt = _normalize_datetime(date_from)
    end_dt = _normalize_datetime(date_to, end_of_day=True)

    totals = _initialize_export_totals()
    category_labels = {cat.code: cat.label for cat in ECOLOGIC_CATEGORIES}

    # Aggregate deposits
    deposit_query = (
        db.query(
            Deposit.category,
            Deposit.eee_category,
            func.count(Deposit.id),
            func.coalesce(func.sum(Deposit.weight), 0.0),
        )
        .filter(
            Deposit.created_at >= start_dt,
            Deposit.created_at <= end_dt,
            Deposit.status.in_(ELIGIBLE_DEPOSIT_STATUSES),
        )
        .group_by(Deposit.category, Deposit.eee_category)
    )

    for category, eee_category, count, total_weight in deposit_query.all():
        code = _category_from_deposit(category, eee_category)
        if not code:
            code = "EEE-8"  # Fallback bucket for unmapped categories
        totals[code]["deposit_count"] += int(count or 0)
        totals[code]["deposit_weight_kg"] += float(total_weight or 0.0)

    # Aggregate sales
    sale_query = (
        db.query(
            SaleItem.category,
            func.coalesce(func.sum(SaleItem.quantity), 0),
            func.coalesce(func.sum(SaleItem.total_price), 0.0),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
        )
        .group_by(SaleItem.category)
    )

    for category, quantity, total_amount in sale_query.all():
        code = str(category).strip() if category else None
        if code not in totals:
            # Treat unexpected categories as "EEE-8"
            code = "EEE-8"
        totals[code]["sales_quantity"] += int(quantity or 0)
        totals[code]["sales_amount_eur"] += float(total_amount or 0.0)

    export_path = Path(export_dir) if export_dir else Path(settings.ECOLOGIC_EXPORT_DIR)
    export_path.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"ecologic_export_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}_{timestamp}.csv"
    file_path = export_path / filename

    generated_at = datetime.utcnow().isoformat()

    with file_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for category in ECOLOGIC_CATEGORIES:
            values = totals[category.code]
            writer.writerow(
                {
                    "category_code": category.code,
                    "category_label": category_labels[category.code],
                    "deposit_count": values["deposit_count"],
                    "deposit_weight_kg": round(values["deposit_weight_kg"], 3),
                    "sales_quantity": values["sales_quantity"],
                    "sales_amount_eur": round(values["sales_amount_eur"], 2),
                    "period_start": start_dt.date().isoformat(),
                    "period_end": end_dt.date().isoformat(),
                    "generated_at": generated_at,
                }
            )

    return file_path



def _enforce_report_retention(report_root: Path) -> None:
    """Delete reports older than the configured retention window."""
    retention_days = settings.CASH_SESSION_REPORT_RETENTION_DAYS
    if retention_days <= 0:
        return
    threshold = datetime.utcnow() - timedelta(days=retention_days)
    for candidate in report_root.glob('*.csv'):
        try:
            modified_at = datetime.utcfromtimestamp(candidate.stat().st_mtime)
        except OSError:
            continue
        if modified_at < threshold:
            try:
                candidate.unlink()
            except OSError:
                continue

def generate_cash_session_report(
    db: Session,
    session: CashSession,
    reports_dir: Path | None = None
) -> Path:
    """Generate a detailed CSV report for a cash session (Story 4.2)."""
    report_root = Path(reports_dir or settings.CASH_SESSION_REPORT_DIR)
    report_root.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"cash_session_{session.id}_{timestamp}.csv"
    file_path = report_root / filename

    operator = session.operator or db.query(User).filter(User.id == session.operator_id).first()
    site = session.site or db.query(Site).filter(Site.id == session.site_id).first()

    def _format_amount(value: Optional[float]) -> str:
        if value is None:
            return ''
        return f"{value:.2f}"

    summary_rows = [
        ("Session ID", str(session.id)),
        ("Operator ID", str(session.operator_id)),
        ("Operator Name", (getattr(operator, "full_name", None) or getattr(operator, "username", None) or getattr(operator, "telegram_id", None) or "")),
        ("Site ID", str(session.site_id)),
        ("Site Name", getattr(site, "name", "") or ""),
        ("Opened At", session.opened_at.isoformat() if session.opened_at else ""),
        ("Closed At", session.closed_at.isoformat() if session.closed_at else ""),
        ("Initial Amount", _format_amount(session.initial_amount)),
        ("Closing Amount", _format_amount(session.closing_amount if session.closing_amount is not None else (session.initial_amount + (session.total_sales or 0)))),
        ("Actual Amount", _format_amount(session.actual_amount)),
        ("Variance", _format_amount(session.variance)),
        ("Variance Comment", session.variance_comment or ""),
        ("Total Sales", _format_amount(session.total_sales)),
        ("Total Items", str(session.total_items or 0)),
        ("Report Generated At", datetime.utcnow().isoformat()),
    ]

    sales = db.query(Sale).filter(Sale.cash_session_id == session.id).all()

    with file_path.open('w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['section', 'field', 'value'])
        for label, value in summary_rows:
            writer.writerow(['session_summary', label, value])

        writer.writerow([])
        writer.writerow(['section', 'sale_id', 'sale_created_at', 'item_id', 'category', 'quantity', 'unit_price', 'total_price'])

        for sale in sales:
            sale_created_at = sale.created_at.isoformat() if sale.created_at else ''
            if sale.items:
                for item in sale.items:
                    writer.writerow(['sale_item', str(sale.id), sale_created_at, str(item.id), item.category, str(item.quantity), _format_amount(item.unit_price), _format_amount(item.total_price)])
            else:
                writer.writerow(['sale', str(sale.id), sale_created_at, '', '', '0', _format_amount(0.0), _format_amount(sale.total_amount)])

    _enforce_report_retention(report_root)

    return file_path

def preview_ecologic_export(
    db: Session,
    date_from: date | datetime,
    date_to: date | datetime,
) -> List[Dict[str, float | int | str]]:
    """Helper used by tests or API callers to preview export data without writing file."""
    start_dt = _normalize_datetime(date_from)
    end_dt = _normalize_datetime(date_to, end_of_day=True)

    # Reuse the core aggregation but accumulate results without file IO
    totals = _initialize_export_totals()
    category_labels = {cat.code: cat.label for cat in ECOLOGIC_CATEGORIES}

    deposit_query = (
        db.query(
            Deposit.category,
            Deposit.eee_category,
            func.count(Deposit.id),
            func.coalesce(func.sum(Deposit.weight), 0.0),
        )
        .filter(
            Deposit.created_at >= start_dt,
            Deposit.created_at <= end_dt,
            Deposit.status.in_(ELIGIBLE_DEPOSIT_STATUSES),
        )
        .group_by(Deposit.category, Deposit.eee_category)
    )

    for category, eee_category, count, total_weight in deposit_query.all():
        code = _category_from_deposit(category, eee_category) or "EEE-8"
        totals[code]["deposit_count"] += int(count or 0)
        totals[code]["deposit_weight_kg"] += float(total_weight or 0.0)

    sale_query = (
        db.query(
            SaleItem.category,
            func.coalesce(func.sum(SaleItem.quantity), 0),
            func.coalesce(func.sum(SaleItem.total_price), 0.0),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
        )
        .group_by(SaleItem.category)
    )

    for category, quantity, total_amount in sale_query.all():
        code = str(category).strip() if category else None
        if code not in totals:
            code = "EEE-8"
        totals[code]["sales_quantity"] += int(quantity or 0)
        totals[code]["sales_amount_eur"] += float(total_amount or 0.0)

    generated_at = datetime.utcnow().isoformat()

    preview_rows: List[Dict[str, float | int | str]] = []
    for category in ECOLOGIC_CATEGORIES:
        values = totals[category.code]
        preview_rows.append(
            {
                "category_code": category.code,
                "category_label": category_labels[category.code],
                "deposit_count": values["deposit_count"],
                "deposit_weight_kg": round(values["deposit_weight_kg"], 3),
                "sales_quantity": values["sales_quantity"],
                "sales_amount_eur": round(values["sales_amount_eur"], 2),
                "period_start": start_dt.date().isoformat(),
                "period_end": end_dt.date().isoformat(),
                "generated_at": generated_at,
            }
        )

    return preview_rows
